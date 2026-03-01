// app/dashboard/clients/[id]/discover/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Search, RefreshCw, CheckCircle2, Circle, Loader2,
  Globe, Newspaper, MessageSquare, Briefcase, Mic, FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

type ScanStatus = 'not_started' | 'pending' | 'running' | 'completed' | 'failed';

interface DiscoverRun {
  id: string;
  status: ScanStatus;
  progress: number;
  total_mentions: number;
  sentiment_summary: { positive: number; neutral: number; negative: number; average?: number };
  frame_distribution: Record<string, number>;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

const SOURCE_CATEGORIES = [
  { name: 'Search Engines & AI',     sourceCount: 15, icon: Globe },
  { name: 'Media & News',            sourceCount: 10, icon: Newspaper },
  { name: 'Social Media',            sourceCount: 8,  icon: MessageSquare },
  { name: 'Professional Databases',  sourceCount: 7,  icon: Briefcase },
  { name: 'Conferences & Events',    sourceCount: 5,  icon: Mic },
  { name: 'Regulatory Filings',      sourceCount: 5,  icon: FileText },
];

export default function DiscoverPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { toast } = useToast();

  const [run, setRun] = useState<DiscoverRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch latest run on mount
  useEffect(() => {
    fetchLatestRun().finally(() => setLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [clientId]);

  // Poll while scan is in-progress
  useEffect(() => {
    if (run?.status === 'pending' || run?.status === 'running') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchLatestRun, 2000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [run?.status]);

  async function fetchLatestRun() {
    const { data } = await supabase
      .from('discover_runs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setRun(data as DiscoverRun);
    return data;
  }

  async function startScan() {
    setStarting(true);
    try {
      const res = await fetch('/api/discover/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to start scan');
      }

      await fetchLatestRun();
      toast({ title: 'Scan started', description: 'Scanning across 50+ sources…' });
    } catch (e) {
      toast({
        title: 'Failed to start scan',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
    }
  }

  const scanStatus: ScanStatus = run?.status ?? 'not_started';
  const isScanning = scanStatus === 'pending' || scanStatus === 'running';
  const progress = run?.progress ?? 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Discover</h1>
          <p className="text-sm text-neutral-500 mt-1">Digital footprint audit across 50+ sources</p>
        </div>
        {!isScanning && (
          <Button onClick={startScan} disabled={starting} variant={run ? 'outline' : 'default'}>
            {starting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {run ? 'Re-scan' : 'Run Discovery Scan'}
          </Button>
        )}
      </div>

      {/* Scanning state */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Scanning in progress…
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-neutral-500">{progress}% complete</p>
            <div className="space-y-2">
              {SOURCE_CATEGORIES.map((cat, i) => {
                const threshold = ((i + 1) / SOURCE_CATEGORIES.length) * 100;
                const prevThreshold = (i / SOURCE_CATEGORIES.length) * 100;
                const done = progress >= threshold;
                const active = !done && progress > prevThreshold;
                return (
                  <div key={cat.name} className="flex items-center gap-3 text-sm">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-neutral-300 shrink-0" />
                    )}
                    <span className={done ? 'text-neutral-900' : 'text-neutral-500'}>
                      {cat.name}
                    </span>
                    <span className="text-neutral-400 ml-auto">{cat.sourceCount} sources</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed state */}
      {scanStatus === 'failed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-center">
            <p className="text-sm font-medium text-red-700">Scan failed</p>
            <p className="text-xs text-red-500 mt-1">{run?.error_message ?? 'Unknown error'}</p>
            <Button onClick={startScan} variant="outline" className="mt-4" disabled={starting}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {scanStatus === 'completed' && run && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Mentions" value={run.total_mentions?.toLocaleString() ?? '0'} />
            <StatCard label="Positive" value={`${run.sentiment_summary?.positive ?? 0}%`} color="text-green-600" />
            <StatCard label="Neutral"   value={`${run.sentiment_summary?.neutral ?? 0}%`}   color="text-neutral-500" />
            <StatCard label="Negative"  value={`${run.sentiment_summary?.negative ?? 0}%`}  color="text-red-600" />
          </div>

          <Tabs defaultValue="frames">
            <TabsList>
              <TabsTrigger value="frames">Frame Distribution</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            </TabsList>

            <TabsContent value="frames">
              <Card>
                <CardHeader>
                  <CardTitle>How you are framed online</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(run.frame_distribution ?? {}).length === 0 ? (
                    <p className="text-sm text-neutral-500">No frame data available.</p>
                  ) : (
                    Object.entries(run.frame_distribution).map(([frame, count]) => {
                      const total = Object.values(run.frame_distribution).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={frame}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize text-neutral-700">{frame}</span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sentiment">
              <Card>
                <CardHeader><CardTitle>Sentiment Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(['positive', 'neutral', 'negative'] as const).map((label) => {
                    const val = run.sentiment_summary?.[label] ?? 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-neutral-700">{label}</span>
                          <span className="font-medium">{val}%</span>
                        </div>
                        <Progress value={val} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-neutral-400">
            Last scanned {formatDistanceToNow(new Date(run.completed_at ?? run.created_at), { addSuffix: true })}
          </p>
        </>
      )}

      {/* Not started */}
      {scanStatus === 'not_started' && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No scans run yet</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
              Run a discovery scan to audit this profile&apos;s digital footprint across 50+ sources.
            </p>
            <Button onClick={startScan} disabled={starting}>
              <Search className="h-4 w-4 mr-2" />
              Run Discovery Scan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color = 'text-neutral-900' }: {
  label: string; value: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
