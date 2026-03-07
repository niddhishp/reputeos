import { requireAdmin } from '@/lib/admin/auth';

export const maxDuration = 60;

const CANDIDATES = [
  'anthropic/claude-sonnet-4-6',
  'anthropic/claude-opus-4-6',
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.5-haiku',
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
        messages: [{ role: 'user', content: 'Reply with exactly: {"ok":true}' }],
        max_tokens: 20,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, error: (err as { error?: { message?: string } }).error?.message ?? 'unknown' };
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    return { ok: true, content: data.choices?.[0]?.message?.content };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available in production' }, { status: 404 });
  }
  await requireAdmin();

  const apiKey = process.env.OPENROUTER_API_KEY ?? '';
  if (!apiKey) return Response.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 400 });

  const results = await Promise.all(
    CANDIDATES.map(async (id) => ({ model: id, result: await probe(id, apiKey) }))
  );

  return Response.json({ candidates: results });
}
