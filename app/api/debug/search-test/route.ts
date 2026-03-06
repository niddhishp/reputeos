/**
 * GET /api/debug/search-test?name=Niddhish+Puuzhakkal&q=optional+query
 * 
 * Runs a live SerpAPI search and returns raw results.
 * Use to diagnose why certain articles aren't being found.
 * Auth-protected — only usable if you have a valid session.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') ?? '';
  const customQuery = searchParams.get('q') ?? '';

  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  if (!SERPAPI_KEY) return NextResponse.json({ error: 'SERPAPI_KEY not set' });

  const query = customQuery || name;
  const results: Record<string, unknown>[] = [];

  // Test 3 query variants
  const variants = [
    query,                          // as-is
    `"${name}"`,                    // exact quoted name
    name.replace(/([aeiou])\1/gi, '$1'),  // de-doubled vowels variant
  ].filter((v, i, a) => a.indexOf(v) === i);  // unique

  for (const q of variants) {
    try {
      const url = new URL('https://serpapi.com/search');
      url.searchParams.set('api_key', SERPAPI_KEY);
      url.searchParams.set('engine', 'google');
      url.searchParams.set('q', q);
      url.searchParams.set('gl', 'in');
      url.searchParams.set('num', '10');

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
      const data = await res.json();

      const organic = (data.organic_results ?? []).map((r: Record<string,unknown>) => ({
        position: r.position,
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      }));

      results.push({
        query: q,
        status: res.status,
        totalResults: data.search_information?.total_results,
        organicCount: organic.length,
        organic,
        error: data.error,
      });
    } catch (e) {
      results.push({ query: q, error: String(e) });
    }
  }

  return NextResponse.json({
    name,
    variants,
    results,
    serpApiKeyPresent: !!SERPAPI_KEY,
    exaKeyPresent: !!process.env.EXA_API_KEY,
    firecrawlKeyPresent: !!process.env.FIRECRAWL_API_KEY,
  });
}
