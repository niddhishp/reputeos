/**
 * POST /api/admin/test-prompt
 * Runs a system+user prompt pair against the AI and returns the result.
 * Used by the admin Prompt Editor to test prompts before saving.
 * Capped at 1000 tokens to keep costs minimal.
 */
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { callAI } from '@/lib/ai/call';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json() as {
      systemPrompt: string;
      userPrompt: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };

    if (!body.systemPrompt?.trim()) {
      return Response.json({ error: 'systemPrompt is required' }, { status: 400 });
    }
    if (!body.userPrompt?.trim()) {
      return Response.json({ error: 'userPrompt is required' }, { status: 400 });
    }

    // Hard cap to keep test costs minimal
    const maxTokens = Math.min(body.maxTokens ?? 800, 1000);
    const temperature = typeof body.temperature === 'number'
      ? Math.max(0, Math.min(1, body.temperature))
      : 0.4;

    const model = (body.model === 'smart' || body.model === 'fast')
      ? body.model
      : 'fast'; // default to cheap model for tests

    const t0 = Date.now();
    const result = await callAI({
      systemPrompt: body.systemPrompt.trim(),
      userPrompt:   body.userPrompt.trim(),
      model,
      temperature,
      maxTokens,
      timeoutMs: 30_000,
      operation: 'admin_test_prompt',
    });

    return Response.json({
      result:    result.content,
      model:     result.model,
      provider:  result.provider,
      tokensIn:  result.tokensIn,
      tokensOut: result.tokensOut,
      costUsd:   result.costUsd,
      latencyMs: Date.now() - t0,
    });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg.includes('Forbidden') ? 403 : 500;
    return Response.json({ error: msg }, { status });
  }
}
