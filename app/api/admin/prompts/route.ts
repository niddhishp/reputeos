/**
 * GET  /api/admin/prompts       - list all prompts
 * PATCH /api/admin/prompts      - update a prompt by key
 */
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .order('module', { ascending: true })
      .order('label', { ascending: true });
    if (error) throw error;
    return Response.json({ prompts: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: e instanceof Error && msg.includes('Forbidden') ? 403 : 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json() as {
      key: string;
      system_prompt?: string;
      user_prompt_template?: string;
      temperature?: number;
      max_tokens?: number;
      model?: string;
      is_active?: boolean;
    };

    if (!body.key) return Response.json({ error: 'key required' }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user?.id };
    if (body.system_prompt          !== undefined) updates.system_prompt           = body.system_prompt;
    if (body.user_prompt_template   !== undefined) updates.user_prompt_template    = body.user_prompt_template;
    if (body.temperature            !== undefined) updates.temperature             = body.temperature;
    if (body.max_tokens             !== undefined) updates.max_tokens              = body.max_tokens;
    if (body.model                  !== undefined) updates.model                   = body.model;
    if (body.is_active              !== undefined) updates.is_active               = body.is_active;

    const { data, error } = await supabase
      .from('system_prompts')
      .update(updates)
      .eq('key', body.key)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ prompt: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
