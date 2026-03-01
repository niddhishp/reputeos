// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SidebarNav } from '@/components/shared/sidebar-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch role from user_profiles (fallback to user_metadata for new signups)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  const role =
    profile?.role ??
    user.user_metadata?.role ??
    'consultant';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080C14' }}>
      <SidebarNav user={user} role={role} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
