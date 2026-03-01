/**
 * POST /api/influencer/discover
 *
 * Mini-discovery for a mapped influencer:
 * 1. Searches LinkedIn + Google News + Twitter for their content
 * 2. Extracts content DNA from top 3-5 posts (Firecrawl + GPT-4o)
 * 3. Scores them: archetype fit + content quality + aspiration score
 * 4. Generates client-specific style adaptation notes
 * 5. Saves full profile to influencer_profiles table
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';

const Schema = z.object({
  clientId:      z.string().uuid(),
  influencerName: z.string().min(2),
  linkedinUrl:   z.string().url().optional(),
  archetype:     z.string(),           // the target archetype e.g. "The Maven"
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOpenRouterKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');
  return key;
}

async function callAI(systemPrompt: string, userPrompt: string, json = true): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getOpenRouterKey()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 2500,
      temperature: 0.3,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

/** Lightweight web search for influencer content */
async function searchInfluencerContent(name: string, linkedinUrl?: string): Promise<Array<{ url: string; snippet: string; platform: string }>> {
  const posts: Array<{ url: string; snippet: string; platform: string }> = [];

  // 1. SerpAPI — LinkedIn posts
  const serpKey = process.env.SERPAPI_KEY;
  if (serpKey) {
    try {
      const queries = [
        `"${name}" site:linkedin.com/posts`,
        `"${name}" thought leadership article`,
        `"${name}" LinkedIn author`,
      ];

      for (const q of queries.slice(0, 2)) {
        const res = await fetch(
          `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&num=5&api_key=${serpKey}`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) continue;
        const data = await res.json() as { organic_results?: Array<{ link: string; snippet: string }> };
        (data.organic_results ?? []).slice(0, 3).forEach(r => {
          if (r.link && r.snippet) {
            posts.push({
              url: r.link,
              snippet: r.snippet,
              platform: r.link.includes('linkedin') ? 'linkedin' :
                        r.link.includes('twitter') || r.link.includes('x.com') ? 'twitter' : 'web',
            });
          }
        });
      }
    } catch { /* continue */ }
  }

  // 2. Exa.ai — semantic search for thought leadership
  const exaKey = process.env.EXA_API_KEY;
  if (exaKey && posts.length < 4) {
    try {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${name} thought leadership content insights`,
          numResults: 5,
          useAutoprompt: true,
          type: 'neural',
          contents: { text: { maxCharacters: 500 } },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json() as { results?: Array<{ url: string; text?: string; title?: string }> };
        (data.results ?? []).slice(0, 3).forEach(r => {
          if (r.url) {
            posts.push({
              url: r.url,
              snippet: r.text ?? r.title ?? '',
              platform: r.url.includes('linkedin') ? 'linkedin' : 'web',
            });
          }
        });
      }
    } catch { /* continue */ }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return posts.filter(p => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  }).slice(0, 6);
}

/** Scrape and extract text from a URL via Firecrawl */
async function scrapeContent(url: string): Promise<string> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return '';
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return '';
    const data = await res.json() as { data?: { markdown?: string } };
    return (data.data?.markdown ?? '').slice(0, 3000);
  } catch { return ''; }
}

// ── DNA Extraction ────────────────────────────────────────────────────────────

async function extractContentDNA(posts: Array<{ url: string; snippet: string; platform: string; fullText?: string }>, influencerName: string) {
  const contentSamples = posts
    .map((p, i) => `POST ${i + 1} [${p.platform}]:\n${p.fullText ?? p.snippet}`)
    .join('\n\n---\n\n');

  const raw = await callAI(
    `You are an expert content strategist analyzing a thought leader's content patterns.
Analyze the provided content samples and extract the exact DNA — structural, stylistic, and emotional patterns.
Return a single JSON object.`,
    `Analyze ${influencerName}'s content across these ${posts.length} samples:

${contentSamples}

Return JSON with this EXACT structure:
{
  "structure": {
    "hook_pattern": "First line always starts with a bold contrarian claim",
    "opening_style": "single sentence, usually a question or provocative statement",
    "body_pattern": "3-5 short paragraphs, each with one insight + one example",
    "proof_style": "uses specific numbers and named company examples",
    "cta_pattern": "ends with a rhetorical question inviting reflection"
  },
  "style": {
    "avg_words_per_post": 280,
    "avg_sentence_length": 12,
    "paragraph_length": "1-2 sentences",
    "pacing": "fast",
    "active_voice_pct": 88,
    "uses_bullets": false,
    "uses_bold_text": true,
    "signature_phrases": ["The truth is...", "Here's what most people miss:"]
  },
  "emotional_triggers": ["intellectual_curiosity", "insider_knowledge", "urgency", "inspiration"],
  "authority_markers": ["Years of experience", "Named clients", "Specific metrics"],
  "dominant_frames": ["expert", "insider", "challenger"],
  "avoided_frames": ["family", "legacy", "celebrity"],
  "content_pillars": [
    {"theme": "Leadership misconceptions", "frequency": "40%"},
    {"theme": "Industry data insights", "frequency": "35%"},
    {"theme": "Career lessons", "frequency": "25%"}
  ],
  "reusable_template": "HOOK: [Bold contrarian claim in 1 sentence]\n\nThe reality: [2 sentence explanation]\n\n[3 supporting points, each 1-2 sentences with a specific example]\n\n[Closing insight or forward-looking statement]\n\n[Rhetorical question to the reader]",
  "what_makes_them_followable": "Their content consistently challenges conventional wisdom with specific data. Never generic advice — always a fresh angle on a familiar problem.",
  "weaknesses_to_avoid": "Occasionally too abstract. Client should always add India-specific grounding."
}`,
    true
  );

  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { raw_analysis: raw, parse_error: true };
  }
}

// ── Scoring ───────────────────────────────────────────────────────────────────

async function scoreInfluencer(
  influencerName: string,
  archetype: string,
  dna: Record<string, unknown>,
  clientData: { archetype?: string; lsiScore?: number; industry?: string }
): Promise<{ archetypeFit: number; contentQuality: number; aspirationScore: number; notes: string; guardrails: string[] }> {

  const raw = await callAI(
    `You are a reputation strategy consultant scoring an influencer's value as a role model for a client.
Return JSON only.`,
    `Score this influencer for the client:

INFLUENCER: ${influencerName}
TARGET ARCHETYPE: ${archetype}
INFLUENCER DNA SUMMARY: ${JSON.stringify(dna).slice(0, 800)}

CLIENT CONTEXT:
- Current archetype: ${clientData.archetype ?? 'unassigned'}
- Current LSI: ${clientData.lsiScore ?? 'unknown'}/100
- Industry: ${clientData.industry ?? 'unknown'}

Score and return:
{
  "archetype_fit_score": 85,        // 0-100: how well they embody the target archetype
  "content_quality_score": 78,      // 0-100: quality/authority of their content
  "aspiration_score": 82,           // composite: how valuable to learn from for THIS client
  "style_adaptation_notes": "Use their hook structure and 1-sentence paragraphs. Replace fintech examples with the client's sustainability lens. Keep the data-first proof style. Avoid their tendency toward abstract closing statements.",
  "uniqueness_guardrails": [
    "Always ground insights in India-specific market data",
    "Reference personal founder journey — not present in the influencer's content",
    "Add sector-specific regulation context the influencer never covers",
    "Client's voice is warmer — keep humanity even when using influencer's direct style"
  ]
}`,
    true
  );

  try {
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
    return {
      archetypeFit:     parsed.archetype_fit_score ?? 70,
      contentQuality:   parsed.content_quality_score ?? 70,
      aspirationScore:  parsed.aspiration_score ?? 70,
      notes:            parsed.style_adaptation_notes ?? '',
      guardrails:       parsed.uniqueness_guardrails ?? [],
    };
  } catch {
    return { archetypeFit: 70, contentQuality: 70, aspirationScore: 70, notes: raw, guardrails: [] };
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const { clientId, influencerName, linkedinUrl, archetype } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();

  // Get client context for scoring
  const { data: client } = await supabase.from('clients').select('industry').eq('id', clientId).single();
  const { data: positioning } = await supabase.from('positioning').select('personal_archetype').eq('client_id', clientId).maybeSingle();
  const { data: latestLSI } = await supabase.from('lsi_runs').select('total_score').eq('client_id', clientId).order('run_date', { ascending: false }).limit(1).maybeSingle();

  // Create initial profile record
  const { data: profile, error: profileErr } = await admin
    .from('influencer_profiles')
    .insert({
      client_id: clientId,
      name:      influencerName,
      linkedin_url: linkedinUrl ?? null,
      archetype,
      scan_status: 'scanning',
    })
    .select()
    .single();

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  const profileId = (profile as { id: string }).id;

  try {
    // ── Step 1: Search for content ─────────────────────────────────────────
    const contentPosts = await searchInfluencerContent(influencerName, linkedinUrl);

    // ── Step 2: Scrape full text for top 3 posts (if Firecrawl available) ──
    const enrichedPosts = await Promise.all(
      contentPosts.slice(0, 3).map(async post => {
        const fullText = await scrapeContent(post.url);
        return { ...post, fullText: fullText || post.snippet };
      })
    );

    // ── Step 3: Extract content DNA ────────────────────────────────────────
    const dna = await extractContentDNA(enrichedPosts, influencerName);

    // ── Step 4: Score the influencer ───────────────────────────────────────
    const scores = await scoreInfluencer(
      influencerName,
      archetype,
      dna as Record<string, unknown>,
      {
        archetype:  (positioning?.personal_archetype as string) ?? undefined,
        lsiScore:   latestLSI?.total_score,
        industry:   (client as Record<string, string> | null)?.industry,
      }
    );

    // ── Step 5: Save content samples ───────────────────────────────────────
    if (enrichedPosts.length > 0) {
      await admin.from('influencer_content_samples').insert(
        enrichedPosts.map(p => ({
          influencer_id:  profileId,
          url:            p.url,
          platform:       p.platform,
          content_text:   p.fullText ?? p.snippet,
        }))
      );
    }

    // ── Step 6: Update profile with full results ───────────────────────────
    await admin.from('influencer_profiles').update({
      scan_status:           'completed',
      total_mentions:        contentPosts.length,
      content_dna:           dna,
      sample_posts:          enrichedPosts.map(p => ({ url: p.url, platform: p.platform, snippet: p.snippet.slice(0, 200) })),
      archetype_fit_score:   scores.archetypeFit,
      content_quality_score: scores.contentQuality,
      aspiration_score:      scores.aspirationScore,
      style_adaptation_notes:scores.notes,
      uniqueness_guardrails: scores.guardrails,
      content_template:      (dna as Record<string, string>).reusable_template ?? null,
      updated_at:            new Date().toISOString(),
    }).eq('id', profileId);

    return NextResponse.json({
      profileId,
      influencerName,
      postsAnalyzed:    enrichedPosts.length,
      dna,
      scores,
      samplePosts:      enrichedPosts.map(p => ({ url: p.url, platform: p.platform })),
    });
  } catch (err) {
    // Mark as failed
    await admin.from('influencer_profiles').update({
      scan_status:  'failed',
      updated_at:   new Date().toISOString(),
    }).eq('id', profileId);

    console.error('[influencer/discover]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Discovery failed' }, { status: 500 });
  }
}
