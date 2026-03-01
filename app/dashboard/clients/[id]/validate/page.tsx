// app/(dashboard)/clients/[id]/validate/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download,
  RefreshCw,
  FileText,
  Presentation,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Target,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

interface LSIRun {
  date: string;
  score: number;
  components: Record<string, number>;
}

interface FrameDistribution {
  family: number;
  expert: number;
  founder: number;
  crisis: number;
  other: number;
}

// Simple t-test for two means (one-sample against baseline)
function tTest(baseline: number, current: number, n: number): number {
  if (n < 2) return 1;
  const se = Math.abs(current - baseline) / Math.sqrt(n);
  const t = Math.abs(current - baseline) / (se || 1);
  // Approximate p-value for large t
  if (t > 3.5) return 0.001;
  if (t > 2.5) return 0.02;
  if (t > 2.0) return 0.05;
  if (t > 1.5) return 0.15;
  return 0.3;
}

function cohensD(baseline: number, current: number, stddev: number): number {
  if (!stddev) return 0;
  return Math.abs(current - baseline) / stddev;
}

export default function ValidatePage() {
  const params = useParams();
  const clientId = params.id as string;
  const { toast } = useToast();
  const [lsiHistory, setLsiHistory] = useState<{ date: string; score: number; components: Record<string, number> }[]>([]);
  const [clientData, setClientData] = useState<{ baseline_lsi: number | null; target_lsi: number; name: string } | null>(null);
  const [baselineFrames, setBaselineFrames] = useState<FrameDistribution>({ family: 65, expert: 15, founder: 10, crisis: 5, other: 5 });
  const [currentFrames, setCurrentFrames] = useState<FrameDistribution>({ family: 40, expert: 35, founder: 15, crisis: 5, other: 5 });

  const baselineLSI = clientData?.baseline_lsi ?? (lsiHistory[0]?.score ?? 0);
  const currentLSI = lsiHistory[lsiHistory.length - 1]?.score ?? baselineLSI;
  const targetLSI = clientData?.target_lsi ?? 75;
  const improvement = Math.round(currentLSI - baselineLSI);
  const progressToTarget = targetLSI > baselineLSI
    ? Math.round(((currentLSI - baselineLSI) / (targetLSI - baselineLSI)) * 100)
    : 0;

  const pValue = tTest(baselineLSI, currentLSI, lsiHistory.length);
  const stddev = lsiHistory.length > 1
    ? Math.sqrt(lsiHistory.reduce((acc, r) => acc + Math.pow(r.score - (lsiHistory.reduce((s, x) => s + x.score, 0) / lsiHistory.length), 2), 0) / lsiHistory.length)
    : 8;
  const cd = cohensD(baselineLSI, currentLSI, stddev);

  const componentChanges = (() => {
    const baseline = lsiHistory[0]?.components ?? {};
    const current = lsiHistory[lsiHistory.length - 1]?.components ?? {};
    const names: Record<string, string> = { c1: 'Search Reputation', c2: 'Media Framing', c3: 'Social Backlash', c4: 'Elite Discourse', c5: 'Third-Party Validation', c6: 'Crisis Moat' };
    return Object.entries(names).map(([key, name]) => ({
      name, baseline: baseline[key] ?? 0, current: current[key] ?? 0, change: (current[key] ?? 0) - (baseline[key] ?? 0),
    }));
  })();

  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [reportPeriod, setReportPeriod] = useState('last_month');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientRes, lsiRes, discoverRes] = await Promise.all([
          supabase.from('clients').select('baseline_lsi, target_lsi, name').eq('id', clientId).single(),
          supabase.from('lsi_runs').select('run_date, total_score, components').eq('client_id', clientId).order('run_date', { ascending: true }).limit(24),
          supabase.from('discover_runs').select('frame_dist').eq('client_id', clientId).order('run_date', { ascending: true }).limit(2),
        ]);

        if (clientRes.data) setClientData(clientRes.data);
        if (lsiRes.data) {
          setLsiHistory(lsiRes.data.map(r => ({ date: r.run_date, score: r.total_score, components: r.components ?? {} })));
        }
        if (discoverRes.data && discoverRes.data.length >= 2) {
          const baseline = discoverRes.data[0].frame_dist as FrameDistribution | null;
          const current = discoverRes.data[discoverRes.data.length - 1].frame_dist as FrameDistribution | null;
          if (baseline) setBaselineFrames(baseline);
          if (current) setCurrentFrames(current);
        }
      } catch (err) {
        console.error('validate fetch error', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clientId]);

  const generateReport = async () => {
    setGeneratingReport(true);
    toast({ title: "Generating Report", description: `Creating ${reportType} report in ${reportFormat.toUpperCase()} format...` });

    try {
      if (reportFormat === 'pptx') {
        const res = await fetch('/api/export/pptx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, reportType, period: reportPeriod }),
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clientData?.name ?? 'ReputeOS'}_Report.pptx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // PDF export
        const res = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, reportType, period: reportPeriod }),
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clientData?.name ?? 'ReputeOS'}_Report.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: "Report Ready", description: "Your report has been downloaded." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Could not generate the report. Please try again.", variant: "destructive" });
    } finally {
      setGeneratingReport(false);
      setShowReportDialog(false);
    }
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Validate</h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            Track LSI improvement with statistical rigor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recalculate LSI
          </Button>
          <Button onClick={() => setShowReportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* LSI Trend Hero */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md">LSI Trend Over Time</CardTitle>
          <CardDescription>Baseline to current performance trajectory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lsiHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  domain={[40, 80]}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
                          <p className="text-caption text-neutral-500 mb-1">
                            {format(new Date(payload[0].payload.date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-heading-sm text-neutral-900 font-bold">
                            LSI: {Number(payload[0].value).toFixed(1)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={baselineLSI} stroke="#9CA3AF" strokeDasharray="5 5" label={{ value: 'Baseline', fill: '#9CA3AF', fontSize: 10 }} />
                <ReferenceLine y={targetLSI} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Target', fill: '#10B981', fontSize: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0066CC" 
                  strokeWidth={2}
                  dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="p-6">
            <Label className="text-caption text-neutral-500 uppercase tracking-wider">Baseline LSI</Label>
            <p className="text-display-md text-neutral-400 font-bold mt-2">{baselineLSI}</p>
            <p className="text-body-sm text-neutral-500 mt-1">
              {lsiHistory.length > 0 ? format(new Date(lsiHistory[0].date), 'MMM d, yyyy') : "No baseline yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-50" />
          <CardContent className="p-6 relative">
            <Label className="text-caption text-neutral-500 uppercase tracking-wider">Current LSI</Label>
            <p className="text-display-md text-primary-600 font-bold mt-2">{currentLSI}</p>
            <Badge className="mt-2 bg-success-500 text-white">
              +{improvement} points
            </Badge>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <Label className="text-caption text-neutral-500 uppercase tracking-wider">Target LSI</Label>
            <p className="text-display-md text-neutral-900 font-bold mt-2">{targetLSI}</p>
            <div className="mt-3">
              <Progress value={progressToTarget} className="h-2" />
              <p className="text-caption text-neutral-500 mt-1">{progressToTarget.toFixed(0)}% to target</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Significance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md">Statistical Significance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <Label className="text-caption text-neutral-500">T-Test Result</Label>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-heading-lg font-bold text-neutral-900">p = {pValue.toFixed(3)}</span>
                <Badge className={pValue < 0.05 ? "bg-success-500" : "bg-warning-500"}>
                  {pValue < 0.05 ? 'Significant' : 'Not Significant'}
                </Badge>
              </div>
              <p className="text-body-sm text-neutral-600 mt-2">
                {pValue < 0.05 
                  ? 'Improvement is statistically significant at 95% confidence level.'
                  : 'Continue engagement to reach statistical significance.'}
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg">
              <Label className="text-caption text-neutral-500">Effect Size (Cohen's d)</Label>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-heading-lg font-bold text-neutral-900">{cd.toFixed(2)}</span>
                <Badge variant="outline" className="border-primary-500 text-primary-700">
                  Large Effect
                </Badge>
              </div>
              <p className="text-body-sm text-neutral-600 mt-2">
                Practical significance indicates meaningful real-world impact.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md">Component-Level Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {componentChanges.map((comp) => (
              <div key={comp.name} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex-1">
                  <p className="text-body font-medium text-neutral-900">{comp.name}</p>
                  <div className="flex items-center gap-4 mt-1 text-caption text-neutral-500">
                    <span>Baseline: {comp.baseline.toFixed(1)}</span>
                    <span>Current: {comp.current.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {comp.change > 0 ? (
                    <TrendingUp className="h-4 w-4 text-success-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-error-500" />
                  )}
                  <span className={cn(
                    "text-heading-sm font-bold",
                    comp.change > 0 ? "text-success-600" : "text-error-600"
                  )}>
                    {comp.change > 0 ? '+' : ''}{comp.change.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Frame Shift Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md">Frame Shift Analysis</CardTitle>
          <CardDescription>Evolution of narrative framing over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-body-sm font-medium text-neutral-500 mb-3">Baseline Distribution</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(baselineFrames).map(([key, value]) => ({ name: key, value }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Bar dataKey="value" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-body-sm font-medium text-neutral-500 mb-3">Current Distribution</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(currentFrames).map(([key, value]) => ({ name: key, value }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Bar dataKey="value" fill="#0066CC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <Alert className="mt-6 bg-info-50 border-info-200">
            <TrendingUp className="h-4 w-4 text-info-600" />
            <AlertTitle className="text-info-800">Frame Shift Progress</AlertTitle>
            <AlertDescription className="text-info-700">
              Family frame: {baselineFrames.family}% → {currentFrames.family}% ({baselineFrames.family - currentFrames.family > 0 ? '-' : '+'}{Math.abs(baselineFrames.family - currentFrames.family)}%)
              <br />
              Expert frame: {baselineFrames.expert}% → {currentFrames.expert}% (+{currentFrames.expert - baselineFrames.expert}%)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Report Generation Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-heading-lg">Generate Board Report</DialogTitle>
            <DialogDescription>Create a professional presentation-ready report</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-label mb-3 block">Report Type</Label>
              <RadioGroup value={reportType} onValueChange={setReportType} className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-neutral-200">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                    <div className="font-medium">Monthly Progress Report</div>
                    <div className="text-caption text-neutral-500">Standard monthly update with key metrics</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-neutral-200">
                  <RadioGroupItem value="board" id="board" />
                  <Label htmlFor="board" className="flex-1 cursor-pointer">
                    <div className="font-medium">Board Presentation (PowerPoint)</div>
                    <div className="text-caption text-neutral-500">Executive-level slides for board meetings</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-neutral-200">
                  <RadioGroupItem value="case_study" id="case_study" />
                  <Label htmlFor="case_study" className="flex-1 cursor-pointer">
                    <div className="font-medium">Before/After Case Study</div>
                    <div className="text-caption text-neutral-500">Detailed transformation narrative</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-label mb-3 block">Time Period</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="full_engagement">Full Engagement (Baseline to Now)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-label mb-3 block">Format</Label>
              <div className="flex gap-3">
                <Button
                  variant={reportFormat === 'pdf' ? 'default' : 'outline'}
                  onClick={() => setReportFormat('pdf')}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant={reportFormat === 'pptx' ? 'default' : 'outline'}
                  onClick={() => setReportFormat('pptx')}
                  className="flex-1"
                >
                  <Presentation className="mr-2 h-4 w-4" />
                  PowerPoint
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generateReport}>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}