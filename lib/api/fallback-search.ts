/**
 * Fallback Search Architecture
 * 
 * Every search tier has a primary + fallback(s).
 * If primary is out of credits/quota/down → fallback fires automatically.
 * Zero user-visible errors from API credit issues.
 * 
 * Tier map:
 *   Web search:   SerpAPI → Exa.ai → Google Custom Search → Brave Search
 *   News:         SerpAPI Google News → NewsAPI → Exa news filter
 *   AI synthesis: OpenRouter → Anthropic direct → OpenAI direct
 *   Scraping:     Firecrawl → Jina.ai Reader (free) → raw fetch
 */

export interface SearchResult {
  title:    string;
  url:      string;
  snippet:  string;
  source:   string;
  category: string;
  date?:    string;
  via?:     string; // which provider actually served it
}

// ─── Quota / credit error detection ─────────────────────────────────────────

function isQuotaError(status: number, body: string): boolean {
  if (status === 429) return true;
  if (status === 402) return true;
  if (status === 403 && body.includes('quota')) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes('out of credits') ||
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('insufficient_quota') ||
    lower.includes('limit reached') ||
    lower.includes('no credits')
  );
}

// ─── Provider 1: SerpAPI ─────────────────────────────────────────────────────

export async function serpApiSearch(
  query: string,
  opts: { engine?: string; num?: number; category?: string } = {}
): Promise<SearchResult[]> {
  const key = process.env.SERPAPI_KEY;
  if (!key) throw new Error('SERPAPI_KEY not set');

  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('api_key', key);
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(opts.num ?? 10));
  url.searchParams.set('engine', opts.engine ?? 'google');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  const body = await res.text();
  if (!res.ok || isQuotaError(res.status, body)) throw new Error(`SerpAPI: ${res.status}`);

  const data = JSON.parse(body);
  const results: SearchResult[] = [];
  for (const r of [...(data.organic_results ?? []), ...(data.news_results ?? [])]) {
    results.push({ title: r.title ?? '', url: r.link ?? '', snippet: r.snippet ?? '', source: 'serpapi', category: opts.category ?? 'search', date: r.date, via: 'serpapi' });
  }
  return results;
}

// ─── Provider 2: Exa.ai ──────────────────────────────────────────────────────

export async function exaSearch(
  query: string,
  opts: { numResults?: number; category?: string } = {}
): Promise<SearchResult[]> {
  const key = process.env.EXA_API_KEY;
  if (!key) throw new Error('EXA_API_KEY not set');

  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, numResults: opts.numResults ?? 8, type: 'neural', useAutoprompt: true, contents: { snippet: { numSentences: 3 } } }),
    signal: AbortSignal.timeout(12000),
  });
  const body = await res.text();
  if (!res.ok || isQuotaError(res.status, body)) throw new Error(`Exa: ${res.status}`);

  const data = JSON.parse(body);
  return (data.results ?? []).map((r: Record<string,unknown>) => ({
    title: r.title ?? '', url: r.url ?? '', snippet: String((r.contents as Record<string,unknown>)?.snippet ?? ''),
    source: 'exa', category: opts.category ?? 'search', date: (r.publishedDate as string), via: 'exa',
  }));
}

// ─── Provider 3: Google Custom Search ────────────────────────────────────────

export async function googleCustomSearch(
  query: string,
  opts: { num?: number; category?: string } = {}
): Promise<SearchResult[]> {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx  = process.env.GOOGLE_SEARCH_ENGINE_ID ?? process.env.GOOGLE_CSE_ID;
  if (!key || !cx) throw new Error('GOOGLE_SEARCH_API_KEY/GOOGLE_SEARCH_ENGINE_ID not set');

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', key);
  url.searchParams.set('cx', cx);
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(Math.min(opts.num ?? 8, 10)));

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  const body = await res.text();
  if (!res.ok || isQuotaError(res.status, body)) throw new Error(`Google CSE: ${res.status}`);

  const data = JSON.parse(body);
  return (data.items ?? []).map((r: Record<string,unknown>) => ({
    title: r.title ?? '', url: r.link ?? '', snippet: r.snippet ?? '',
    source: 'google_cse', category: opts.category ?? 'search', via: 'google_cse',
  }));
}

