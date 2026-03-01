/**
 * SOURCE MODULE: Academic & Research
 * Covers: Google Scholar (SerpAPI), Semantic Scholar,
 *         SSRN (Exa), ResearchGate (Exa), IIM/IIT mentions (Exa)
 */

import { SourceResult, SourceModuleResult, ClientProfile, isRelevant } from './types';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

async function fetchGoogleScholar(client: ClientProfile): Promise<SourceResult[]> {
  if (!SERPAPI_KEY) return [];
  try {
    // Search for papers by/about this person
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('api_key', SERPAPI_KEY);
    url.searchParams.set('engine', 'google_scholar');
    url.searchParams.set('q', `"${client.name}"`);
    url.searchParams.set('num', '8');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();

    const results: SourceResult[] = [];

    // Author profile if found
    if (data.author_info) {
      results.push({
        source: 'Google Scholar',
        category: 'academic',
        url: `https://scholar.google.com/citations?user=${data.author_info.author_id ?? ''}`,
        title: `${client.name} — Google Scholar Profile`,
        snippet: `${data.author_info.affiliations ?? ''} | ${data.author_info.cited_by?.table?.[0]?.citations?.all ?? 0} total citations`,
        metadata: {
          authorId: data.author_info.author_id,
          citedBy: data.author_info.cited_by,
          interests: data.author_info.interests,
        },
      });
    }

    // Individual papers
    for (const paper of (data.organic_results ?? []).slice(0, 5)) {
      results.push({
        source: 'Google Scholar',
        category: 'academic',
        url: paper.link ?? '',
        title: paper.title ?? '',
        snippet: paper.snippet ?? '',
        date: paper.publication_info?.summary,
        metadata: {
          citedBy: paper.inline_links?.cited_by?.total,
          authors: paper.publication_info?.authors,
        },
      });
    }
    return results;
  } catch {
    return [];
  }
}

async function fetchSemanticScholar(client: ClientProfile): Promise<SourceResult[]> {
  try {
    // Author search
    const authorUrl = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(client.name)}&fields=name,paperCount,citationCount,hIndex,papers.title,papers.year,papers.citationCount,papers.externalIds&limit=3`;
    const res = await fetch(authorUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();

    const results: SourceResult[] = [];

    for (const author of (data.data ?? []).slice(0, 2)) {
      if (!isRelevant(author.name ?? '', client.name)) continue;

      results.push({
        source: 'Semantic Scholar',
        category: 'academic',
        url: `https://www.semanticscholar.org/author/${encodeURIComponent(author.name)}/${author.authorId}`,
        title: `${author.name} — Research Profile`,
        snippet: `${author.paperCount ?? 0} papers | ${author.citationCount ?? 0} citations | h-index: ${author.hIndex ?? 'N/A'}`,
        metadata: {
          authorId: author.authorId,
          paperCount: author.paperCount,
          citationCount: author.citationCount,
          hIndex: author.hIndex,
        },
      });

      // Top papers
      for (const paper of (author.papers ?? []).slice(0, 3)) {
        if (!paper.title) continue;
        const doi = paper.externalIds?.DOI;
        results.push({
          source: 'Semantic Scholar',
          category: 'academic',
          url: doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${paper.paperId ?? ''}`,
          title: paper.title,
          snippet: `Academic paper (${paper.year ?? 'n/d'}) — ${paper.citationCount ?? 0} citations`,
          date: paper.year?.toString(),
          metadata: { citationCount: paper.citationCount, doi },
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function fetchExaAcademic(client: ClientProfile): Promise<SourceResult[]> {
  if (!EXA_API_KEY) return [];
  try {
    // SSRN, ResearchGate, Academia.edu, IIM/IIT mentions
    const query = `${client.name} research paper article academic industry expertise`;
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: { 'x-api-key': EXA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        numResults: 10,
        useAutoprompt: true,
        type: 'neural',
        includeDomains: [
          'ssrn.com', 'researchgate.net', 'academia.edu',
          'iimb.ac.in', 'iimk.ac.in', 'iima.ac.in', 'iimahd.ernet.in',
          'iitb.ac.in', 'iitd.ac.in', 'iitm.ac.in', 'iimcal.ac.in',
          'iim.ac.in', 'insead.edu', 'hbs.edu',
        ],
        contents: { text: { maxCharacters: 400 } },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.results ?? [])
      .filter((r: { title?: string }) => isRelevant(r.title ?? '', client.name))
      .slice(0, 6)
      .map((r: { url: string; title: string; text?: string; publishedDate?: string }) => {
        const domain = new URL(r.url).hostname.replace('www.', '');
        const sourceMap: Record<string, string> = {
          'ssrn.com': 'SSRN', 'researchgate.net': 'ResearchGate',
          'academia.edu': 'Academia.edu', 'iimb.ac.in': 'IIM Bangalore',
          'iima.ac.in': 'IIM Ahmedabad', 'iimk.ac.in': 'IIM Kozhikode',
          'iitb.ac.in': 'IIT Bombay', 'iitd.ac.in': 'IIT Delhi',
        };
        return {
          source: sourceMap[domain] ?? domain,
          category: 'academic',
          url: r.url,
          title: r.title,
          snippet: r.text?.slice(0, 400) ?? '',
          date: r.publishedDate,
          metadata: { via: 'exa', domain },
        };
      });
  } catch {
    return [];
  }
}

export async function fetchAcademicSources(client: ClientProfile): Promise<SourceModuleResult> {
  const start = Date.now();
  const errors: string[] = [];

  const [scholar, semantic, exaAcademic] = await Promise.allSettled([
    fetchGoogleScholar(client),
    fetchSemanticScholar(client),
    fetchExaAcademic(client),
  ]);

  const allResults: SourceResult[] = [];
  const tasks = [
    { name: 'Google Scholar', r: scholar },
    { name: 'Semantic Scholar', r: semantic },
    { name: 'Exa Academic', r: exaAcademic },
  ];

  for (const { name, r } of tasks) {
    if (r.status === 'fulfilled') allResults.push(...r.value);
    else errors.push(`${name}: ${r.reason?.message ?? 'failed'}`);
  }

  return {
    module: 'Academic & Research',
    results: allResults,
    sourcesScanned: 4,
    errors,
    durationMs: Date.now() - start,
  };
}
