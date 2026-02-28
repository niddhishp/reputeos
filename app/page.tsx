// app/page.tsx
// Root redirect is handled by middleware.ts
// This page should never be seen — middleware redirects / → /clients or /login
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/clients');
}
