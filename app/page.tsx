// app/page.tsx
// Root route — the middleware handles this redirect, but this is a fallback
// in case middleware doesn't run (e.g., static export mode).
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // Try to check auth, but always fall back to /home if Supabase isn't configured
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/dashboard/clients');
  } catch {
    // Supabase not configured or error — show marketing page
  }

  redirect('/home');
}
