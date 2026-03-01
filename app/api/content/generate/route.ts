/**
 * Content Generation API
 * POST /api/content/generate
 *
 * Uses Claude Sonnet 3.5 (via OpenRouter) or GPT-4o for thought leadership content.
 * Pulls real positioning from DB, builds archetype-calibrated system prompt.
 */

import { z } from 'zod';
import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';

const Schema = z.object({
  clientId:   z.string().uuid(),
  platform:   z.enum(['linkedin_long', 'linkedin_short', 'twitter_thread', 'oped', 'whitepaper', 'keynote']),
  topic:      z.string().min(5).max(500),
  templateId: z.string().optional(), // influencer template id
  tone:       z.enum(['authoritative', 'conversational', 'provocative', 'analytical']).optional(),
});

const PLATFORM_SPECS: Record<string, { label: string; wordCount: string; format: string; instructions: string }> = {
  linkedin_long: {
    label: 'LinkedIn Article',
    wordCount: '800–1,200 words',
    format: 'Long-form article',
    instructions: `Start with a bold one-line hook (no "See more" cut-off in first sentence).
Use short paragraphs (2–3 lines max). Include a personal anecdote or data point by paragraph 3.
End with a specific question to drive comments. No hashtag spam.`,
  },
  linkedin_short: {
    label: 'LinkedIn Post',
    wordCount: '150–250 words',
    format: 'Short-form post',
    instructions: `First line must stop the scroll — use a surprising insight or counter-intuitive statement.
3–4 short paragraphs. End with ONE focused question. No hashtags.`,
  },
  twitter_thread: {
    label: 'X / Twitter Thread',
    wordCount: '10–15 tweets',
    format: 'Numbered thread',
    instructions: `Tweet 1: Hook — bold claim or surprising statistic.
Tweets 2–12: One insight per tweet, numbered (2/, 3/ etc).
Tweet 13+: Summary or call to action.
Each tweet under 280 characters. No filler.`,
  },
  oped: {
    label: 'Op-Ed (ET/Mint/Bloomberg)',
    wordCount: '700–900 words',
    format: 'Opinion piece',
    instructions: `Opening paragraph: state your thesis clearly. Three supporting arguments with evidence.
Counter-argument + rebuttal in paragraph 4. Strong concluding call to action.
Suitable for Economic Times, Mint, or Bloomberg Opinion.`,
  },
  whitepaper: {
    label: 'Whitepaper',
    wordCount: '1,500–2,500 words',
    format: 'Research document',
    instructions: `Executive Summary (150 words). Problem statement with data. Solution framework.
3–4 sections with subheadings. Case study or example. Conclusion with next steps.
Professional, research-backed tone. Include specific metrics where possible.`,
  },
  keynote: {
    label: 'Keynote Outline',
    wordCount: '400–600 words',
    format: 'Presentation outline',
    instructions: `Opening hook (30 seconds). 3-act structure with clear arc.
Act 1 (Problem): The uncomfortable truth. Act 2 (Shift): Your unique insight.
Act 3 (Future): What's possible. Strong closing line. Include speaker notes for each section.`,
  },
};

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 });

  const { clientId, platform, topic, templateId, tone } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  // ── Fetch positioning + influencer template ───────────────────────────────
  const [{ data: client }, { data: positioning }, { data: template }] = await Promise.all([
    supabase.from('clients').select('name, role, industry, company').eq('id', clientId).single(),
    supabase.from('positioning').select('*').eq('client_id', clientId).maybeSingle(),
    templateId
      ? supabase.from('influencer_profiles')
          .select('name, content_template, style_adaptation_notes, uniqueness_guardrails')
          .eq('id', templateId).eq('scan_status', 'completed').maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const spec = PLATFORM_SPECS[platform];
  const archetype      = (positioning?.personal_archetype as string) ?? 'Expert Authority';
  const businessArch   = (positioning?.business_archetype  as string) ?? '';
  const pillars        = (positioning?.content_pillars as Array<{ name: string; themes: string[] }>) ?? [];
  const statement      = (positioning?.positioning_statement as string) ?? '';
  const voiceTone      = tone ?? 'authoritative';

  // ── System prompt ─────────────────────────────────────────────────────────
  const systemPrompt = `You are a ghost-writer for ${client?.name ?? 'this executive'}, a ${client?.role ?? 'leader'} in the ${client?.industry ?? 'industry'} sector at ${client?.company ?? 'their company'}.

ARCHETYPE: ${archetype}${businessArch ? ` (Personal) + ${businessArch} (Business)` : ''}
POSITIONING: ${statement || 'A respected expert who creates measurable impact.'}
VOICE TONE: ${voiceTone}

${pillars.length > 0 ? `CONTENT PILLARS (stay within these themes):
${pillars.slice(0, 5).map((p, i) => `${i + 1}. ${p.name}: ${p.themes.join(', ')}`).join('\n')}` : ''}

NLP REQUIREMENTS (non-negotiable):
1. Linguistic frames: Use "expert", "leader", "proven" frames. Avoid "family", "legacy", "wealth" frames.
2. Authority markers: Include at least 2 of: a presupposition ("Based on my X years..."), a factive verb ("demonstrates", "establishes"), a quantified achievement.
3. Archetype alignment: Write as the ${archetype} — embody their core traits and voice in every sentence.
4. No corporate clichés ("leverage synergies", "move the needle", "game-changer").
5. Specific over generic: use actual numbers, real examples, named frameworks.

FORMAT REQUIREMENTS (${spec.label}):
Target: ${spec.wordCount}
${spec.instructions}

${template ? `INFLUENCER STYLE TEMPLATE (from "${(template as Record<string, unknown>).name}"):
STRUCTURE/PACING TO MATCH: ${(template as Record<string, unknown>).content_template ?? ''}
ADAPTATION NOTES: ${(template as Record<string, unknown>).style_adaptation_notes ?? ''}
UNIQUENESS GUARDRAILS: ${((template as Record<string, unknown>).uniqueness_guardrails as string[] ?? []).join('; ')}` : ''}

Write ONLY the content. No preamble. No "Here is your article:". No meta-commentary.`;

  // ── Generate ──────────────────────────────────────────────────────────────
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey     = process.env.OPENAI_API_KEY;

  if (!openrouterKey && !openaiKey) {
    return Response.json({ error: 'No AI API key configured', message: 'Add OPENROUTER_API_KEY or OPENAI_API_KEY to environment variables.' }, { status: 503 });
  }

  const endpoint = openrouterKey
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  // Claude Sonnet for long-form, GPT-4o-mini for short posts
  const model = openrouterKey
    ? (platform === 'linkedin_short' || platform === 'twitter_thread'
      ? 'anthropic/claude-haiku-3-5'
      : 'anthropic/claude-sonnet-4-5')
    : 'gpt-4o';

  const maxTokens = platform === 'whitepaper' ? 3500 : platform === 'twitter_thread' ? 1200 : 2000;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey ?? openaiKey}`,
        'Content-Type': 'application/json',
        ...(openrouterKey ? { 'HTTP-Referer': 'https://reputeos.com', 'X-Title': 'ReputeOS' } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: `Write a ${spec.label} about: ${topic}` },
        ],
        temperature: voiceTone === 'provocative' ? 0.85 : voiceTone === 'analytical' ? 0.5 : 0.7,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data  = await res.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('AI returned empty content');

    // ── Word count ────────────────────────────────────────────────────────
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // ── Quick NLP compliance snapshot ────────────────────────────────────
    const cl = content.toLowerCase();
    const compliance = {
      hasAuthorityMarkers: /\d+\s*(year|month|billion|million|percent|%)|based on|having (built|led|managed)|i've (built|led|run|managed)/i.test(content),
      expertFramePresent:  cl.includes('expert') || cl.includes('proven') || cl.includes('demonstrates') || cl.includes('establishes'),
      familyFrameAbsent:   !cl.includes('family business') && !cl.includes('our family') && !cl.includes('legacy'),
      wordCount,
      estimatedReadTime:   `${Math.ceil(wordCount / 200)} min`,
    };

    // ── Save draft ────────────────────────────────────────────────────────
    const admin = createAdminClient();
    const { data: saved } = await admin.from('content_items').insert({
      client_id:    clientId,
      positioning_id: positioning?.id ?? null,
      title:        topic.slice(0, 100),
      body:         content,
      platform,
      nlp_compliance: compliance,
      status:       'draft',
    }).select('id').single();

    return Response.json({
      success:    true,
      contentId:  saved?.id,
      content,
      platform,
      spec:       { label: spec.label, wordCount: spec.wordCount },
      compliance,
      modelUsed:  model,
    });

  } catch (err) {
    console.error('Content generation error:', err);
    return Response.json({
      error:   'Generation failed',
      message: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
