import { callAI } from '@/lib/ai/call';

export async function GET(): Promise<Response> {
  const keys = {
    openrouter: !!process.env.OPENROUTER_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
    openai:     !!process.env.OPENAI_API_KEY,
  };
  try {
    const result = await callAI({
      systemPrompt: 'You are a test.',
      userPrompt:   'Reply with exactly: {"ok":true}',
      json: true, maxTokens: 20, temperature: 0, timeoutMs: 15_000, model: 'fast',
    });
    return Response.json({ status: 'ok', provider: result.provider, model: result.model, keys });
  } catch (e) {
    return Response.json({ status: 'error', message: e instanceof Error ? e.message : String(e), keys }, { status: 500 });
  }
}
