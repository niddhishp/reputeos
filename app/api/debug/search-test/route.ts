/**
 * GET /api/debug/search-test?name=Niddhish+Puuzhakkal&q=optional+query
 * 
 * Runs a live SerpAPI search and returns raw results.
 * Use this to diagnose why certain articles aren't being found.
 * ADMIN ONLY — not available in production.
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  await requireAdmin();

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') ?? '';
  const customQuery = searchParams.get('q') ?? '';

  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  if (!SERPAPI_KEY) return NextResponse.json({ error: 'SERPAPI_KEY not set' });

  const query = customQuery || name;

  // Test 4 query variants to show which one finds your content
  const variants = [
    query,
    `"${name}"`,
    name.replace(/([aeiou])\1/gi, '$1'),  // Puuzhakkal → Puzhakal
    `${name} film director India`,
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const results = await Promise.all(variants.map(async (q) => {
    try {
      const url = new URL('https://serpapi.com/search');
      url.searchParams.set('api_key', SERPAPI_KEY);
      url.searchParams.set('engine', 'google');
      url.searchParams.set('q', q);
      url.searchParams.set('gl', 'in');
      url.searchParams.set('num', '10');

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      const data = await res.json();

      return {
        query: q,
        totalResults: data.search_information?.total_results,
        organic: (data.organic_results ?? []).map((r: Record<string, unknown>) => ({
          position: r.position,
          title: r.title,
          url: r.link,
          snippet: String(r.snippet ?? '').slice(0, 150),
        })),
        error: data.error,
      };
    } catch (e) {
      return { query: q, error: String(e), organic: [] };
    }
  }));

  return NextResponse.json({
    name,
    results,
    keys: {
      serpapi: !!SERPAPI_KEY,
      exa: !!process.env.EXA_API_KEY,
      firecrawl: !!process.env.FIRECRAWL_API_KEY,
    },
  });
}
