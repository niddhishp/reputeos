/**
 * POST /api/stripe/webhook
 * Handles all Stripe webhook events — this is the billing source of truth.
 * 
 * Events handled:
 *  - checkout.session.completed     → provision plan / add-on / credits
 *  - customer.subscription.updated  → plan change
 *  - customer.subscription.deleted  → cancellation
 *  - invoice.payment_failed         → mark as past_due
 */
import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/server';
import { PLANS, ADD_ONS, getPlanByPriceId } from '@/lib/stripe/config';
import type Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch (err) {
    console.error('[Webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session, admin);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, admin);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, admin);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, admin);
        break;
      default:
        // Acknowledge but ignore other events
        break;
    }
  } catch (err) {
    console.error(`[Webhook] error handling ${event.type}`, err);
    // Return 200 to prevent Stripe retrying — log for manual review
    return NextResponse.json({ received: true, error: String(err) });
  }

  return NextResponse.json({ received: true });
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleCheckoutComplete(session: Stripe.Checkout.Session, admin: ReturnType<typeof createAdminClient>) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) { console.error('[Webhook] no supabase_user_id in session metadata'); return; }

  const productType = session.metadata?.product_type;
  const productId   = session.metadata?.product_id;

  if (productType === 'plan') {
    const plan = PLANS[productId as keyof typeof PLANS];
    if (!plan) return;

    const initialCredits = plan.scanCreditsPerMonth === -1 ? 9999 : plan.scanCreditsPerMonth;
    const resetAt = new Date();
    resetAt.setMonth(resetAt.getMonth() + 1);

    await admin.from('user_subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan_id: productId,
      subscription_status: 'active',
      scan_credits: initialCredits,
      scans_used_this_month: 0,
      scans_reset_at: resetAt.toISOString(),
      is_trial: false,
    }, { onConflict: 'user_id' });

    // Also update user_metadata for quick access
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { plan: productId },
    });

    console.log(`[Webhook] provisioned plan ${productId} for user ${userId}`);
  } else if (productType === 'addon') {
    if (productId === 'scan_credits_20') await addScanCredits(userId, 20, admin);
    else if (productId === 'scan_credits_100') await addScanCredits(userId, 100, admin);
    else {
      // Recurring add-on — add to add_ons array
      const { data } = await admin.from('user_subscriptions').select('add_ons').eq('user_id', userId).maybeSingle();
      const current = (data?.add_ons as string[]) ?? [];
      if (!current.includes(productId!)) {
        await admin.from('user_subscriptions').upsert({
          user_id: userId,
          add_ons: [...current, productId],
        }, { onConflict: 'user_id' });
      }
    }
    console.log(`[Webhook] provisioned add-on ${productId} for user ${userId}`);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription, admin: ReturnType<typeof createAdminClient>) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) return;

  // Find plan from price ID
  const priceId = sub.items.data[0]?.price.id;
  const planId = getPlanByPriceId(priceId);

  const updates: Record<string, unknown> = {
    subscription_status: sub.status,
    stripe_subscription_id: sub.id,
  };

  if (planId) {
    updates.plan_id = planId;
    await admin.auth.admin.updateUserById(userId, { user_metadata: { plan: planId } });
  }

  await admin.from('user_subscriptions').upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });
  console.log(`[Webhook] subscription updated for user ${userId} → status=${sub.status}`);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription, admin: ReturnType<typeof createAdminClient>) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) return;

  await admin.from('user_subscriptions').upsert({
    user_id: userId,
    subscription_status: 'cancelled',
    plan_id: null,
  }, { onConflict: 'user_id' });

  await admin.auth.admin.updateUserById(userId, { user_metadata: { plan: null } });
  console.log(`[Webhook] subscription cancelled for user ${userId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice, admin: ReturnType<typeof createAdminClient>) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  await admin.from('user_subscriptions')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId);

  console.log(`[Webhook] payment failed for customer ${customerId}`);
}

async function addScanCredits(userId: string, amount: number, admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.from('user_subscriptions').select('scan_credits').eq('user_id', userId).maybeSingle();
  const current = data?.scan_credits ?? 0;
  await admin.from('user_subscriptions').upsert({
    user_id: userId,
    scan_credits: current + amount,
  }, { onConflict: 'user_id' });
}
