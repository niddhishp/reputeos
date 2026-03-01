/**
 * Archetype Assignment API (Phase 3 — Native implementation of n8n workflow)
 * 
 * POST /api/archetype/assign
 * Uses GPT-4o to assign business + character archetypes based on client profile + discovery data.
 */

import { createClient, createAdminClient, verifyClientOwnership } from '@/lib/supabase/server';
import { z } from 'zod';

const Schema = z.object({ clientId: z.string().uuid() });

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });

  const { clientId } = parsed.data;
  const isOwner = await verifyClientOwnership(clientId);
  if (!isOwner) return Response.json({ error: 'Forbidden' }, { status: 403 });

  // Get client + latest discover run
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });

  const { data: discoverRun } = await supabase
    .from('discover_runs')
    .select('sentiment_dist, frame_dist, top_keywords, total_mentions, archetype_hints, crisis_signals, analysis_summary')
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lsiRun } = await supabase
    .from('lsi_runs')
    .select('total_score, components, gaps')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const result = await assignArchetypes({ client, discoverRun, lsiRun });

    // Save positioning record
    const admin = createAdminClient();
    await admin.from('positioning').upsert({
      client_id: clientId,
      mode: 'personal_only',
      personal_archetype: result.personalArchetype.id,
      business_archetype: result.businessArchetype.id,
      archetype_confidence: result.confidence,
      followability_score: result.followabilityScore,
      followability_factors: result.followabilityFactors,
      positioning_statement: result.positioningStatement,
      content_pillars: result.contentPillars,
      signature_lines: result.signatureLines,
      target_influencers: [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' });

    return Response.json({ success: true, ...result });
  } catch (err) {
    console.error('Archetype assignment error:', err);
    return Response.json({ error: 'Analysis failed', message: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

async function assignArchetypes({ client, discoverRun, lsiRun }: {
  client: Record<string, unknown>;
  discoverRun: Record<string, unknown> | null;
  lsiRun: Record<string, unknown> | null;
}) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const frames = (discoverRun?.frame_dist as Record<string, number>) || {};
  const archetypeHints = (discoverRun?.archetype_hints as string[]) || [];
  const crisisSignals = (discoverRun?.crisis_signals as string[]) || [];
  const discoverySummary = (discoverRun?.analysis_summary as string) || '';
  const lsiTotal = (lsiRun?.total_score as number) || 40;
  const gaps = (lsiRun?.gaps as Array<{component: string; gap: number}>) || [];

  const clientProfile = {
    name: client.name,
    role: client.role,
    company: client.company,
    industry: client.industry,
    bio: client.bio || '',
    keywords: client.keywords || [],
    lsiScore: lsiTotal,
    lsiComponents: lsiRun?.components || {},
    dominantFrame: Object.entries(frames).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other',
    secondaryFrame: Object.entries(frames).sort((a, b) => b[1] - a[1])[1]?.[0] || 'other',
    frameDistribution: frames,
    topGaps: gaps.slice(0, 3).map(g => g.component),
    topKeywords: (discoverRun?.top_keywords as string[]) || [],
    archetypeHints,
    crisisSignals,
    discoverySummary,
    sentimentDist: discoverRun?.sentiment_dist || { positive: 50, neutral: 30, negative: 20 },
    totalMentions: discoverRun?.total_mentions || 0,
  };

  if (!openaiKey && !openrouterKey) {
    return generateFallbackArchetypes(clientProfile);
  }

  const systemPrompt = `You are a strategic reputation consultant and NLP expert specialising in Jungian archetypes for executive personal branding in India and emerging markets.

You receive a professional's full digital footprint data from 62 sources: LSI scores, linguistic frame distribution, sentiment patterns, top keywords, AI-generated archetype hints, and crisis signals.

CHARACTER ARCHETYPES (Jungian 12): Sage, Hero, Explorer, Rebel, Magician, Caregiver, Creator, Ruler, Jester, Lover, Everyman, Innocent
BUSINESS ARCHETYPES (14): Visionary Disruptor, Expert Authority, Humble Servant Leader, Strategic Operator, Inspiring Coach, Social Entrepreneur, Legacy Builder, Category Creator, Turnaround Specialist, Ethical Capitalist, Community Catalyst, Patient Investor, Crisis Navigator, Bridge Builder

SCORING:
- Behavioral fit: Does frame distribution match archetype traits?
- Authenticity: Does their background/keywords support this archetype?
- Market opportunity: Is this archetype underserved in their industry/region?
- Crisis mitigation: Does choice address their LSI gaps?
- Followability: Historical engagement for this archetype type

If crisis_signals exist, factor archetype choice around reputation recovery, not just growth.

Return ONLY valid JSON:
{
  "personalArchetype": {"id": "sage", "name": "The Sage", "description": "2-3 sentences why this fits their specific data", "traits": ["Trait1","Trait2","Trait3","Trait4"], "voice": "Precise voice description: tone, sentence structure, authority style"},
  "businessArchetype": {"id": "expert-authority", "name": "Expert Authority", "description": "2-3 sentences why", "pillars": ["Pillar1","Pillar2","Pillar3"]},
  "alternatePersonal": {"id": "ruler", "name": "The Ruler", "reason": "Why second choice"},
  "confidence": 82,
  "followabilityScore": 74,
  "followabilityFactors": {"uniqueness": 70, "emotionalResonance": 75, "contentOpportunity": 80, "platformFit": 68, "historicalPerformance": 65},
  "positioningStatement": "One precise sentence capturing unique value in their market",
  "contentPillars": [
    {"name": "Name", "themes": ["t1","t2","t3"], "frequency": "2x/week", "formats": ["LinkedIn article","Short post"]},
    {"name": "Name", "themes": ["t1","t2","t3"], "frequency": "1x/week", "formats": ["Thread","Op-ed"]},
    {"name": "Name", "themes": ["t1","t2","t3"], "frequency": "1x/week", "formats": ["Story post","Podcast"]},
    {"name": "Name", "themes": ["t1","t2","t3"], "frequency": "2x/month", "formats": ["Whitepaper","LinkedIn article"]},
    {"name": "Name", "themes": ["t1","t2","t3"], "frequency": "2x/month", "formats": ["Thread","Panel talk"]}
  ],
  "signatureLines": ["Identity statement","Value proposition","Differentiation","Mission","Legacy statement"],
  "rootCauseInsights": ["Gap 1 and cause","Gap 2 and cause","Gap 3 and cause"],
  "strategicInsights": ["Recommendation 1","Recommendation 2","Recommendation 3"]
}`;

  const endpoint = openrouterKey && !openaiKey
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const authKey = openrouterKey && !openaiKey ? openrouterKey : openaiKey;
  const model = openrouterKey && !openaiKey ? 'openai/gpt-4o' : 'gpt-4o';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'Content-Type': 'application/json',
      ...((openrouterKey && !openaiKey) ? { 'HTTP-Referer': 'https://reputeos.com', 'X-Title': 'ReputeOS' } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Assign archetypes and positioning for:\n${JSON.stringify(clientProfile, null, 2)}` },
      ],
      temperature: 0.4,
      max_tokens: 1800,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) throw new Error(`AI API error: ${res.status} ${await res.text().then(t => t.slice(0,200))}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('AI returned invalid JSON for archetype assignment');
  }
}

function generateFallbackArchetypes(profile: Record<string, unknown>) {
  const industry = (profile.industry as string || '').toLowerCase();
  const isFinance = industry.includes('finance') || industry.includes('banking');
  const isHealth = industry.includes('health');

  return {
    personalArchetype: {
      id: isFinance ? 'ruler' : isHealth ? 'caregiver' : 'sage',
      name: isFinance ? 'The Ruler' : isHealth ? 'The Caregiver' : 'The Sage',
      description: 'A natural authority figure who commands respect through wisdom and decisiveness.',
      traits: ['Strategic', 'Decisive', 'Authoritative', 'Visionary'],
      voice: 'Confident, measured, and precise. Speaks with authority on complex topics.',
    },
    businessArchetype: {
      id: 'expert-authority',
      name: 'Expert Authority',
      description: 'Known for deep expertise and trusted insights in their domain.',
      pillars: ['Thought Leadership', 'Industry Expertise', 'Strategic Vision'],
    },
    confidence: 70,
    followabilityScore: 65,
    followabilityFactors: { uniqueness: 65, emotionalResonance: 60, contentOpportunity: 70, platformFit: 65, historicalPerformance: 60 },
    positioningStatement: `${profile.name} is a trusted ${profile.role || 'leader'} known for deep expertise and impactful insights in ${profile.industry || 'their field'}.`,
    contentPillars: [
      { name: 'Industry Insights', themes: ['Market trends', 'Emerging opportunities', 'Sector analysis'], frequency: '2x/week', formats: ['LinkedIn article', 'Short-form post'] },
      { name: 'Leadership Lessons', themes: ['Decision-making', 'Building teams', 'Navigating uncertainty'], frequency: '1x/week', formats: ['Story post', 'Thread'] },
      { name: 'Expert Commentary', themes: ['News reactions', 'Policy analysis', 'Research interpretation'], frequency: '1x/week', formats: ['Quick take', 'Op-ed'] },
    ],
    signatureLines: [
      `${profile.role || 'Executive'} | ${profile.industry || 'Business'} Expert | Sharing what I learn`,
      `Helping organizations navigate complexity in ${profile.industry || 'today\'s market'}`,
    ],
  };
}
