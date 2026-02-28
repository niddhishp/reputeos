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
import { format, subDays } from 'date-fns';
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

export default function ValidatePage() {
  const params = useParams();
  const clientId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState('monthly');
  const [reportPeriod, setReportPeriod] = useState('last_month');
  const [reportFormat, setReportFormat] = useState('pdf');

  // Mock data
  const baselineLSI = 52;
  const currentLSI = 68;
  const targetLSI = 75;
  const improvement = currentLSI - baselineLSI;
  const progressToTarget = ((currentLSI - baselineLSI) / (targetLSI - baselineLSI)) * 100;

  const history: LSIRun[] = Array.from({ length: 12 }, (_, i) => ({
    date: subDays(new Date(), i * 7).toISOString(),
    score: baselineLSI + (improvement * (i / 11)) + (Math.random() * 4 - 2),
    components: {
      c1: 12 + Math.random() * 4,
      c2: 10 + Math.random() * 4,
      c3: 14 + Math.random() * 3,
      c4: 8 + Math.random() * 3,
      c5: 9 + Math.random() * 3,
      c6: 5 + Math.random() * 2
    }
  })).reverse();

  const baselineFrames: FrameDistribution = { family: 65, expert: 15, founder: 10, crisis: 5, other: 5 };
  const currentFrames: FrameDistribution = { family: 25, expert: 45, founder: 20, crisis: 5, other: 5 };

  const componentChanges = [
    { name: 'Search Reputation', baseline: 12.5, current: 14.5, change: +2.0 },
    { name: 'Media Framing', baseline: 8.2, current: 12.3, change: +4.1 },
    { name: 'Social Backlash', baseline: 13.1, current: 15.8, change: +2.7 },
    { name: 'Elite Discourse', baseline: 6.4, current: 9.2, change: +2.8 },
    { name: 'Third-Party Validation', baseline: 7.8, current: 10.1, change: +2.3 },
    { name: 'Crisis Moat', baseline: 4.0, current: 6.1, change: +2.1 }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const generateReport = async () => {
    toast({
      title: "Generating Report",
      description: `Creating ${reportType} report in ${reportFormat.toUpperCase()} format...`
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Report Ready",
      description: "Your report has been generated and downloaded."
    });
    
    setShowReportDialog(false);
  };

  const pValue = 0.023; // Mock statistical significance
  const cohensD = 1.2; // Mock effect size

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
              <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              {format(new Date(history[0].date), 'MMM d, yyyy')}
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
                <span className="text-heading-lg font-bold text-neutral-900">{cohensD.toFixed(2)}</span>
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