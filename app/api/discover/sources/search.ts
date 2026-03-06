/**
 * SOURCE MODULE: Search & AI Intelligence
 * Covers: Google Web, Google News, Google Scholar, Knowledge Panel,
 *         Bing News, YouTube, Wikipedia, Hacker News, Semantic Scholar,
 *         Exa neural search, Perplexity synthesis
 */

import { SourceResult, SourceModuleResult, ClientProfile, buildSearchQuery, isRelevant } from './types';
import { generateDeepSearchQueries, flattenQuerySet } from '@/lib/ai/agents/query-generator';




async function serpSearch(
  params: Record<string, string>,
  sourceName: string,
  category: string,
  client: ClientProfile,
  limit = 8
): Promise<SourceResult[]> {
  if (!process.env.SERPAPI_KEY) return [];
  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('api_key', process.env.SERPAPI_KEY);
    url.searchParams.set('num', String(limit));
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    const items: SourceResult[] = [];

    // Organic results
    for (const r of data.organic_results ?? []) {
      items.push({
        source: sourceName,
        category,
        url: r.link ?? '',
        title: r.title ?? '',
        snippet: r.snippet ?? '',
        date: r.date,
        metadata: { position: r.position, displayedLink: r.displayed_link },
      });
    }

    // News results
    for (const r of data.news_results ?? []) {
      items.push({
        source: sourceName,
        category,
        url: r.link ?? '',
        title: r.title ?? '',
        snippet: r.snippet ?? '',
        date: r.date,
        metadata: { source: r.source },
      });
    }

    // Knowledge graph
    if (data.knowledge_graph) {
      const kg = data.knowledge_graph;
      items.push({
        source: 'Google Knowledge Panel',
        category: 'search',
        url: kg.website ?? `https://google.com/search?q=${encodeURIComponent(client.name)}`,
        title: kg.title ?? client.name,
        snippet: kg.description ?? '',
        metadata: { type: kg.type, attributes: kg.attributes },
      });
    }

    return items.slice(0, limit);
  } catch (e) {
    console.error(`SerpAPI ${sourceName} error:`, e);
    return [];
  }
}

async function exaSearch(query: string, numResults = 8, category = 'search'): Promise<SourceResult[]> {
  if (!process.env.EXA_API_KEY) return [];
  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': process.env.EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults,
        useAutoprompt: true,
        type: 'neural',
        contents: { text: { maxCharacters: 500 } },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? []).map((r: {
      url: string; title: string; text?: string; publishedDate?: string; author?: string;
    }) => ({
      source: 'Exa Neural Search',
      category,
      url: r.url,
      title: r.title ?? '',
      snippet: r.text?.slice(0, 400) ?? '',
      date: r.publishedDate,
      metadata: { author: r.author },
    }));
  } catch (e) {
    console.error('Exa search error:', e);
    return [];
  }
}

