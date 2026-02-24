// app/api/content/generate/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { z } from 'zod'
import { rateLimiter, aiRateLimiter } from '@/lib/ratelimit'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const Schema = z.object({
  clientId: z.string().uuid(),
  topic: z.string().min(10).max(500),
  platform: z.enum(['linkedin', 'twitter', 'medium', 'op_ed', 'keynote']),
  templateId: z.string().uuid().optional()
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anon'
  const { success: ipOk } = await rateLimiter.limit(ip)
  if (!ipOk) return Response.json({ error: 'Rate limit' }, { status: 429 })

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: aiOk } = await aiRateLimiter.limit(user.id)
  if (!aiOk) return Response.json({ error: 'AI rate limit' }, { status: 429 })

  const parsed = Schema.safeParse(await request.json())
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })
  const { clientId, topic, platform, templateId } = parsed.data

  // Verify ownership
  const { data: client } = await supabase.from("clients")
    .select("*").eq("id", clientId).eq("user_id", user.id).single()
  if (!client) return Response.json({ error: 'Forbidden' }, { status: 403 })

  // Load positioning
  const { data: pos } = await supabase.from("positioning")
    .select("*").eq("client_id", clientId).single()

  // Build prompt
  const archetype = pos?.personal_archetype ?? "Thought Leader"
const pillars = pos?.content_pillars?.map((p: any) => p.name).join(", ") ?? ""

  const systemPrompt = `You are writing as a ${archetype} in ${client.industry ?? "business"}.
    Voice: authoritative, accessible, evidence-based.
    Content pillars: ${pillars}.
    Platform: ${platform}. Format appropriately for the platform.
    Output only the content — no meta-commentary.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write about: ${topic}` }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = completion.choices[0].message.content ?? ""

  // Save draft to DB
  const { data: saved } = await supabase.from("content_items").insert({
    client_id: clientId,
    positioning_id: pos?.id,
    body: content,
    platform,
    status: 'draft'
  }).select().single()

  return Response.json({ content, contentId: saved?.id })
}
