/**
 * SOURCE MODULE: Indian Regulatory & Legal
 * Covers: SEBI orders, RBI penalties, MCA filings, NCLT orders,
 *         eCourts, ED/CBI news, Competition Commission (CCI)
 * All via Firecrawl (renders JS, handles PDFs) + Exa for ED/CBI
 */

import { SourceResult, SourceModuleResult, ClientProfile, isRelevant } from './types';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

interface FirecrawlResult {
  content: string;
  metadata: Record<string, unknown>;
}

async function firecrawlScrape(url: string): Promise<FirecrawlResult | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      content: data.data?.markdown ?? '',
      metadata: data.data?.metadata ?? {},
    };
  } catch {
    return null;
  }
}

async function searchRegulatoryViaSerp(
  site: string,
  name: string,
  sourceName: string,
  category: string
): Promise<SourceResult[]> {
  if (!SERPAPI_KEY) return [];
  try {
    const q = `site:${site} "${name}"`;
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('api_key', SERPAPI_KEY);
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', q);
    url.searchParams.set('num', '5');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.organic_results ?? []).slice(0, 4).map((r: {
      link?: string; title?: string; snippet?: string; date?: string;
    }) => ({
      source: sourceName,
      category,
      url: r.link ?? '',
      title: r.title ?? '',
      snippet: r.snippet ?? '',
      date: r.date,
      metadata: { regulatoryBody: sourceName, via: 'serpapi' },
    }));
  } catch {
    return [];
  }
}

async function fetchSEBI(client: ClientProfile): Promise<SourceResult[]> {
  const name = client.name;
  const company = client.company;
  const results: SourceResult[] = [];

  // Try direct SEBI orders page via SerpAPI first (more reliable than scraping)
  const serpResults = await searchRegulatoryViaSerp(
    'sebi.gov.in', name, 'SEBI', 'regulatory'
  );
  results.push(...serpResults);

  // Also try company name if different from person
  if (company && company !== name) {
    const companyResults = await searchRegulatoryViaSerp(
      'sebi.gov.in', company, 'SEBI', 'regulatory'
    );
    results.push(...companyResults.slice(0, 2));
  }

  // Firecrawl SEBI search page as fallback
  if (!results.length && FIRECRAWL_API_KEY) {
    const scraped = await firecrawlScrape(
      `https://www.sebi.gov.in/enforcement/orders/search.html?searchText=${encodeURIComponent(name)}`
    );
    if (scraped?.content) {
      const lines = scraped.content.split('\n')
        .filter(l => l.length > 30 && isRelevant(l, name))
        .slice(0, 3);
      if (lines.length) {
        results.push({
          source: 'SEBI',
          category: 'regulatory',
          url: `https://www.sebi.gov.in/enforcement/orders/search.html?searchText=${encodeURIComponent(name)}`,
          title: `SEBI Records: ${name}`,
          snippet: lines.join(' | ').slice(0, 400),
          metadata: { regulatoryBody: 'SEBI', via: 'firecrawl' },
        });
      }
    }
  }

  return results;
}

async function fetchRBI(client: ClientProfile): Promise<SourceResult[]> {
  const results: SourceResult[] = [];

  const serpResults = await searchRegulatoryViaSerp(
    'rbi.org.in', client.name, 'RBI', 'regulatory'
  );
  results.push(...serpResults);

  if (client.company) {
    const companyResults = await searchRegulatoryViaSerp(
      'rbi.org.in', client.company, 'RBI', 'regulatory'
    );
    results.push(...companyResults.slice(0, 2));
  }

  return results;
}

