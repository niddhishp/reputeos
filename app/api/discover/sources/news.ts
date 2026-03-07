/**
 * SOURCE MODULE: News & Media
 *
 * Architecture fix (March 2026):
 * - Added Google News engine searches (was only using Google Web before)
 * - Added entertainment/Bollywood RSS feeds
 * - Fixed Exa domain list to include entertainment outlets
 * - Made Exa domain selection industry-aware
 * - Hardcoded anchor queries that always run regardless of AI query generator
 */

import { SourceResult, SourceModuleResult, ClientProfile, fetchRSS } from './types';
import { newsSearch, webSearch } from '@/lib/api/fallback-search';

const SERPAPI_KEY = () => process.env.SERPAPI_KEY ?? '';

// ── RSS Feed lists ──────────────────────────────────────────────────────────

const BUSINESS_RSS_FEEDS = [
  { name: 'Economic Times',    url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms' },
  { name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss' },
  { name: 'Livemint',          url: 'https://www.livemint.com/rss/news' },
  { name: 'Forbes India',      url: 'https://www.forbesindia.com/blog/feed/' },
  { name: 'YourStory',         url: 'https://yourstory.com/feed' },
  { name: 'Inc42',             url: 'https://inc42.com/feed/' },
];

const ENTERTAINMENT_RSS_FEEDS = [
  { name: 'Times of India Movies',  url: 'https://timesofindia.indiatimes.com/rss/entertainment/movies.cms' },
  { name: 'NDTV Movies',            url: 'https://feeds.feedburner.com/NdtvMovies-Movies' },
  { name: 'Bollywood Hungama',      url: 'https://www.bollywoodhungama.com/rss/news.xml' },
  { name: 'Pinkvilla',              url: 'https://www.pinkvilla.com/feed' },
  { name: 'Filmfare',               url: 'https://www.filmfare.com/rss/news.xml' },
  { name: 'Outlook India Ent.',     url: 'https://www.outlookindia.com/art-entertainment/rss' },
];

const GENERAL_NEWS_RSS_FEEDS = [
  { name: 'NDTV India',   url: 'https://feeds.feedburner.com/ndtvnews-india-news' },
  { name: 'India Today',  url: 'https://www.indiatoday.in/rss/1206546' },
  { name: 'The Hindu',    url: 'https://www.thehindu.com/feeder/default.rss' },
];

/**
 * Detect industry type to choose right RSS feeds and Exa domains.
 */
function detectIndustryType(client: ClientProfile): 'entertainment' | 'tech' | 'finance' | 'general' {
  const text = [
    client.industry ?? '',
    client.role ?? '',
    ...(client.keywords ?? []),
    client.bio ?? '',
  ].join(' ').toLowerCase();

  if (/(film|director|actor|cinema|bollywood|entertainment|movie|series|ott|creative|music|art|media)/i.test(text))
    return 'entertainment';
  if (/(startup|venture|vc|fintech|saas|software|tech|ai|ml|founder|cto|ceo|engineer)/i.test(text))
    return 'tech';
  if (/(banking|finance|investment|fund|nse|bse|sebi|cfo|analyst|equity|wealth)/i.test(text))
    return 'finance';
  return 'general';
}

// ── Google News engine (with fallback chain) ──────────────────────────────────

/**
 * Google News is the MOST IMPORTANT search for press coverage.
 * Now uses fallback chain: SerpAPI Google News → Exa news → NewsAPI → Brave
 */
async function googleNewsSearch(
  queries: string[],
  sourceName = 'Google News'
): Promise<SourceResult[]> {
  const all: SourceResult[] = [];

  // Run all queries in parallel using fallback newsSearch
  const results = await Promise.allSettled(
    queries.map(async (q) => {
      const { results: found, provider } = await newsSearch(q, { num: 10 });
      return found.map(r => ({
        source: r.source !== 'serpapi' && r.source !== 'exa' ? r.source : sourceName,
        category: 'news',
        url:      r.url,
        title:    r.title,
        snippet:  r.snippet,
        date:     r.date,
        relevanceScore: 0.85,
        metadata: { provider, query: q },
      })) as SourceResult[];
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }

  return all;
}

// ── NewsAPI ──────────────────────────────────────────────────────────────────

async function fetchNewsAPI(client: ClientProfile): Promise<SourceResult[]> {
  if (!process.env.NEWSAPI_KEY) return [];
  try {
    // Use name variants — handles double-vowel spelling differences
    const nameQ = `"${client.name}"`;
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', nameQ);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'relevancy');
    url.searchParams.set('pageSize', '15');
    url.searchParams.set('apiKey', process.env.NEWSAPI_KEY);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.articles ?? []).slice(0, 12).map((a: {
      source?: { name?: string };
      url?: string;
      title?: string;
      description?: string;
      publishedAt?: string;
    }) => ({
      source: a.source?.name ?? 'NewsAPI',
      category: 'news',
      url: a.url ?? '',
      title: a.title ?? '',
      snippet: a.description ?? '',
      date: a.publishedAt,
      relevanceScore: 0.8,
      metadata: { api: 'newsapi' },
    }));
  } catch {
    return [];
  }
}

// ── Exa neural news search ───────────────────────────────────────────────────

async function fetchExaNews(client: ClientProfile, industryType: string): Promise<SourceResult[]> {
  if (!process.env.EXA_API_KEY) return [];

  // Domain list by industry — no allowlist for entertainment (too restrictive)
  const domainsByIndustry: Record<string, string[]> = {
    entertainment: [
      'timesofindia.indiatimes.com', 'mid-day.com', 'news18.com',
      'ndtv.com', 'outlookindia.com', 'dnaindia.com', 'ianslive.in',
      'bollywoodhungama.com', 'pinkvilla.com', 'filmcompanion.in',
      'republicworld.com', 'gulfnews.com', 'indulgexpress.com',
      'indiantelevision.com', 'boundindia.com', 'theindian.in',
    ],
    tech: [
      'techcrunch.com', 'inc42.com', 'entrackr.com', 'yourstory.com',
      'the-ken.com', 'businessinsider.com', 'wired.com', 'thenextweb.com',
      'vccircle.com', 'startupstories.in',
    ],
    finance: [
      'vccircle.com', 'the-ken.com', 'bloomberg.com', 'ft.com',
      'reuters.com', 'livemint.com', 'economictimes.indiatimes.com',
      'moneycontrol.com', 'business-standard.com',
    ],
    general: [
      'thehindu.com', 'ndtv.com', 'indiatoday.in', 'hindustantimes.com',
      'timesofindia.indiatimes.com', 'outlookindia.com', 'news18.com',
    ],
  };

  const domains = domainsByIndustry[industryType] ?? domainsByIndustry.general;

  try {
    const query = `${client.name}${client.company ? ` ${client.company}` : ''} news coverage press`;
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': process.env.EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 15,
        useAutoprompt: true,
        type: 'neural',
        includeDomains: domains,
        contents: { text: { maxCharacters: 500 } },
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? []).map((r: {
      url: string; title: string; text?: string; publishedDate?: string;
    }) => {
      let domain = '';
      try { domain = new URL(r.url).hostname.replace('www.', ''); } catch { domain = 'Unknown'; }
      return {
        source: domain,
        category: 'news',
        url: r.url,
        title: r.title ?? '',
        snippet: r.text?.slice(0, 500) ?? '',
        date: r.publishedDate,
        relevanceScore: 0.75,
        metadata: { via: 'exa', domain },
      };
    });
  } catch {
    return [];
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function fetchNewsSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];
  const name = client.name;
  const industryType = detectIndustryType(client);

  // ── Extract film/work titles for anchor queries ───────────────────────────
  // These come from bio + keywords — deterministic, no AI needed
  const { extractKnownTitlesForSearch } = await import('@/lib/ai/agents/query-generator');
  const knownTitles = extractKnownTitlesForSearch(client.bio ?? '', client.keywords ?? []);

  // ── Anchor Google News queries — ALWAYS run these ─────────────────────────
  // These are the highest-value queries. Using exact quoted name finds press articles
  // that search by keyword alone would miss.
  const anchorNewsQueries = [
    `"${name}"`,                               // exact name — finds all press mentions
    `"${name}" interview`,                     // interviews and profiles
    `"${name}" ${client.role ?? 'director'}`,  // role-specific press
    ...knownTitles.slice(0, 3).map(t => `"${t}" ${name.split(' ')[0]}`),  // film/book titles
  ].filter(Boolean);

  // Also run Google Web for news (catches articles not in News index)
  const anchorWebQueries = [
    `"${name}" site:mid-day.com OR site:timesofindia.com OR site:news18.com OR site:ndtv.com`,
    `"${name}" site:outlookindia.com OR site:dnaindia.com OR site:ianslive.in`,
  ];

  // ── Run all sources in parallel ───────────────────────────────────────────
  const entertainmentFeeds = industryType === 'entertainment'
    ? ENTERTAINMENT_RSS_FEEDS
    : GENERAL_NEWS_RSS_FEEDS;

  const allFeeds = [...BUSINESS_RSS_FEEDS, ...entertainmentFeeds];

  const rssPromises = allFeeds.map(feed =>
    fetchRSS(feed.url, feed.name, name, 5).catch(() => [] as SourceResult[])
  );

  const [
    googleNews,
    googleNewsWeb,
    rssResults,
    newsapi,
    exaNews,
  ] = await Promise.allSettled([
    googleNewsSearch(anchorNewsQueries, 'Google News'),
    googleNewsSearch(anchorWebQueries, 'Google Web News'),
    Promise.all(rssPromises).then(r => r.flat()),
    fetchNewsAPI(client),
    fetchExaNews(client, industryType),
  ]);

  const allResults: SourceResult[] = [];

  if (googleNews.status === 'fulfilled') allResults.push(...googleNews.value);
  else errors.push(`Google News: ${googleNews.reason?.message}`);

  if (googleNewsWeb.status === 'fulfilled') allResults.push(...googleNewsWeb.value);
  else errors.push(`Google Web News: ${googleNewsWeb.reason?.message}`);

  if (rssResults.status === 'fulfilled') allResults.push(...rssResults.value);
  else errors.push(`RSS feeds: ${rssResults.reason?.message}`);

  if (newsapi.status === 'fulfilled') allResults.push(...newsapi.value);
  else errors.push(`NewsAPI: ${newsapi.reason?.message}`);

  if (exaNews.status === 'fulfilled') allResults.push(...exaNews.value);
  else errors.push(`Exa News: ${exaNews.reason?.message}`);

  console.log(`[News] ${name}: ${allResults.length} results, industry=${industryType}, googleNews=${googleNews.status}`);

  return {
    module: 'News & Media',
    results: allResults,
    sourcesScanned: allFeeds.length + 4,
    errors,
    durationMs: Date.now() - start,
  };
}
