// app/(marketing)/home/layout.tsx
// Metadata + structured data for the marketing home page
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ReputeOS — Your Reputation Has a Number. Find It.',
  description:
    "ReputeOS is the world's first Strategic Reputation Engineering platform. Measure your LSI score, choose from 54 archetypes, and build executive authority with AI precision. 14-day free trial.",
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ReputeOS — Your Reputation Has a Number. Find It.',
    description:
      'LSI scoring. 54 archetypes. NLP-validated content. Statistical proof of improvement. Start free.',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ReputeOS',
  applicationCategory: 'BusinessApplication',
  description:
    "The world's first Strategic Reputation Engineering platform. Measure your LSI score, choose from 54 archetypes, and build executive authority with AI precision.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
  offers: {
    '@type': 'Offer',
    price: '29',
    priceCurrency: 'USD',
    priceValidUntil: '2026-12-31',
  },
  provider: {
    '@type': 'Organization',
    name: 'ReputeOS',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
  },
  featureList: [
    'LSI (Leadership Sentiment Index) Scoring',
    '54-Archetype Positioning System',
    'AI-Powered Content Generation',
    'NLP Compliance Validation',
    'Statistical Reputation Proof',
    'Crisis Monitoring & Shield',
  ],
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {children}
    </>
  );
}
