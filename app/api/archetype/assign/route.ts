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
    .select('sentiment_summary, frame_distribution, top_keywords, total_mentions')
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
  const apiKey = process.env.OPENAI_API_KEY;
  const frames = (discoverRun?.frame_distribution as Record<string, number>) || {};
  const lsiTotal = (lsiRun?.total_score as number) || 40;
  const gaps = (lsiRun?.gaps as Array<{component: string; gap: number}>) || [];

  const clientProfile = {
    name: client.name,
    role: client.role,
    company: client.company,
    industry: client.industry,
    lsiScore: lsiTotal,
    dominantFrame: Object.entries(frames).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other',
    topGaps: gaps.slice(0, 3).map(g => g.component),
    topKeywords: (discoverRun?.top_keywords as string[]) || [],
  };

  if (!apiKey) {
    return generateFallbackArchetypes(clientProfile);
  }

  const systemPrompt = `You are a strategic reputation consultant and expert in Jungian archetypes for personal branding.

Given a professional's profile and reputation data, assign:
1. A CHARACTER archetype (Jungian): Choose from: Sage, Hero, Explorer, Rebel, Magician, Caregiver, Creator, Ruler, Jester, Lover, Everyman, Innocent
2. A BUSINESS archetype: Choose from: Visionary Disruptor, Expert Authority, Humble Servant Leader, Strategic Operator, Inspiring Coach, Social Entrepreneur, Legacy Builder, Category Creator, Turnaround Specialist, Ethical Capitalist, Community Catalyst, Patient Investor, Crisis Navigator, Bridge Builder

Return ONLY this JSON structure:
{
  "personalArchetype": {"id": "sage", "name": "The Sage", "description": "...", "traits": ["..."], "voice": "..."},
  "businessArchetype": {"id": "expert-authority", "name": "Expert Authority", "description": "...", "pillars": ["..."]},
  "confidence": 85,
  "followabilityScore": 72,
  "followabilityFactors": {"uniqueness": 70, "emotionalResonance": 75, "contentOpportunity": 80, "platformFit": 68, "historicalPerformance": 65},
  "positioningStatement": "One sentence positioning statement",
  "contentPillars": [{"name": "...", "themes": ["...", "..."], "frequency": "2x/week", "formats": ["LinkedIn article", "Thread"]}],
  "signatureLines": ["...", "...", "..."]
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Assign archetypes for this professional:\n${JSON.stringify(clientProfile, null, 2)}` }
      ],
      temperature: 0.4,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content.replace(/```json|```/g, '').trim());
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
