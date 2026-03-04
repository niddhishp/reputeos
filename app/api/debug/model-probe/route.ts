export const maxDuration = 60;

const CANDIDATES = [
  'anthropic/claude-opus-4-6',
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-opus-4-5',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-opus-4',
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-haiku',
  'anthropic/claude-3.5-sonnet-20241022',
  'anthropic/claude-3-haiku',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-sonnet',
];

async function probe(modelId: string, apiKey: string) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://reputeos.com',
        'X-Title': 'ReputeOS',
      },
      body: JSON.stringify({
        model: modelId,
        provider: { order: ['amazon-bedrock'], allow_fallbacks: false },
        messages: [{ role: 'user', content: 'Reply: ok' }],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    const data = await res.json() as { error?: { message?: string } };
    if (!res.ok) return { ok: false, error: data.error?.message ?? `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ error: 'No OPENROUTER_API_KEY' }, { status: 500 });

  const results = await Promise.all(
    CANDIDATES.map(async (id) => ({ model: id, ...await probe(id, apiKey) }))
  );

  return Response.json({
    working: results.filter(r => r.ok).map(r => r.model),
    failing: results.filter(r => !r.ok).map(r => ({ model: r.model, error: r.error })),
  });
}