async function wikipediaSearch(name: string): Promise<SourceResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&srlimit=3`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(6000) });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const pages = searchData.query?.search ?? [];
    if (!pages.length) return [];

    const topPage = pages[0];
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topPage.title)}`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(6000) });
    if (!summaryRes.ok) return [];
    const summary = await summaryRes.json();

    if (!isRelevant(summary.title + ' ' + (summary.description ?? ''), name)) return [];

    return [{
      source: 'Wikipedia',
      category: 'search',
      url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${topPage.title}`,
      title: summary.title,
      snippet: summary.extract?.slice(0, 500) ?? '',
      metadata: { pageId: topPage.pageid, description: summary.description },
    }];
  } catch {
    return [];
  }
}

async function hackerNewsSearch(name: string): Promise<SourceResult[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(name)}&tags=story&hitsPerPage=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.hits ?? [])
      .filter((h: { title?: string; story_text?: string }) => isRelevant(h.title ?? '', name))
      .slice(0, 3)
      .map((h: { objectID: string; title?: string; story_text?: string; created_at?: string; points?: number }) => ({
        source: 'Hacker News',
        category: 'search',
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        title: h.title ?? '',
        snippet: h.story_text?.slice(0, 300) ?? '',
        date: h.created_at,
        metadata: { points: h.points },
      }));
  } catch {
    return [];
  }
}

async function semanticScholarSearch(name: string): Promise<SourceResult[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(name)}&fields=name,paperCount,citationCount,papers.title,papers.year,papers.externalIds&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const author = data.data?.[0];
    if (!author) return [];

    const results: SourceResult[] = [{
      source: 'Semantic Scholar',
      category: 'academic',
      url: `https://www.semanticscholar.org/author/${author.authorId}`,
      title: `${author.name} — Academic Profile`,
      snippet: `${author.paperCount ?? 0} papers, ${author.citationCount ?? 0} citations on Semantic Scholar`,
      metadata: { authorId: author.authorId, paperCount: author.paperCount, citationCount: author.citationCount },
    }];

    for (const paper of (author.papers ?? []).slice(0, 3)) {
      results.push({
        source: 'Semantic Scholar',
        category: 'academic',
        url: paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : `https://www.semanticscholar.org`,
        title: paper.title ?? '',
        snippet: `Academic paper (${paper.year ?? 'n/d'})`,
        date: paper.year?.toString(),
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function perplexitySynthesis(client: ClientProfile): Promise<SourceResult[]> {
  if (!process.env.OPENROUTER_API_KEY) return [];
  try {
    const prompt = `Search the web and provide a detailed reputation summary for ${client.name}${client.company ? `, ${client.role ?? ''} at ${client.company}` : ''}${client.industry ? ` in the ${client.industry} industry` : ''}. Include: their public standing, notable achievements, any controversies, media coverage, and how they are perceived professionally in India. Be factual and cite specific examples.`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://reputeos.com',
        'X-Title': 'ReputeOS',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) return [];

    return [{
      source: 'Perplexity AI Synthesis',
      category: 'search',
      url: `https://perplexity.ai`,
      title: `AI Reputation Synthesis: ${client.name}`,
      snippet: content.slice(0, 600),
      metadata: { model: 'perplexity/sonar', fullText: content },
    }];
  } catch {
    return [];
  }
}

export async function fetchSearchSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];
  const allResults: SourceResult[] = [];

  // ── ANCHOR QUERIES — Always run, no AI needed ─────────────────────────────
  // Run immediately in parallel. Even if AI query generator fails/times out,
  // these will find press coverage, interviews, and film/book mentions.
  const { extractKnownTitlesForSearch } = await import('@/lib/ai/agents/query-generator');
  const knownTitles = extractKnownTitlesForSearch(client.bio ?? '', client.keywords ?? []);
  const firstName = client.name.split(' ')[0];

  const anchorQueries: string[] = [
    `"${client.name}"`,                              // exact name — finds all press
    `"${client.name}" interview`,                    // interviews
    `"${client.name}" ${client.role ?? 'director'}`, // role context
    `"${client.name}" India`,                        // India-specific coverage
    // Social profile lookups — Google snippets often contain follower counts
    `${client.name} LinkedIn followers profile`,
    `${client.name} YouTube channel subscribers`,
    ...knownTitles.slice(0, 4).map(t => `"${t}"`),                  // exact film/book titles
    ...knownTitles.slice(0, 3).map(t => `"${t}" ${firstName}`),     // title + first name
  ].filter((q, i, a) => q.trim().length > 3 && a.indexOf(q) === i);

  const anchorResults = await Promise.allSettled(
    anchorQueries.map(q => serpSearch(
      { engine: 'google', q, gl: 'in', hl: 'en', num: '10' },
      'Google Web',
      detectQueryCategory(q),
      client,
      10
    ))
  );
  for (const r of anchorResults) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
  }
  console.log(`[Search] Anchor queries: ${anchorQueries.length} run, ${allResults.length} results so far`);

  // ── Step 1: Generate deep, persona-specific search queries ────────────────
  let deepQueries: string[] = [];
  try {
    const querySet = await generateDeepSearchQueries({
      name:         client.name,
      role:         client.role         ?? undefined,
      company:      client.company      ?? undefined,
      industry:     client.industry     ?? undefined,
      keywords:     client.keywords     ?? undefined,
      bio:          client.bio          ?? undefined,
      social_links: client.social_links ?? undefined,
    });
    deepQueries = flattenQuerySet(querySet);
    // Remove queries already covered by anchor queries
    const anchorSet = new Set(anchorQueries.map(q => q.toLowerCase()));
    deepQueries = deepQueries.filter(q => !anchorSet.has(q.toLowerCase()));
    console.log(`[Search] Generated ${deepQueries.length} additional deep queries for ${client.name}`);
  } catch (e) {
    // Fallback to basic query
    const q = buildSearchQuery(client);
    deepQueries = [q, `${q} India`, `${q} interview`, `${q} books`, `${q} YouTube`];
    errors.push(`Query generation failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Step 2: Always-run enrichment sources (Wikipedia, Perplexity, Exa) ───
  // knownTitles already extracted above in anchor queries block

  const alwaysRun: Promise<SourceResult[]>[] = [
    wikipediaSearch(client.name),
    perplexitySynthesis(client),
    exaSearch(`${client.name} ${client.company ?? ''} India reputation works career`, 10, 'search'),
    exaSearch(`site:youtube.com "${client.name}" interview OR film OR movie OR documentary`, 8, 'video'),
    serpSearch(
      // SerpAPI Google Shopping search for books — Exa site: operator doesn't work
      { engine: 'google', q: `"${client.name}" book author site:amazon.in OR site:amazon.com`, gl: 'in', hl: 'en', num: '8' },
      'Amazon Books',
      'publication',
      client,
      8
    ),
    serpSearch(
      // Also search Google directly for their books
      { engine: 'google', q: `"${client.name}" author book published`, gl: 'in', hl: 'en', num: '5' },
      'Google Books Search',
      'publication',
      client,
      5
    ),
  ];

  // For each known title, add a targeted Exa search
  for (const title of knownTitles.slice(0, 5)) {
    alwaysRun.push(exaSearch(`"${title}" ${client.name} film movie review`, 5, 'works'));
  }

  const enrichResults = await Promise.allSettled(alwaysRun);
  for (const r of enrichResults) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
  }

  // ── Step 3: Run deep queries in batches of 5 (SerpAPI rate limits) ────────
  // Priority queries first: core → works → platform → thought leader → media
  const BATCH_SIZE = 5;
  const MAX_QUERIES = 40;  // raised from 30 — known-works queries get priority slots
  const priorityQueries = deepQueries.slice(0, MAX_QUERIES);

  for (let i = 0; i < priorityQueries.length; i += BATCH_SIZE) {
    const batch = priorityQueries.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(q => serpSearch(
        { engine: 'google', q, gl: 'in', hl: 'en', num: '8' },
        'Google Web',
        detectQueryCategory(q),
        client,
        8
      ))
    );
    for (const r of batchResults) {
      if (r.status === 'fulfilled') allResults.push(...r.value);
    }
  }

  // ── Step 4: Deduplicate by URL ─────────────────────────────────────────────
  const seen = new Set<string>();
  const dedupedResults = allResults.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return {
    module: 'Search & AI Intelligence',
    results: dedupedResults,
    sourcesScanned: priorityQueries.length + 3, // queries + wiki + perplexity + exa
    errors,
    durationMs: Date.now() - start,
  };
}

/**
 * Detect category from query string for better classification
 */
function detectQueryCategory(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes('youtube') || lower.includes('video') || lower.includes('podcast')) return 'video';
  if (lower.includes('amazon') || lower.includes('book') || lower.includes('author')) return 'publication';
  if (lower.includes('linkedin') || lower.includes('twitter') || lower.includes('instagram')) return 'social';
  if (lower.includes('court') || lower.includes('sebi') || lower.includes('legal') || lower.includes('mca')) return 'regulatory';
  if (lower.includes('award') || lower.includes('board') || lower.includes('director')) return 'professional';
  if (lower.includes('interview') || lower.includes('news')) return 'news';
  return 'search';
}
