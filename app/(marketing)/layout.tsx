// app/(marketing)/layout.tsx
import type { Metadata } from 'next';

// Marketing pages are public and should be indexed
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
