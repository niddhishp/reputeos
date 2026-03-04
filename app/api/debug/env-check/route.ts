export async function GET() {
  const keys = [
    'SERPAPI_KEY', 'EXA_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY',
    'NEWSAPI_KEY', 'GUARDIAN_API_KEY', 'NYT_API_KEY', 'FIRECRAWL_API_KEY',
    'APIFY_TOKEN', 'X_BEARER_TOKEN',
    'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const result: Record<string, boolean> = {};
  for (const k of keys) result[k] = !!process.env[k] && process.env[k] !== 'undefined';
  return Response.json({
    present: Object.entries(result).filter(([,v]) => v).map(([k]) => k),
    missing: Object.entries(result).filter(([,v]) => !v).map(([k]) => k),
  });
}
