// app/dashboard/clients/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Search, MoreVertical, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { supabase } from '@/lib/supabase/client';

interface Client {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  industry: string | null;
  status: string;
  baseline_lsi: number | null;
  target_lsi: number;
  created_at: string;
  updated_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setClients(data);
        setFiltered(data);
      }
      setLoading(false);
    }
    fetchClients();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company ?? '').toLowerCase().includes(q) ||
          (c.industry ?? '').toLowerCase().includes(q)
      )
    );
  }, [search, clients]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clients</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} managed
          </p>
        </div>
        <Button onClick={() => router.push('/clients/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matching clients' : 'No clients yet'}
          description={
            search
              ? 'Try a different search term.'
              : 'Add your first client to get started with reputation engineering.'
          }
          action={
            !search
              ? { label: 'Add Client', onClick: () => router.push('/clients/new') }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => router.push(`/clients/${client.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientCard({
  client,
  onClick,
}: {
  client: Client;
  onClick: () => void;
}) {
  const progress = client.baseline_lsi
    ? Math.round((client.baseline_lsi / client.target_lsi) * 100)
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-neutral-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 truncate">{client.name}</p>
            {client.company && (
              <p className="text-sm text-neutral-500 truncate">{client.company}</p>
            )}
          </div>
          <Badge
            variant={client.status === 'active' ? 'default' : 'secondary'}
            className="ml-2 shrink-0"
          >
            {client.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {client.industry && (
          <p className="text-xs text-neutral-400">{client.industry}</p>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">LSI Score</span>
          {client.baseline_lsi ? (
            <span className="font-semibold text-blue-600">{client.baseline_lsi}/100</span>
          ) : (
            <span className="text-neutral-400">Not scored</span>
          )}
        </div>

        {progress !== null && (
          <div className="w-full bg-neutral-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <p className="text-xs text-neutral-400">
          Updated {formatDistanceToNow(new Date(client.updated_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
