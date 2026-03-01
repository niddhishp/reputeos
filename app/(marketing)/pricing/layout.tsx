// app/(marketing)/pricing/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — ReputeOS',
  description:
    'ReputeOS pricing plans. Individual $29/mo, Professional $99/mo, Agency $299/mo. 14-day free trial, no credit card required. Dual pricing in USD and INR.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ReputeOS Pricing — Start Free, Pay for Results',
    description:
      'From $29/month. See your LSI score in 14 days. Upgrade when the data convinces you — and it will.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
