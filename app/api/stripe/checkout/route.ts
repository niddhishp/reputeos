/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for plan purchase or add-on.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { PLANS, ADD_ONS } from '@/lib/stripe/config';
import type { PlanId, AddOnId } from '@/lib/stripe/config';
import { z } from 'zod';

const schema = z.object({
  type: z.enum(['plan', 'addon']),
  id: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = schema.parse(await req.json());
    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com';

    let priceId: string;
    let mode: 'subscription' | 'payment';

    if (body.type === 'plan') {
      const plan = PLANS[body.id as PlanId];
      if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
      if (!plan.priceId) return NextResponse.json({ error: `Stripe price not configured for plan: ${body.id}` }, { status: 500 });
      priceId = plan.priceId;
      mode = 'subscription';
    } else {
      const addon = ADD_ONS[body.id as AddOnId];
      if (!addon) return NextResponse.json({ error: 'Invalid add-on' }, { status: 400 });
      if (!addon.priceId) return NextResponse.json({ error: `Stripe price not configured for add-on: ${body.id}` }, { status: 500 });
      priceId = addon.priceId;
      mode = addon.type === 'recurring' ? 'subscription' : 'payment';
    }

    // Get or create Stripe customer
    let customerId: string | undefined;
    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email ?? '',
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('user_subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        subscription_status: 'pending',
        plan_id: null,
        add_ons: [],
        scan_credits: 0,
      }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl ?? `${appUrl}/dashboard/clients?checkout=success&product=${body.id}`,
      cancel_url: body.cancelUrl ?? `${appUrl}/pricing?checkout=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        product_type: body.type,
        product_id: body.id,
      },
      ...(mode === 'subscription' && {
        subscription_data: {
          metadata: { supabase_user_id: user.id, product_id: body.id },
        },
      }),
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[Stripe checkout]', err);
    const msg = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
