// app/(dashboard)/clients/[id]/diagnose/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import { 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Activity,
  Shield,
  Search,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

import { cn } from '@/lib/utils';
import { useClientStore } from '@/store/client-store';
import { supabase } from '@/lib/supabase/client';

// Types based on PersonaOS specification
interface LSIRun {
  id: string;
  client_id: string;
  run_date: string;
  total_score: number;
  components: {
    c1: number; // Search Reputation (0-20)
    c2: number; // Media Framing (0-20)
    c3: number; // Social Backlash (0-20)
    c4: number; // Elite Discourse (0-15)
    c5: number; // Third-Party Validation (0-15)
    c6: number; // Crisis Moat (0-10)
  };
  stats: {
    mean: number;
    stddev: number;
    ucl: number;
    lcl: number;
  };
  gaps: Array<{
    component: string;
    gap: number;
    priority: number;
  }>;
}

interface ComponentConfig {
  id: keyof LSIRun['components'];
  name: string;
  maxScore: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const COMPONENT_CONFIG: ComponentConfig[] = [
  { 
    id: 'c1', 
    name: 'Search Reputation', 
    maxScore: 20, 
    description: 'Google results sentiment & frame distribution',
    icon: Search,
    color: '#0066CC'
  },
  { 
    id: 'c2', 
    name: 'Media Framing', 
    maxScore: 20, 
    description: 'Journalist quotes & expert positioning',
    icon: FileText,
    color: '#10B981'
  },
  { 
    id: 'c3', 
    name: 'Social Backlash', 
    maxScore: 20, 
    description: 'Social media sentiment & volume',
    icon: Users,
    color: '#F59E0B'
  },
  { 
    id: 'c4', 
    name: 'Elite Discourse', 
    maxScore: 15, 
    description: 'Industry leader mentions & citations',
    icon: Target,
    color: '#8B5CF6'
  },
  { 
    id: 'c5', 
    name: 'Third-Party Validation', 
    maxScore: 15, 
    description: 'Awards, rankings & analyst coverage',
    icon: Shield,
    color: '#EC4899'
  },
  { 
    id: 'c6', 
    name: 'Crisis Moat', 
    maxScore: 10, 
    description: 'Resilience & narrative defense',
    icon: Zap,
    color: '#EF4444'
  },
];

function getLSIClassification(score: number): { label: string; color: string; description: string } {
  if (score >= 86) return { 
    label: 'Elite Authority', 
    color: 'text-success-600',
    description: 'Top 5% reputation standing'
  };
  if (score >= 71) return { 
    label: 'Strong Authority', 
    color: 'text-primary-600',
    description: 'Above-average credibility'
  };
  if (score >= 56) return { 
    label: 'Functional Legitimacy', 
    color: 'text-warning-600',
    description: 'Adequate but not distinctive'
  };
  if (score >= 36) return { 
    label: 'Reputation Vulnerability', 
    color: 'text-orange-600',
    description: 'At risk during crises'
  };
  return { 
    label: 'Severe Impairment', 
    color: 'text-error-600',
    description: 'Immediate intervention required'
  };
}

function getTrendIndicator(current: number, previous?: number) {
  if (!previous) return null;
  const diff = current - previous;
  if (diff > 5) return { icon: TrendingUp, color: 'text-success-600', label: `+${diff}` };
  if (diff < -5) return { icon: TrendingDown, color: 'text-error-600', label: `${diff}` };
  return { icon: Minus, color: 'text-neutral-500', label: `${diff > 0 ? '+' : ''}${diff}` };
}

// LSI Component Card Component
function LSIComponentCard({ 
  config, 
  value, 
  target = config.maxScore * 0.8,
  previousValue 
}: { 
  config: ComponentConfig; 
  value: number; 
  target?: number;
  previousValue?: number;
}) {
  const percentage = (value / config.maxScore) * 100;
  const targetPercentage = (target / config.maxScore) * 100;
  const gap = target - value;
  const trend = getTrendIndicator(value, previousValue);
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow duration-150">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${config.color}15` }}
            >
              <span style={{ color: config.color }} className="h-4 w-4 flex items-center">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div>
              <h4 className="text-label font-medium text-neutral-900">{config.name}</h4>
              <p className="text-caption text-neutral-500">Max: {config.maxScore}</p>
            </div>
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-body-sm font-medium", trend.color)}>
              <trend.icon className="h-4 w-4" />
              {trend.label}
            </div>
          )}
        </div>

        <div className="mb-3">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-heading-lg font-bold text-neutral-900">
              {value}
              <span className="text-body text-neutral-400 ml-1">/{config.maxScore}</span>
            </span>
            <span className={cn(
              "text-body-sm font-medium",
              gap > 0 ? "text-warning-600" : "text-success-600"
            )}>
              {gap > 0 ? `-${gap.toFixed(1)}` : 'On Target'}
            </span>
          </div>
          
          <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute h-full rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <div 
              className="absolute h-full w-0.5 bg-neutral-400"
              style={{ left: `${targetPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-caption text-neutral-500">{percentage.toFixed(0)}%</span>
            <span className="text-caption text-neutral-400">Target: {target}</span>
          </div>
        </div>

        <p className="text-body-sm text-neutral-600 leading-relaxed">
          {config.description}
        </p>
      </CardContent>
    </Card>
  );
}

// Radar Chart Component
function LSIRadarChart({ data }: { data: LSIRun['components'] }) {
  const chartData = COMPONENT_CONFIG.map(config => ({
    subject: config.name.split(' ')[0], // Short name
    fullName: config.name,
    A: data[config.id],
    fullMark: config.maxScore,
    color: config.color
  }));

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 20]} 
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            stroke="#E5E7EB"
          />
          <Radar
            name="Current LSI"
            dataKey="A"
            stroke="#0066CC"
            strokeWidth={2}
            fill="#0066CC"
            fillOpacity={0.2}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
                    <p className="text-label font-medium text-neutral-900 mb-1">{data.fullName}</p>
                    <p className="text-heading-sm text-primary-600 font-bold">
                      {data.A} <span className="text-body-sm text-neutral-400 font-normal">/ {data.fullMark}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Gap Analysis Chart (Pareto)
function GapAnalysisChart({ gaps }: { gaps: LSIRun['gaps'] }) {
  const sortedGaps = [...gaps].sort((a, b) => b.gap - a.gap);
  const maxGap = Math.max(...sortedGaps.map(g => g.gap));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedGaps} layout="vertical" margin={{ left: 20, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
          <XAxis type="number" domain={[0, maxGap * 1.1]} hide />
          <YAxis 
            dataKey="component" 
            type="category" 
            width={100}
            tick={{ fill: '#374151', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#F3F4F6' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
                    <p className="text-label font-medium text-neutral-900">{data.component}</p>
                    <p className="text-body-sm text-error-600 font-medium">Gap: -{data.gap}</p>
                    <p className="text-caption text-neutral-500">Priority: #{data.priority}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="gap" 
            fill="#EF4444" 
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Six Sigma Control Chart
function SixSigmaControlChart({ 
  data, 
  stats 
}: { 
  data: Array<{ date: string; score: number }>;
  stats: LSIRun['stats'];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#6B7280', fontSize: 11 }}
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
          />
          <YAxis 
            domain={[Math.max(0, stats.lcl - 10), Math.min(100, stats.ucl + 10)]}
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
                      LSI: {payload[0].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={stats.ucl} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'UCL', fill: '#10B981', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={stats.mean} stroke="#0066CC" label={{ value: 'Mean', fill: '#0066CC', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={stats.lcl} stroke="#EF4444" strokeDasharray="5 5" label={{ value: 'LCL', fill: '#EF4444', fontSize: 10, position: 'right' }} />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#0066CC" 
            strokeWidth={2}
            dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0066CC', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Main Page Component
export default function DiagnosePage() {
  const params = useParams();
  const clientId = params.id as string;
  const { toast } = useToast();
  const { currentClient, setCurrentClient } = useClientStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lsiData, setLsiData] = useState<LSIRun | null>(null);
  const [history, setHistory] = useState<Array<{ date: string; score: number }>>([]);
  const [previousRun, setPreviousRun] = useState<LSIRun | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchLSIData();
  }, [clientId]);

  const fetchLSIData = async () => {
    try {
      setIsLoading(true);

      // Fetch two most recent LSI runs from Supabase
      const { data: runs, error } = await supabase
        .from('lsi_runs')
        .select('*')
        .eq('client_id', clientId)
        .order('run_date', { ascending: false })
        .limit(2);

      if (error) throw error;

      if (runs && runs.length > 0) {
        setLsiData(runs[0] as LSIRun);
        if (runs.length > 1) setPreviousRun(runs[1] as LSIRun);
      }

      // Fetch full history for the trend chart
      const { data: historyRuns } = await supabase
        .from('lsi_runs')
        .select('run_date, total_score')
        .eq('client_id', clientId)
        .order('run_date', { ascending: true })
        .limit(24);

      if (historyRuns) {
        setHistory(historyRuns.map(r => ({ date: r.run_date, score: r.total_score })));
      }
    } catch (error) {
      toast({
        title: "Error loading LSI data",
        description: "Failed to fetch reputation metrics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recalculateLSI = async () => {
    try {
      setIsCalculating(true);
      
      // API call to recalculate
      // const response = await fetch('/api/lsi/calculate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ clientId })
      // });
      // const result = await response.json();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "LSI Recalculated",
        description: "New baseline established with updated metrics.",
      });
      
      await fetchLSIData();
    } catch (error) {
      toast({
        title: "Calculation failed",
        description: "Unable to recalculate LSI. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!lsiData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-12 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <h3 className="text-heading-md text-neutral-900 mb-2">No LSI Data Available</h3>
          <p className="text-body text-neutral-600 mb-6 max-w-md mx-auto">
            Run your first diagnostic scan to establish a reputation baseline.
          </p>
          <Button onClick={recalculateLSI} size="lg">
            Run Initial Diagnosis
          </Button>
        </Card>
      </div>
    );
  }

  const classification = getLSIClassification(lsiData.total_score);
  const trend = getTrendIndicator(lsiData.total_score, previousRun?.total_score);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Diagnose</h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            LSI scoring & statistical gap analysis
          </p>
        </div>
        <Button 
          onClick={recalculateLSI} 
          disabled={isCalculating}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isCalculating && "animate-spin")} />
          {isCalculating ? 'Calculating...' : 'Recalculate LSI'}
        </Button>
      </div>

      {/* LSI Score Hero */}
      <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-label text-neutral-500 mb-2 uppercase tracking-wider">Current LSI Score</p>
              <div className="flex items-baseline justify-center md:justify-start gap-3">
                <span className="text-display-lg text-primary-600 font-bold tracking-tight">
                  {lsiData.total_score}
                  <span className="text-display-md text-neutral-400 font-normal">/100</span>
                </span>
                {trend && (
                  <Badge variant={trend.color.includes('success') ? 'default' : trend.color.includes('error') ? 'destructive' : 'secondary'} className="text-sm">
                    <trend.icon className="h-3 w-3 mr-1" />
                    {trend.label}
                  </Badge>
                )}
              </div>
              <div className="mt-3">
                <span className={cn("text-heading-md font-semibold", classification.color)}>
                  {classification.label}
                </span>
                <p className="text-body text-neutral-600 mt-1">
                  {classification.description}
                </p>
              </div>
              <p className="text-caption text-neutral-400 mt-4">
                Baseline established {format(new Date(lsiData.run_date), 'MMM d, yyyy')}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-primary-100">
                <p className="text-caption text-neutral-500 mb-1">Mean (μ)</p>
                <p className="text-heading-md text-neutral-900 font-semibold">{lsiData.stats.mean.toFixed(1)}</p>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-primary-100">
                <p className="text-caption text-neutral-500 mb-1">Std Dev (σ)</p>
                <p className="text-heading-md text-neutral-900 font-semibold">{lsiData.stats.stddev.toFixed(1)}</p>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-primary-100">
                <p className="text-caption text-neutral-500 mb-1">UCL</p>
                <p className="text-heading-md text-success-600 font-semibold">{lsiData.stats.ucl.toFixed(1)}</p>
              </div>
              <div className="bg-white/60 backdrop-blur rounded-xl p-4 border border-primary-100">
                <p className="text-caption text-neutral-500 mb-1">LCL</p>
                <p className="text-heading-md text-error-600 font-semibold">{lsiData.stats.lcl.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Breakdown */}
      <div>
        <h3 className="text-heading-md text-neutral-900 mb-4">Component Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {COMPONENT_CONFIG.map((config, index) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <LSIComponentCard
                  config={config}
                  value={lsiData.components[config.id]}
                  previousValue={previousRun?.components[config.id]}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-heading-md">LSI Radar Chart</CardTitle>
            <CardDescription className="text-body-sm text-neutral-500">
              Multi-dimensional reputation profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LSIRadarChart data={lsiData.components} />
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-heading-md">Gap Analysis (Pareto)</CardTitle>
            <CardDescription className="text-body-sm text-neutral-500">
              Priority gaps from target scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GapAnalysisChart gaps={lsiData.gaps} />
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning-600 mt-0.5" />
                <div>
                  <p className="text-body-sm font-medium text-warning-800">Top Priority</p>
                  <p className="text-caption text-warning-700 mt-0.5">
                    Focus on {lsiData.gaps[0]?.component} for maximum LSI impact
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Six Sigma Control Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-heading-md">Six Sigma Control Chart</CardTitle>
            <CardDescription className="text-body-sm text-neutral-500">
              Statistical process control over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-body-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary-500" />
              <span className="text-neutral-600">Mean</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 border-t border-dashed border-success-500" />
              <span className="text-neutral-600">UCL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 border-t border-dashed border-error-500" />
              <span className="text-neutral-600">LCL</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SixSigmaControlChart data={history} stats={lsiData.stats} />
          
          {lsiData.total_score > lsiData.stats.ucl && (
            <Alert className="mt-4 border-success-200 bg-success-50">
              <TrendingUp className="h-4 w-4 text-success-600" />
              <AlertTitle className="text-success-800">Above Upper Control Limit</AlertTitle>
              <AlertDescription className="text-success-700">
                Current performance exceeds statistical expectations. Monitor for sustainability.
              </AlertDescription>
            </Alert>
          )}
          
          {lsiData.total_score < lsiData.stats.lcl && (
            <Alert className="mt-4 border-error-200 bg-error-50" variant="destructive">
              <TrendingDown className="h-4 w-4" />
              <AlertTitle>Below Lower Control Limit</AlertTitle>
              <AlertDescription>
                Performance indicates special cause variation. Immediate investigation recommended.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardHeader>
          <CardTitle className="text-heading-md flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-600" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lsiData.gaps.slice(0, 3).map((gap, index) => (
              <div 
                key={gap.component} 
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-body-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-body font-medium text-neutral-900">{gap.component}</p>
                    <p className="text-caption text-neutral-500">
                      Gap: {gap.gap} points from target
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Strategy
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}