// ─── Provider 4: Brave Search ────────────────────────────────────────────────

export async function braveSearch(
  query: string,
  opts: { count?: number; category?: string } = {}
): Promise<SearchResult[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) throw new Error('BRAVE_SEARCH_API_KEY not set');

  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(opts.count ?? 8));

  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
    signal: AbortSignal.timeout(10000),
  });
  const body = await res.text();
  if (!res.ok || isQuotaError(res.status, body)) throw new Error(`Brave: ${res.status}`);

  const data = JSON.parse(body);
  return (data.web?.results ?? []).map((r: Record<string,unknown>) => ({
    title: r.title ?? '', url: r.url ?? '', snippet: r.description ?? '',
    source: 'brave', category: opts.category ?? 'search', date: r.age?.toString(), via: 'brave',
  }));
}

// ─── Provider 5: NewsAPI ─────────────────────────────────────────────────────

export async function newsApiSearch(
  query: string,
  opts: { pageSize?: number; category?: string } = {}
): Promise<SearchResult[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) throw new Error('NEWSAPI_KEY not set');

  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', query);
  url.searchParams.set('apiKey', key);
  url.searchParams.set('pageSize', String(opts.pageSize ?? 10));
  url.searchParams.set('sortBy', 'relevancy');
  url.searchParams.set('language', 'en');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  const body = await res.text();
  if (!res.ok || isQuotaError(res.status, body)) throw new Error(`NewsAPI: ${res.status}`);

  const data = JSON.parse(body);
  return (data.articles ?? []).map((a: Record<string,unknown>) => ({
    title: a.title ?? '', url: a.url ?? '', snippet: a.description ?? '',
    source: 'newsapi', category: opts.category ?? 'news', date: a.publishedAt?.toString(), via: 'newsapi',
  }));
}

// ─── Scraping: Firecrawl → Jina.ai (free) → raw fetch ───────────────────────

export async function scrapeUrl(url: string): Promise<string> {
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (firecrawlKey) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, pageOptions: { onlyMainContent: true } }),
        signal: AbortSignal.timeout(20000),
      });
      const body = await res.text();
      if (res.ok && !isQuotaError(res.status, body)) {
        const data = JSON.parse(body);
        if (data.data?.markdown) return data.data.markdown;
      }
    } catch { /* fall through to Jina */ }
  }

  // Jina.ai Reader — completely free, no key needed
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { 'Accept': 'text/plain', 'X-No-Cache': 'true' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) return await res.text();
  } catch { /* fall through to raw fetch */ }

  // Raw fetch as last resort
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReputeOS/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    return await res.text();
  } catch { return ''; }
}

// ─── THE MAIN ORCHESTRATOR ────────────────────────────────────────────────────
/**
 * webSearch() — unified search with automatic provider fallback.
 * 
 * Priority: SerpAPI → Exa → Google CSE → Brave
 * On quota/error: silently skips to next provider.
 * On all fail: returns empty array (scan continues with other modules).
 */
