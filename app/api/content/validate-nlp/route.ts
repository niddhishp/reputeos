// app/api/content/validate-nlp/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({
  content: z.string().min(10),
  positioningId: z.string().uuid().optional(),
  clientId: z.string().uuid(),
});

const AUTHORITY_PATTERNS = [
  /based on my \d+[\+]?\s*years/i, /in my experience/i, /having (built|led|managed|scaled)/i,
  /the framework (I|we) developed/i, /according to (my|our) research/i,
  /\d+[\+]?\s*(years|decade)/i, /I('ve| have) (built|led|managed|founded)/i,
];
const FACTIVE_VERBS = ['demonstrate', 'establish', 'build', 'achieve', 'prove', 'show', 'reveal', 'confirm'];

function detectAuthorityMarkers(content: string) {
  const markers: Array<{ type: string; text: string }> = [];
  AUTHORITY_PATTERNS.forEach(pattern => {
    const match = content.match(pattern);
    if (match) markers.push({ type: 'presupposition', text: match[0] });
  });
  FACTIVE_VERBS.forEach(verb => {
    if (content.toLowerCase().includes(verb)) markers.push({ type: 'factive', text: verb });
  });
  const numbers = content.match(/\d+[\+]?\s*(years|billion|million|percent|%|clients|projects)/gi);
  if (numbers) numbers.forEach(n => markers.push({ type: 'quantification', text: n }));
  return { count: markers.length, markers };
}

function checkFrames(content: string) {
  const targetFrames = ['expert', 'leader', 'innovator', 'founder', 'strategist', 'authority'];
  const avoidFrames = ['controversy', 'scandal', 'dispute', 'crisis', 'problem', 'failure'];
  const lower = content.toLowerCase();
  return {
    passed: targetFrames.some(f => lower.includes(f)) && !avoidFrames.some(f => lower.includes(f)),
    targetFramesPresent: targetFrames.filter(f => lower.includes(f)),
    avoidFramesDetected: avoidFrames.filter(f => lower.includes(f)),
  };
}

function analyzeSentiment(content: string): number {
  const positive = ['success', 'achieve', 'grow', 'lead', 'innovate', 'build', 'transform', 'opportunity', 'strong', 'proven'].filter(w => content.toLowerCase().includes(w)).length;
  const negative = ['fail', 'problem', 'crisis', 'risk', 'decline', 'loss', 'controversy'].filter(w => content.toLowerCase().includes(w)).length;
  return Math.max(-1, Math.min(1, (positive - negative * 1.5) / 10));
}

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
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { content, clientId } = parsed.data;

    const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).eq('user_id', user.id).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const frameCheck = checkFrames(content);
    const authorityMarkers = detectAuthorityMarkers(content);
    const sentimentScore = analyzeSentiment(content);

    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(Boolean).length;
    const avgSentenceLength = sentences > 0 ? Math.round(words / sentences) : 0;
    const questions = (content.match(/\?/g) || []).length;

    const passed = frameCheck.passed && authorityMarkers.count >= 2 && sentimentScore > 0;

    const suggestions = [];
    if (!frameCheck.passed) suggestions.push({ issue: 'Missing authority framing', suggestion: 'Add expert positioning language (e.g., "as an industry leader", "based on my experience")', impact: '+15% alignment' });
    if (authorityMarkers.count < 2) suggestions.push({ issue: 'Insufficient authority markers', suggestion: 'Include quantified achievements or presuppositions (e.g., "having built X companies", "in my 15 years...")', impact: '+12% credibility' });
    if (words < 150) suggestions.push({ issue: 'Content too short', suggestion: 'Expand to at least 200 words for thought leadership impact', impact: '+8% engagement' });
    if (questions === 0) suggestions.push({ issue: 'No reader engagement question', suggestion: 'Add a rhetorical question to invite reflection', impact: '+6% engagement' });

    return NextResponse.json({
      passed,
      checks: {
        frameCheck,
        authorityMarkers,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        archetypeAlignment: Math.min(70 + authorityMarkers.count * 5, 95),
        voiceConsistency: passed ? 82 : 58,
        wordCount: words,
        avgSentenceLength,
      },
      suggestions,
    });
  } catch (err) {
    console.error('[validate-nlp]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
