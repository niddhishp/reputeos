// app/api/discover/trigger-scan/route.ts
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({ clientId: z.string().uuid() });

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

    const { clientId } = parsed.data;

    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).eq('user_id', user.id).single();
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Create the discover run record
    const { data: run, error: runError } = await supabase.from('discover_runs').insert({
      client_id: clientId,
      status: 'in_progress',
    }).select().single();

    if (runError) throw runError;

    // In production: trigger n8n webhook or Supabase Edge Function here
    // await fetch(process.env.N8N_WEBHOOK_URL!, { method: 'POST', ... })

    return NextResponse.json({ runId: run.id, status: 'in_progress' });
  } catch (err) {
    console.error('[discover/trigger-scan]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
