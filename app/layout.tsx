import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ReputeOS — Strategic Reputation Engineering',
    template: '%s | ReputeOS',
  },
  description:
    "The world's first Strategic Reputation Engineering platform. Measure your LSI score, select your archetype, and systematically build executive reputation with AI and statistical precision.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com'),
  keywords: ['reputation management', 'personal branding', 'LSI score', 'executive reputation', 'thought leadership', 'reputation engineering'],
  authors: [{ name: 'ReputeOS' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://reputeos.com',
    siteName: 'ReputeOS',
    title: 'ReputeOS — Strategic Reputation Engineering',
    description: "The world's first platform to measure, engineer, and prove your professional reputation. Get your LSI score free.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ReputeOS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReputeOS — Strategic Reputation Engineering',
    description: "Get your LSI score free. 54-archetype positioning system. Statistical proof of reputation improvement.",
    images: ['/og-image.png'],
  },
  // App routes are not indexed; marketing pages override this
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