export async function webSearch(
  query: string,
  opts: { num?: number; category?: string } = {}
): Promise<{ results: SearchResult[]; provider: string }> {
  const chain: Array<{ name: string; envKey: string; fn: () => Promise<SearchResult[]> }> = [
    { name: 'serpapi',    envKey: 'SERPAPI_KEY',           fn: () => serpApiSearch(query, { num: opts.num, category: opts.category }) },
    { name: 'exa',        envKey: 'EXA_API_KEY',           fn: () => exaSearch(query, { numResults: opts.num, category: opts.category }) },
    { name: 'google_cse', envKey: 'GOOGLE_SEARCH_API_KEY', fn: () => googleCustomSearch(query, { num: opts.num, category: opts.category }) },
    { name: 'brave',      envKey: 'BRAVE_SEARCH_API_KEY',  fn: () => braveSearch(query, { count: opts.num, category: opts.category }) },
  ];

  for (const { name, envKey, fn } of chain) {
    if (!process.env[envKey]) continue; // skip if no key configured
    try {
      const results = await fn();
      if (results.length > 0) return { results, provider: name };
    } catch (err) {
      console.warn(`[webSearch] ${name} failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  return { results: [], provider: 'none' };
}

/**
 * newsSearch() — news-specific with fallback chain.
 */
export async function newsSearch(
  query: string,
  opts: { num?: number } = {}
): Promise<{ results: SearchResult[]; provider: string }> {
  // SerpAPI Google News
  if (process.env.SERPAPI_KEY) {
    try {
      const results = await serpApiSearch(query, { engine: 'google_news', num: opts.num ?? 10, category: 'news' });
      if (results.length > 0) return { results, provider: 'serpapi_news' };
    } catch (e) { console.warn('[newsSearch] SerpAPI news failed:', e instanceof Error ? e.message : e); }
  }

  // Exa with news prefix
  if (process.env.EXA_API_KEY) {
    try {
      const results = await exaSearch(`news: ${query}`, { numResults: opts.num ?? 10, category: 'news' });
      if (results.length > 0) return { results, provider: 'exa_news' };
    } catch (e) { console.warn('[newsSearch] Exa news failed:', e instanceof Error ? e.message : e); }
  }

  // NewsAPI
  if (process.env.NEWSAPI_KEY) {
    try {
      const results = await newsApiSearch(query, { pageSize: opts.num ?? 10 });
      if (results.length > 0) return { results, provider: 'newsapi' };
    } catch (e) { console.warn('[newsSearch] NewsAPI failed:', e instanceof Error ? e.message : e); }
  }

  // Brave as last resort
  if (process.env.BRAVE_SEARCH_API_KEY) {
    try {
      const results = await braveSearch(query, { count: opts.num ?? 8, category: 'news' });
      if (results.length > 0) return { results, provider: 'brave_news' };
    } catch (e) { console.warn('[newsSearch] Brave failed:', e instanceof Error ? e.message : e); }
  }

  return { results: [], provider: 'none' };
}

// ─── Provider health check (for admin dashboard) ─────────────────────────────

export async function checkSearchProviderHealth(): Promise<Record<string, 'ok' | 'no_key' | 'error'>> {
  const status: Record<string, 'ok' | 'no_key' | 'error'> = {};

  await Promise.allSettled([
    (async () => {
      if (!process.env.SERPAPI_KEY) { status.serpapi = 'no_key'; return; }
      try { await serpApiSearch('site:example.com test', { num: 1 }); status.serpapi = 'ok'; }
      catch { status.serpapi = 'error'; }
    })(),
    (async () => {
      if (!process.env.EXA_API_KEY) { status.exa = 'no_key'; return; }
      try { await exaSearch('test query', { numResults: 1 }); status.exa = 'ok'; }
      catch { status.exa = 'error'; }
    })(),
    (async () => {
      if (!process.env.GOOGLE_SEARCH_API_KEY) { status.google_cse = 'no_key'; return; }
      try { await googleCustomSearch('test', { num: 1 }); status.google_cse = 'ok'; }
      catch { status.google_cse = 'error'; }
    })(),
    (async () => {
      if (!process.env.BRAVE_SEARCH_API_KEY) { status.brave = 'no_key'; return; }
      try { await braveSearch('test', { count: 1 }); status.brave = 'ok'; }
      catch { status.brave = 'error'; }
    })(),
    (async () => {
      if (!process.env.NEWSAPI_KEY) { status.newsapi = 'no_key'; return; }
      try { await newsApiSearch('technology', { pageSize: 1 }); status.newsapi = 'ok'; }
      catch { status.newsapi = 'error'; }
    })(),
  ]);

  return status;
}
