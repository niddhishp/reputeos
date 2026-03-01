/**
 * SOURCE MODULE: Search & AI Intelligence
 * Covers: Google Web, Google News, Google Scholar, Knowledge Panel,
 *         Bing News, YouTube, Wikipedia, Hacker News, Semantic Scholar,
 *         Exa neural search, Perplexity synthesis
 */

import { SourceResult, SourceModuleResult, ClientProfile, buildSearchQuery, isRelevant } from './types';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function serpSearch(
  params: Record<string, string>,
  sourceName: string,
  category: string,
  client: ClientProfile,
  limit = 8
): Promise<SourceResult[]> {
  if (!SERPAPI_KEY) return [];
  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('api_key', SERPAPI_KEY);
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
  if (!EXA_API_KEY) return [];
  try {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
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
  if (!OPENROUTER_API_KEY) return [];
  try {
    const prompt = `Search the web and provide a detailed reputation summary for ${client.name}${client.company ? `, ${client.role ?? ''} at ${client.company}` : ''}${client.industry ? ` in the ${client.industry} industry` : ''}. Include: their public standing, notable achievements, any controversies, media coverage, and how they are perceived professionally in India. Be factual and cite specific examples.`;

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
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
  const q = buildSearchQuery(client);
  const qIndia = `${q} India`;

  const [
    googleWeb,
    googleNews,
    googleScholar,
    bingNews,
    youtube,
    wikipedia,
    hackerNews,
    semanticScholar,
    exa,
    perplexity,
  ] = await Promise.allSettled([
    serpSearch({ engine: 'google', q: qIndia, gl: 'in', hl: 'en', num: '10' }, 'Google Web', 'search', client, 10),
    serpSearch({ engine: 'google', q: qIndia, gl: 'in', tbm: 'nws', num: '8' }, 'Google News', 'news', client, 8),
    serpSearch({ engine: 'google_scholar', q: q, num: '5' }, 'Google Scholar', 'academic', client, 5),
    serpSearch({ engine: 'bing_news', q: qIndia, count: '8' }, 'Bing India News', 'news', client, 8),
    serpSearch({ engine: 'youtube', search_query: qIndia }, 'YouTube Search', 'video', client, 5),
    wikipediaSearch(client.name),
    hackerNewsSearch(client.name),
    semanticScholarSearch(client.name),
    exaSearch(`${client.name} ${client.company ?? ''} reputation India`, 8, 'search'),
    perplexitySynthesis(client),
  ]);

  const allResults: SourceResult[] = [];
  const tasks = [
    { name: 'Google Web', r: googleWeb },
    { name: 'Google News', r: googleNews },
    { name: 'Google Scholar', r: googleScholar },
    { name: 'Bing India News', r: bingNews },
    { name: 'YouTube', r: youtube },
    { name: 'Wikipedia', r: wikipedia },
    { name: 'Hacker News', r: hackerNews },
    { name: 'Semantic Scholar', r: semanticScholar },
    { name: 'Exa Neural', r: exa },
    { name: 'Perplexity', r: perplexity },
  ];

  for (const { name, r } of tasks) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
    else errors.push(`${name}: ${r.reason?.message ?? 'failed'}`);
  }

  return {
    module: 'Search & AI Intelligence',
    results: allResults,
    sourcesScanned: 11,
    errors,
    durationMs: Date.now() - start,
  };
}
