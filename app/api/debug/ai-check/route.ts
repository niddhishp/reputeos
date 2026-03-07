import { callAI } from '@/lib/ai/call';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available' }, { status: 404 });
  }
  await requireAdmin();
  const keys = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
    openai:     !!process.env.OPENAI_API_KEY,
  };

  const results: Record<string, unknown> = {};

  // Test smart model
  try {
    const r = await callAI({
      systemPrompt: 'You are a test.',
      userPrompt: 'Reply with exactly: {"ok":true}',
      json: true, maxTokens: 20, temperature: 0, timeoutMs: 15_000, model: 'smart',
    });
    results.smart = { ok: true, provider: r.provider, model: r.model };
  } catch (e) {
    results.smart = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Test fast model
  try {
    const r = await callAI({
      systemPrompt: 'You are a test.',
      userPrompt: 'Reply with exactly: {"ok":true}',
      json: true, maxTokens: 20, temperature: 0, timeoutMs: 15_000, model: 'fast',
    });
    results.fast = { ok: true, provider: r.provider, model: r.model };
  } catch (e) {
    results.fast = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const allOk = (results.smart as Record<string,unknown>)?.ok && (results.fast as Record<string,unknown>)?.ok;
  return Response.json({ status: allOk ? 'ok' : 'degraded', keys, results });
}
