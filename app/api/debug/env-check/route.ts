import { requireAdmin } from '@/lib/admin/auth';

export async function GET(request: Request) {
  // SECURITY: Admin-only in all environments; 404 in production.
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available' }, { status: 404 });
  }
  await requireAdmin();

  void request; // satisfy linter
  const keys = [
    // AI
    'OPENROUTER_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY',
    // Search
    'SERPAPI_API_KEY', 'SERPAPI_KEY',   // check both spellings
    'EXA_API_KEY',
    // Scraping
    'FIRECRAWL_API_KEY', 'APIFY_API_TOKEN', 'APIFY_TOKEN',
    // Database
    'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
    // Config
    'NEXT_PUBLIC_APP_URL',
    // Other
    'NEWSAPI_KEY', 'GUARDIAN_API_KEY', 'NYT_API_KEY', 'X_BEARER_TOKEN',
  ];

  // Flat map: KEY -> true/false  (what settings page expects)
  const flat: Record<string, boolean> = {};
  for (const k of keys) {
    flat[k] = !!process.env[k] && process.env[k] !== 'undefined' && process.env[k] !== '';
  }

  // SERPAPI_API_KEY aliases SERPAPI_KEY (some routes use one, some the other)
  if (!flat['SERPAPI_API_KEY'] && flat['SERPAPI_KEY']) flat['SERPAPI_API_KEY'] = true;
  if (!flat['APIFY_API_TOKEN'] && flat['APIFY_TOKEN']) flat['APIFY_API_TOKEN'] = true;

  return Response.json({
    // Flat map for settings page consumption
    ...flat,
    // Legacy arrays for any other consumers
    present: Object.entries(flat).filter(([,v]) => v).map(([k]) => k),
    missing: Object.entries(flat).filter(([,v]) => !v).map(([k]) => k),
  });
}
