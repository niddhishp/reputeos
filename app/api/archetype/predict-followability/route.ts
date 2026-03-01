// app/api/archetype/predict-followability/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  clientId: z.string().uuid(),
  personalArchetype: z.string().min(1),
  businessArchetype: z.string().optional(),
});

const ARCHETYPE_BASE_SCORES: Record<string, number> = {
  'The Sage': 78, 'The Maven': 82, 'The Hero': 75, 'The Rebel': 71,
  'The Explorer': 69, 'The Magician': 80, 'The Creator': 77, 'The Ruler': 73,
  'The Caregiver': 65, 'The Innocent': 60, 'The Jester': 68, 'The Everyman': 63,
  'The Scientist': 80, 'The Strategist': 79, 'The Operator': 74, 'The Investor': 76,
  'The Builder': 77, 'The Mentor': 72, 'The Visionary': 83, 'The Disruptor': 74,
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });

    const { clientId, personalArchetype, businessArchetype } = parsed.data;

    const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('user_id', user.id).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const base = ARCHETYPE_BASE_SCORES[personalArchetype] ?? 70;
    const dualBonus = businessArchetype ? 4 : 0;
    const followabilityScore = Math.min(Math.max(base + dualBonus, 40), 95);

    const factors = {
      uniqueness: Math.min(Math.round(base * 0.9 + (businessArchetype ? 5 : 0)), 95),
      emotionalResonance: Math.min(Math.round(base * 0.85), 90),
      contentOpportunity: Math.min(Math.round(base * 0.95), 95),
      platformFit: Math.min(Math.round(base * 0.88), 92),
      historicalPerformance: Math.min(Math.round(base * 0.82), 88),
    };

    return NextResponse.json({ followabilityScore, factors });
  } catch (err) {
    console.error('[predict-followability]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
