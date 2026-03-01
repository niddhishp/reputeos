/**
 * SOURCE MODULE: News & Media
 * Covers: 9 Indian RSS feeds, NewsAPI, The Guardian, New York Times,
 *         Reuters, Bloomberg, VCCircle, The Ken, Entrackr via Exa
 */

import { SourceResult, SourceModuleResult, ClientProfile, fetchRSS, buildSearchQuery } from './types';

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY;
const NYT_API_KEY = process.env.NYT_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

// All Indian RSS feeds — no key needed
const INDIAN_RSS_FEEDS = [
  { name: 'Economic Times',    url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms' },
  { name: 'Business Standard', url: 'https://www.business-standard.com/rss/home_page_top_stories.rss' },
  { name: 'Livemint',          url: 'https://www.livemint.com/rss/news' },
  { name: 'Financial Express', url: 'https://www.financialexpress.com/feed/' },
  { name: 'Moneycontrol',      url: 'https://www.moneycontrol.com/rss/latestnews.xml' },
  { name: 'NDTV Profit',       url: 'https://www.ndtv.com/business/feeds/rss' },
  { name: 'Forbes India',      url: 'https://www.forbesindia.com/blog/feed/' },
  { name: 'YourStory',         url: 'https://yourstory.com/feed' },
  { name: 'Inc42',             url: 'https://inc42.com/feed/' },
  { name: 'Mint Lounge',       url: 'https://lifestyle.livemint.com/feed' },
];

async function fetchNewsAPI(client: ClientProfile): Promise<SourceResult[]> {
  if (!NEWSAPI_KEY) return [];
  try {
    const q = `"${client.name}"${client.company ? ` OR "${client.company}"` : ''}`;
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', q);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'relevancy');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('apiKey', NEWSAPI_KEY);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.articles ?? []).slice(0, 8).map((a: {
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
      metadata: { api: 'newsapi' },
    }));
  } catch {
    return [];
  }
}

async function fetchGuardian(client: ClientProfile): Promise<SourceResult[]> {
  if (!GUARDIAN_API_KEY) return [];
  try {
    const url = new URL('https://content.guardianapis.com/search');
    url.searchParams.set('q', `"${client.name}"`);
    url.searchParams.set('show-fields', 'trailText,byline');
    url.searchParams.set('page-size', '5');
    url.searchParams.set('api-key', GUARDIAN_API_KEY);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.response?.results ?? []).map((r: {
      webUrl?: string;
      webTitle?: string;
      fields?: { trailText?: string };
      webPublicationDate?: string;
    }) => ({
      source: 'The Guardian',
      category: 'news',
      url: r.webUrl ?? '',
      title: r.webTitle ?? '',
      snippet: r.fields?.trailText ?? '',
      date: r.webPublicationDate,
    }));
  } catch {
    return [];
  }
}

async function fetchNYT(client: ClientProfile): Promise<SourceResult[]> {
  if (!NYT_API_KEY) return [];
  try {
    const url = new URL('https://api.nytimes.com/svc/search/v2/articlesearch.json');
    url.searchParams.set('q', `"${client.name}"`);
    url.searchParams.set('sort', 'relevance');
    url.searchParams.set('fl', 'headline,snippet,web_url,pub_date,source');
    url.searchParams.set('api-key', NYT_API_KEY);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.response?.docs ?? []).slice(0, 5).map((d: {
      web_url?: string;
      headline?: { main?: string };
      snippet?: string;
      pub_date?: string;
    }) => ({
      source: 'New York Times',
      category: 'news',
      url: d.web_url ?? '',
      title: d.headline?.main ?? '',
      snippet: d.snippet ?? '',
      date: d.pub_date,
    }));
  } catch {
    return [];
  }
}

async function fetchExaNews(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    const query = `${client.name} ${client.company ?? ''} news coverage India`;
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 12,
        useAutoprompt: true,
        type: 'neural',
        includeDomains: [
          'vccircle.com', 'the-ken.com', 'entrackr.com',
          'reuters.com', 'bloomberg.com', 'ft.com',
          'wsj.com', 'techcrunch.com', 'businessinsider.com',
        ],
        contents: { text: { maxCharacters: 400 } },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? []).map((r: {
      url: string; title: string; text?: string; publishedDate?: string;
    }) => {
      const domain = new URL(r.url).hostname.replace('www.', '');
      const sourceMap: Record<string, string> = {
        'vccircle.com': 'VCCircle', 'the-ken.com': 'The Ken',
        'entrackr.com': 'Entrackr', 'reuters.com': 'Reuters',
        'bloomberg.com': 'Bloomberg', 'ft.com': 'Financial Times',
      };
      return {
        source: sourceMap[domain] ?? domain,
        category: 'news',
        url: r.url,
        title: r.title,
        snippet: r.text?.slice(0, 400) ?? '',
        date: r.publishedDate,
        metadata: { via: 'exa' },
      };
    });
  } catch {
    return [];
  }
}

export async function fetchNewsSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];
  const name = client.name;

  // Fetch all RSS feeds in parallel (10 feeds)
  const rssPromises = INDIAN_RSS_FEEDS.map(feed =>
    fetchRSS(feed.url, feed.name, name, 4).catch(() => [] as SourceResult[])
  );

  const [
    rssResults,
    newsapi,
    guardian,
    nyt,
    exaNews,
  ] = await Promise.allSettled([
    Promise.all(rssPromises).then(results => results.flat()),
    fetchNewsAPI(client),
    fetchGuardian(client),
    fetchNYT(client),
    fetchExaNews(client),
  ]);

  const allResults: SourceResult[] = [];

  if (rssResults.status === 'fulfilled') allResults.push(...rssResults.value);
  else errors.push(`RSS feeds: ${rssResults.reason?.message}`);

  if (newsapi.status === 'fulfilled') allResults.push(...newsapi.value);
  else errors.push(`NewsAPI: ${newsapi.reason?.message}`);

  if (guardian.status === 'fulfilled') allResults.push(...guardian.value);
  else errors.push(`Guardian: ${guardian.reason?.message}`);

  if (nyt.status === 'fulfilled') allResults.push(...nyt.value);
  else errors.push(`NYT: ${nyt.reason?.message}`);

  if (exaNews.status === 'fulfilled') allResults.push(...exaNews.value);
  else errors.push(`Exa News: ${exaNews.reason?.message}`);

  return {
    module: 'News & Media',
    results: allResults,
    sourcesScanned: 14,
    errors,
    durationMs: Date.now() - start,
  };
}
