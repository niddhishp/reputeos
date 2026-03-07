/**
 * GET /api/stripe/entitlements
 * Returns current user's plan, add-ons, and scan credit balance.
 */
import { NextResponse } from 'next/server';
import { getUserEntitlements, getRemainingScans } from '@/lib/stripe/entitlements';

export async function GET() {
  try {
    const [entitlements, remainingScans] = await Promise.all([
      getUserEntitlements(),
      getRemainingScans(),
    ]);
    return NextResponse.json({ ...entitlements, remainingScans });
  } catch (err) {
    console.error('[Entitlements]', err);
    return NextResponse.json({ error: 'Failed to fetch entitlements' }, { status: 500 });
  }
}
