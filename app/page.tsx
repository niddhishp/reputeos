// app/page.tsx
// Root route — show marketing page to visitors, redirect logged-in users to app
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged in → go straight to the app
  if (user) redirect('/dashboard/clients');

  // Not logged in → show marketing homepage
  redirect('/home');
}
