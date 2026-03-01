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
    <div className="flex min-h-screen bg-neutral-50">
      <SidebarNav user={user} role={role} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
