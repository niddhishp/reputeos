import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const startTime = Date.now();

export async function GET() {
  const t0 = Date.now();
  let dbOk = false;
  let dbMs = 0;
  let dbError: string | undefined;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('clients').select('id').limit(1);
    dbMs = Date.now() - t0;
    dbOk = !error;
    if (error) dbError = error.message;
  } catch (e) {
    dbMs = Date.now() - t0;
    dbError = e instanceof Error ? e.message : 'unknown';
  }

  // Search provider availability (key presence, not live ping — fast)
  const searchProviders = {
    serpapi:    !!process.env.SERPAPI_KEY,
    exa:        !!process.env.EXA_API_KEY,
    google_cse: !!(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID),
    brave:      !!process.env.BRAVE_SEARCH_API_KEY,
    newsapi:    !!process.env.NEWSAPI_KEY,
  };
  const activeSearchProviders = Object.entries(searchProviders).filter(([,v]) => v).map(([k]) => k);
  const searchOk = activeSearchProviders.length > 0;

  // AI provider availability
  const aiProviders = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
    openai:     !!process.env.OPENAI_API_KEY,
  };
  const activeAiProviders = Object.entries(aiProviders).filter(([,v]) => v).map(([k]) => k);
  const aiOk = activeAiProviders.length > 0;

  // Scraping provider availability
  const scrapingProviders = {
    firecrawl: !!process.env.FIRECRAWL_API_KEY,
    jina:      true, // always available, free, no key needed
  };

  const isHealthy = dbOk && aiOk && searchOk;

  return NextResponse.json({
    status:    isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV ?? 'unknown',
    checks: {
      database: { ok: dbOk, latencyMs: dbMs, ...(dbError ? { error: dbError } : {}) },
      ai: {
        ok:        aiOk,
        active:    activeAiProviders,
        fallbacks: activeAiProviders.length,
      },
      search: {
        ok:        searchOk,
        active:    activeSearchProviders,
        fallbacks: activeSearchProviders.length,
        detail:    searchProviders,
      },
      scraping: {
        ok:     true, // Jina.ai is always available
        active: Object.entries(scrapingProviders).filter(([,v]) => v).map(([k]) => k),
      },
    },
    fallback_coverage: {
      search:   activeSearchProviders.length >= 2 ? 'full' : activeSearchProviders.length === 1 ? 'partial' : 'none',
      ai:       activeAiProviders.length >= 2 ? 'full' : activeAiProviders.length === 1 ? 'partial' : 'none',
      scraping: 'full', // Jina always available
    },
  }, {
    status:  isHealthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
