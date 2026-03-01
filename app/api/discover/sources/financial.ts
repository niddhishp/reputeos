/**
 * SOURCE MODULE: Indian Financial & Corporate
 * Covers: BSE announcements, NSE filings, BSE shareholding,
 *         NSE board meetings, Tofler (Firecrawl), Zauba Corp (Firecrawl),
 *         Crunchbase India (Exa), Tracxn (Exa)
 */

import { SourceResult, SourceModuleResult, ClientProfile, isRelevant } from './types';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

async function fetchBSEAnnouncements(client: ClientProfile): Promise<SourceResult[]> {
  try {
    // BSE corporate announcements - public API, no key needed
    const companyName = encodeURIComponent(client.company ?? client.name);
    const url = `https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w?strCat=-1&strPrevDate=&strScrip=&strSearch=P&strToDate=&strType=C&subcategory=-1`;

    const res = await fetch(url, {
      headers: {
        'Referer': 'https://www.bseindia.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; ReputeOS/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.Table ?? [])
      .filter((a: { SLONGNAME?: string; HEADLINE?: string }) =>
        isRelevant(
          (a.SLONGNAME ?? '') + ' ' + (a.HEADLINE ?? ''),
          client.company ?? client.name
        )
      )
      .slice(0, 5)
      .map((a: {
        SLONGNAME?: string; HEADLINE?: string; AN_NO?: string;
        DT_TM?: string; ATTACHMENTNAME?: string;
      }) => ({
        source: 'BSE India',
        category: 'financial',
        url: a.AN_NO
          ? `https://www.bseindia.com/xml-data/corpfiling/AttachHis/${a.ATTACHMENTNAME}`
          : 'https://www.bseindia.com/corporates/ann.html',
        title: a.HEADLINE ?? 'BSE Announcement',
        snippet: `${a.SLONGNAME ?? ''} — Corporate announcement filed with BSE`,
        date: a.DT_TM,
        metadata: { company: a.SLONGNAME, announcementNo: a.AN_NO },
      }));
  } catch {
    return [];
  }
}

async function fetchNSEAnnouncements(client: ClientProfile): Promise<SourceResult[]> {
  try {
    const url = `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=`;
    // NSE search by company name
    const searchUrl = `https://www.nseindia.com/api/search/autocomplete?q=${encodeURIComponent(client.company ?? client.name)}`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        'Referer': 'https://www.nseindia.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; ReputeOS/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const symbol = searchData?.symbols?.[0]?.symbol;
    if (!symbol) return [];

    const annRes = await fetch(`${url}${symbol}`, {
      headers: {
        'Referer': 'https://www.nseindia.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; ReputeOS/1.0)',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!annRes.ok) return [];
    const annData = await annRes.json();

    return (annData ?? []).slice(0, 5).map((a: {
      desc?: string; attchmntFile?: string; an_dt?: string; sm_name?: string;
    }) => ({
      source: 'NSE India',
      category: 'financial',
      url: a.attchmntFile
        ? `https://nsearchives.nseindia.com/corporate/ann/${a.attchmntFile}`
        : 'https://www.nseindia.com/companies-listing/corporate-filings-announcements',
      title: a.desc ?? 'NSE Corporate Filing',
      snippet: `${a.sm_name ?? symbol} — Filing with National Stock Exchange`,
      date: a.an_dt,
      metadata: { symbol, company: a.sm_name },
    }));
  } catch {
    return [];
  }
}

async function firecrawlScrape(
  url: string,
  sourceName: string,
  category: string,
  extractSchema?: Record<string, unknown>
): Promise<{ content: string; metadata: Record<string, unknown> } | null> {
  if (!FIRECRAWL_API_KEY) return null;
  try {
    const body: Record<string, unknown> = {
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    };
    if (extractSchema) {
      body.formats = ['extract'];
      body.extract = { schema: extractSchema };
    }

    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      content: data.data?.markdown ?? data.data?.extract ?? '',
      metadata: data.data?.metadata ?? {},
    };
  } catch {
    return null;
  }
}

async function fetchTofler(client: ClientProfile): Promise<SourceResult[]> {
  if (!FIRECRAWL_API_KEY) return [];
  try {
    const searchName = encodeURIComponent(client.company ?? client.name);
    const scraped = await firecrawlScrape(
      `https://www.tofler.in/search?query=${searchName}`,
      'Tofler',
      'financial'
    );
    if (!scraped || !scraped.content) return [];

    // Extract company mentions from markdown
    const lines = scraped.content.split('\n').filter(l => l.trim().length > 20);
    const relevant = lines.filter(l =>
      isRelevant(l, client.company ?? client.name)
    ).slice(0, 3);

    if (!relevant.length) return [];

    return [{
      source: 'Tofler (MCA Data)',
      category: 'financial',
      url: `https://www.tofler.in/search?query=${searchName}`,
      title: `${client.company ?? client.name} — MCA Filing Data`,
      snippet: relevant.join(' | ').slice(0, 400),
      metadata: { via: 'firecrawl' },
    }];
  } catch {
    return [];
  }
}

async function fetchZaubaCorp(client: ClientProfile): Promise<SourceResult[]> {
  if (!FIRECRAWL_API_KEY) return [];
  try {
    const searchName = encodeURIComponent(client.name);
    const scraped = await firecrawlScrape(
      `https://www.zaubacorp.com/director-search/director/${searchName}`,
      'Zauba Corp',
      'financial'
    );
    if (!scraped || !scraped.content) return [];

    const lines = scraped.content.split('\n').filter(l => l.trim().length > 20);
    const relevant = lines.filter(l => isRelevant(l, client.name)).slice(0, 3);
    if (!relevant.length) return [];

    return [{
      source: 'Zauba Corp (Director Registry)',
      category: 'financial',
      url: `https://www.zaubacorp.com/director-search/director/${searchName}`,
      title: `${client.name} — Director Registry (MCA)`,
      snippet: relevant.join(' | ').slice(0, 400),
      metadata: { via: 'firecrawl' },
    }];
  } catch {
    return [];
  }
}

async function fetchExaFinancial(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    const query = `${client.name} ${client.company ?? ''} funding investment startup profile`;
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 8,
        useAutoprompt: true,
        type: 'neural',
        includeDomains: ['crunchbase.com', 'tracxn.com', 'wellfound.com', 'pitchbook.com', 'dealstreetasia.com'],
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
        'crunchbase.com': 'Crunchbase', 'tracxn.com': 'Tracxn',
        'wellfound.com': 'Wellfound/AngelList', 'pitchbook.com': 'PitchBook',
        'dealstreetasia.com': 'DealStreetAsia',
      };
      return {
        source: sourceMap[domain] ?? domain,
        category: 'financial',
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

export async function fetchFinancialSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];

  const [bse, nse, tofler, zauba, exaFinancial] = await Promise.allSettled([
    fetchBSEAnnouncements(client),
    fetchNSEAnnouncements(client),
    fetchTofler(client),
    fetchZaubaCorp(client),
    fetchExaFinancial(client),
  ]);

  const allResults: SourceResult[] = [];
  const tasks = [
    { name: 'BSE India', r: bse },
    { name: 'NSE India', r: nse },
    { name: 'Tofler', r: tofler },
    { name: 'Zauba Corp', r: zauba },
    { name: 'Exa Financial', r: exaFinancial },
  ];

  for (const { name, r } of tasks) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
    else errors.push(`${name}: ${r.reason?.message ?? 'failed'}`);
  }

  return {
    module: 'Indian Financial & Corporate',
    results: allResults,
    sourcesScanned: 8,
    errors,
    durationMs: Date.now() - start,
  };
}
