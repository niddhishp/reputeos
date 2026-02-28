// app/dashboard/clients/[id]/discover/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Circle,
  Loader2,
  Globe,
  Newspaper,
  MessageSquare,
  Briefcase,
  Mic,
  FileText,
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

type ScanStatus = 'not_started' | 'scanning' | 'completed' | 'failed';

interface DiscoverRun {
  id: string;
  status: ScanStatus;
  total_mentions: number;
  sentiment_dist: { positive: number; neutral: number; negative: number };
  frame_dist: { family: number; expert: number; founder: number; crisis: number; other: number };
  top_keywords: string[];
  run_date: string;
}

const SOURCE_CATEGORIES = [
  { name: 'Search Engines & AI', sourceCount: 15, icon: Globe },
  { name: 'Media & News', sourceCount: 10, icon: Newspaper },
  { name: 'Social Media', sourceCount: 8, icon: MessageSquare },
  { name: 'Professional Databases', sourceCount: 7, icon: Briefcase },
  { name: 'Conferences & Events', sourceCount: 5, icon: Mic },
  { name: 'Regulatory Filings', sourceCount: 5, icon: FileText },
];

export default function DiscoverPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const { toast } = useToast();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('not_started');
  const [currentRun, setCurrentRun] = useState<DiscoverRun | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestRun();
  }, [clientId]);

  async function fetchLatestRun() {
    setLoading(true);
    const { data } = await supabase
      .from('discover_runs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentRun(data);
      setScanStatus(data.status);
    }
    setLoading(false);
  }

  async function startScan() {
    setScanStatus('scanning');
    setScanProgress(0);

    try {
      const res = await fetch('/api/discover/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) throw new Error('Scan failed to start');

      // Simulate progress while real scan runs
      const interval = setInterval(() => {
        setScanProgress((p) => {
          if (p >= 90) {
            clearInterval(interval);
            return 90;
          }
          return p + 10;
        });
      }, 1000);

      const data = await res.json();
      clearInterval(interval);
      setScanProgress(100);

      await fetchLatestRun();
      toast({ title: 'Discovery scan complete', description: `Found ${data.totalMentions ?? 0} mentions.` });
    } catch {
      setScanStatus('failed');
      toast({ title: 'Scan failed', description: 'Please try again.', variant: 'destructive' });
    }
  }

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
          <p className="text-sm text-neutral-500 mt-1">
            Digital footprint audit across 50+ sources
          </p>
        </div>
        {scanStatus !== 'scanning' && (
          <Button onClick={startScan} variant={currentRun ? 'outline' : 'default'}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {currentRun ? 'Re-scan' : 'Run Discovery Scan'}
          </Button>
        )}
      </div>

      {/* Scanning State */}
      {scanStatus === 'scanning' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Scanning in progress…
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={scanProgress} className="h-2" />
            <div className="space-y-2">
              {SOURCE_CATEGORIES.map((cat, i) => {
                const done = scanProgress > (i + 1) * (100 / SOURCE_CATEGORIES.length);
                const active = !done && scanProgress > i * (100 / SOURCE_CATEGORIES.length);
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

      {/* Results */}
      {scanStatus === 'completed' && currentRun && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Mentions</p>
                <p className="text-3xl font-bold text-neutral-900 mt-1">
                  {currentRun.total_mentions?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Positive</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {currentRun.sentiment_dist?.positive ?? 0}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Neutral</p>
                <p className="text-3xl font-bold text-neutral-500 mt-1">
                  {currentRun.sentiment_dist?.neutral ?? 0}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Negative</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {currentRun.sentiment_dist?.negative ?? 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="frames">
            <TabsList>
              <TabsTrigger value="frames">Frame Distribution</TabsTrigger>
              <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
            </TabsList>

            <TabsContent value="frames">
              <Card>
                <CardHeader>
                  <CardTitle>How you are framed online</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(currentRun.frame_dist ?? {}).map(([frame, pct]) => (
                    <div key={frame}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-neutral-700">{frame}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                      <Progress value={pct as number} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords">
              <Card>
                <CardHeader>
                  <CardTitle>Top Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(currentRun.top_keywords ?? []).map((kw) => (
                      <Badge key={kw} variant="secondary">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-neutral-400">
            Last scanned {formatDistanceToNow(new Date(currentRun.run_date), { addSuffix: true })}
          </p>
        </>
      )}

      {/* Not started state */}
      {scanStatus === 'not_started' && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Search className="h-12 w-12 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No scans run yet
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
              Run a discovery scan to audit this client&apos;s digital footprint across 50+ sources including search engines, media, and social platforms.
            </p>
            <Button onClick={startScan}>
              <Search className="h-4 w-4 mr-2" />
              Run Discovery Scan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
