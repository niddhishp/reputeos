import { NextResponse } from 'next/server';

export async function GET(): Promise<Response> {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey  = process.env.ANTHROPIC_API_KEY;
  const openaiKey     = process.env.OPENAI_API_KEY;

  const keys = {
    openrouter: !!openrouterKey,
    anthropic:  !!anthropicKey,
    openai:     !!openaiKey,
  };

  if (!openrouterKey) {
    return NextResponse.json({ status: 'error', message: 'No OPENROUTER_API_KEY', keys });
  }

  // Try every plausible Bedrock model ID until one works
  const candidates = [
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-5-sonnet',
    'anthropic/claude-3.5-sonnet:beta',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet',
  ];

  const providerVariants = [
    { order: ['Amazon Bedrock'], allow_fallbacks: false },   // Display name
    { order: ['amazon-bedrock'], allow_fallbacks: false },   // Slug
    { order: ['AWSBedrock'],     allow_fallbacks: false },   // Alt name
  ];

  const results: Record<string, unknown>[] = [];

  // Test first model with each provider name variant
  for (const pv of providerVariants) {
    const modelId = 'anthropic/claude-3.5-sonnet';
    const body = {
      model: modelId,
      provider: pv,
      messages: [
        { role: 'system', content: 'You are a test.' },
        { role: 'user',   content: 'Reply: {"ok":true}' },
      ],
      max_tokens: 20,
      temperature: 0,
    };

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type':  'application/json',
          'HTTP-Referer':  'https://reputeos.com',
          'X-Title':       'ReputeOS',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      const data = await res.json() as Record<string, unknown>;
      results.push({
        provider_sent: pv,
        model: modelId,
        status: res.status,
        ok: res.ok,
        response: res.ok
          ? (data as { choices?: Array<{ message: { content: string } }> }).choices?.[0]?.message?.content
          : data,
      });

      if (res.ok) {
        // Found working combo — stop here
        return NextResponse.json({
          status: 'ok',
          working_provider: pv,
          working_model: modelId,
          keys,
          all_results: results,
        });
      }
    } catch (e) {
      results.push({ provider_sent: pv, model: modelId, error: String(e) });
    }
  }

  // If all provider variants failed, try without provider field
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://reputeos.com',
        'X-Title':       'ReputeOS',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{ role: 'user', content: 'Reply: {"ok":true}' }],
        max_tokens: 20,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json() as Record<string, unknown>;
    results.push({ provider_sent: 'NONE', model: 'anthropic/claude-3.5-sonnet', status: res.status, response: data });
  } catch (e) {
    results.push({ provider_sent: 'NONE', error: String(e) });
  }

  return NextResponse.json({
    status: 'all_failed',
    message: 'No provider/model combination worked. See all_results for details.',
    keys,
    all_results: results,
  }, { status: 500 });
}
