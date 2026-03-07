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

  const aiOk = !!(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  const searchOk = !!(process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY || process.env.EXA_API_KEY);
  const isHealthy = dbOk && aiOk;

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV ?? 'unknown',
    checks: {
      database: { ok: dbOk, latencyMs: dbMs, ...(dbError ? { error: dbError } : {}) },
      ai: { ok: aiOk, provider: process.env.OPENROUTER_API_KEY ? 'openrouter' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : 'none' },
      search: { ok: searchOk, provider: process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY ? 'serpapi' : process.env.EXA_API_KEY ? 'exa' : 'none' },
    },
  }, {
    status: isHealthy ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function HEAD() {
  const supabase = await createClient();
  const { error } = await supabase.from('clients').select('id').limit(1);
  return new Response(null, { status: error ? 503 : 200 });
}
