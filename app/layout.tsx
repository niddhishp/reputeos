import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SkipLink } from '@/components/accessibility/skip-link';
import { OrganizationSchema, SoftwareApplicationSchema } from '@/components/seo/structured-data';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'ReputeOS | Strategic Reputation Engineering for Executives',
    template: '%s | ReputeOS',
  },
  description: "The world's first AI-powered Strategic Reputation Engineering platform. Build, measure, and protect your professional reputation with scientific precision.",
  keywords: [
    'executive reputation management',
    'personal branding',
    'CEO reputation strategy',
    'thought leadership platform',
    'executive social media strategy',
    'LSI score',
    'reputation engineering',
    'AI content generation',
    'crisis monitoring',
    'executive presence',
  ],
  authors: [{ name: 'ReputeOS' }],
  creator: 'ReputeOS',
  publisher: 'ReputeOS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'ReputeOS',
    title: 'ReputeOS | Strategic Reputation Engineering for Executives',
    description: "AI-powered platform for executive reputation management. Build authority, manage sentiment, and grow your influence with our 6-module strategic framework.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'ReputeOS - Strategic Reputation Engineering Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReputeOS | Strategic Reputation Engineering',
    description: "AI-powered platform for executive reputation management. Build authority, manage sentiment, and grow your influence.",
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/twitter-image.jpg`],
    creator: '@reputeos',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <OrganizationSchema />
        <SoftwareApplicationSchema />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <SkipLink />
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            className: 'shadow-modal',
          }}
        />
      </body>
    </html>
  );
}