async function fetchMCA(client: ClientProfile): Promise<SourceResult[]> {
  if (!FIRECRAWL_API_KEY) return [];
  try {
    const searchName = encodeURIComponent(client.name);

    // MCA director DIN search
    const scraped = await firecrawlScrape(
      `https://www.mca.gov.in/mcafoportal/viewSignatoryDetails.do?directorName=${searchName}`
    );

    const results: SourceResult[] = [];
    if (scraped?.content && isRelevant(scraped.content, client.name)) {
      results.push({
        source: 'MCA India',
        category: 'regulatory',
        url: `https://www.mca.gov.in/mcafoportal/viewSignatoryDetails.do`,
        title: `MCA Director Record: ${client.name}`,
        snippet: scraped.content.slice(0, 400),
        metadata: { via: 'firecrawl', regulatoryBody: 'MCA' },
      });
    }

    // Also search via SerpAPI
    const serpResults = await searchRegulatoryViaSerp(
      'mca.gov.in', client.name, 'MCA India', 'regulatory'
    );
    results.push(...serpResults.slice(0, 2));

    return results;
  } catch {
    return [];
  }
}

async function fetchNCLT(client: ClientProfile): Promise<SourceResult[]> {
  const results: SourceResult[] = [];

  // NCLT orders via SerpAPI site search
  const serpResults = await searchRegulatoryViaSerp(
    'nclt.gov.in', client.name, 'NCLT', 'regulatory'
  );
  results.push(...serpResults);

  if (client.company) {
    const companyResults = await searchRegulatoryViaSerp(
      'nclt.gov.in', client.company, 'NCLT', 'regulatory'
    );
    results.push(...companyResults.slice(0, 2));
  }

  // Also NCLAT
  const nclat = await searchRegulatoryViaSerp(
    'nclat.nic.in', client.name, 'NCLAT', 'regulatory'
  );
  results.push(...nclat.slice(0, 2));

  return results;
}

async function fetchCCI(client: ClientProfile): Promise<SourceResult[]> {
  if (!FIRECRAWL_API_KEY && !SERPAPI_KEY) return [];

  const results = await searchRegulatoryViaSerp(
    'cci.gov.in', client.company ?? client.name, 'Competition Commission (CCI)', 'regulatory'
  );
  return results;
}

async function fetchEDCBI(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    const query = `${client.name} ${client.company ?? ''} enforcement directorate ED CBI SFIO probe investigation`;
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 6,
        useAutoprompt: false,
        type: 'keyword',
        contents: { text: { maxCharacters: 400 } },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? [])
      .filter((r: { title?: string; text?: string }) =>
        isRelevant(r.title ?? r.text ?? '', client.name)
      )
      .slice(0, 4)
      .map((r: { url: string; title: string; text?: string; publishedDate?: string }) => ({
        source: 'ED/CBI/SFIO (Enforcement)',
        category: 'regulatory',
        url: r.url,
        title: r.title,
        snippet: r.text?.slice(0, 400) ?? '',
        date: r.publishedDate,
        metadata: { crisisSignal: true, via: 'exa' },
      }));
  } catch {
    return [];
  }
}

async function fetchECourts(client: ClientProfile): Promise<SourceResult[]> {
  // eCourts via SerpAPI — direct scraping requires district court selection
  const results = await searchRegulatoryViaSerp(
    'ecourts.gov.in', client.name, 'eCourts India', 'regulatory'
  );
  return results.slice(0, 3);
}

export async function fetchRegulatorySources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];

  const [sebi, rbi, mca, nclt, cci, edcbi, ecourts] = await Promise.allSettled([
    fetchSEBI(client),
    fetchRBI(client),
    fetchMCA(client),
    fetchNCLT(client),
    fetchCCI(client),
    fetchEDCBI(client),
    fetchECourts(client),
  ]);

  const allResults: SourceResult[] = [];
  const tasks = [
    { name: 'SEBI', r: sebi },
    { name: 'RBI', r: rbi },
    { name: 'MCA India', r: mca },
    { name: 'NCLT/NCLAT', r: nclt },
    { name: 'CCI', r: cci },
    { name: 'ED/CBI', r: edcbi },
    { name: 'eCourts', r: ecourts },
  ];

  for (const { name, r } of tasks) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
    else errors.push(`${name}: ${r.reason?.message ?? 'failed'}`);
  }

  return {
    module: 'Indian Regulatory & Legal',
    results: allResults,
    sourcesScanned: 6,
    errors,
    durationMs: Date.now() - start,
  };
}
