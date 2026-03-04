import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ModuleBreadcrumb } from '@/components/shared/module-breadcrumb';

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, company')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();          // maybeSingle — never throws, returns null if not found

  if (!client) notFound();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ModuleBreadcrumb clientId={id} clientName={client.name} />
      {children}
    </div>
  );
}
