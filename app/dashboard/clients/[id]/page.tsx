// app/dashboard/clients/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  BarChart2,
  Target,
  PenLine,
  CheckSquare,
  Shield,
  ArrowRight,
  Calendar,
  Pencil,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MODULES = [
  {
    id: 'discover',
    label: 'Discover',
    description: 'Audit digital footprint across 50+ sources',
    icon: Search,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    id: 'diagnose',
    label: 'Diagnose',
    description: 'LSI scoring & statistical gap analysis',
    icon: BarChart2,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'position',
    label: 'Position',
    description: 'Archetype assignment & content strategy',
    icon: Target,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    id: 'express',
    label: 'Express',
    description: 'AI-powered thought leadership content',
    icon: PenLine,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    id: 'validate',
    label: 'Validate',
    description: 'Measure & prove LSI improvement',
    icon: CheckSquare,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    id: 'shield',
    label: 'Shield',
    description: '24/7 crisis monitoring & competitor intel',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
];

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!client) notFound();

  const { data: latestLSI } = await supabase
    .from('lsi_runs')
    .select('total_score, run_date')
    .eq('client_id', id)
    .order('run_date', { ascending: false })
    .limit(1)
    .single();

  const { data: discoverRun } = await supabase
    .from('discover_runs')
    .select('status, run_date')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: positioning } = await supabase
    .from('positioning')
    .select('personal_archetype, followability_score')
    .eq('client_id', id)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
            {client.company && <span>{client.company}</span>}
            {client.industry && (
              <>
                <span>·</span>
                <span>{client.industry}</span>
              </>
            )}
            {client.role && (
              <>
                <span>·</span>
                <span>{client.role}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </Button>
          </Link>
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Current LSI</p>
            {latestLSI ? (
              <>
                <p className="text-3xl font-bold text-blue-600 mt-1">{latestLSI.total_score}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatDistanceToNow(new Date(latestLSI.run_date), { addSuffix: true })}
                </p>
              </>
            ) : (
              <p className="text-sm text-neutral-400 mt-2">Not scored yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Target LSI</p>
            <p className="text-3xl font-bold text-neutral-900 mt-1">{client.target_lsi || 75}</p>
            {client.baseline_lsi && (
              <p className="text-xs text-neutral-400 mt-1">Baseline: {client.baseline_lsi}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Archetype</p>
            {positioning ? (
              <>
                <p className="text-sm font-bold text-neutral-900 mt-1 truncate">
                  {positioning.personal_archetype}
                </p>
                {positioning.followability_score && (
                  <p className="text-xs text-neutral-400 mt-1">
                    {positioning.followability_score}% followability
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-400 mt-2">Not positioned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Reputation Engineering Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((module) => (
            <Link
              key={module.id}
              href={`/dashboard/clients/${id}/${module.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border border-neutral-200 hover:border-blue-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.bg}`}>
                      <module.icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    <CardTitle className="text-base">{module.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between">
                  <p className="text-sm text-neutral-500">{module.description}</p>
                  <ArrowRight className="h-4 w-4 text-neutral-400 shrink-0 ml-2" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Discovery status */}
      {discoverRun && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-center gap-3">
            <Search className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Last discovery scan: {discoverRun.status}
              </p>
              <p className="text-xs text-green-600">
                {formatDistanceToNow(new Date(discoverRun.run_date), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
