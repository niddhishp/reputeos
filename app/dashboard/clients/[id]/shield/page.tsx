// app/(dashboard)/clients/[id]/shield/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  Bell,
  Eye,
  MessageSquare,
  Flag,
  MoreHorizontal,
  Plus,
  Clock,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

type AlertSeverity = 'info' | 'warning' | 'critical';
type AlertType = 'crisis' | 'volume_spike' | 'sentiment_drop' | 'narrative_drift';

interface AlertItem {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
  triggerData?: any;
}

interface Competitor {
  id: string;
  name: string;
  company: string;
  currentLSI: number;
  lsiChange: number;
  contentVolume: number;
  archetype: string;
  lastActivity: string;
}

export default function ShieldPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    // Fetch real data from Supabase
    async function fetchData() {
      try {
        const [alertsRes, competitorsRes] = await Promise.all([
          supabase.from('alerts').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
          supabase.from('competitors').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }),
        ]);

        if (alertsRes.data) {
          setAlerts(alertsRes.data.map(a => ({
            id: a.id, type: a.type as AlertType, severity: a.severity as AlertSeverity,
            title: a.title, message: a.message ?? '', timestamp: a.created_at, status: a.status,
          })));
        }
        if (competitorsRes.data) {
          setCompetitors(competitorsRes.data.map(c => ({
            id: c.id, name: c.name, company: c.company ?? '',
            currentLSI: c.current_lsi ?? 0, lsiChange: 0, contentVolume: c.content_volume_per_month ?? 0,
            archetype: c.archetype ?? 'unknown', lastActivity: c.updated_at,
          })));
        }
      } catch (err) {
        console.error('shield fetch error', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Real-time subscription for new alerts
    const subscription = supabase
      .channel(`alerts-${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const newAlert = payload.new as Record<string, unknown>;
          setAlerts(prev => [{
            id: newAlert.id as string, type: newAlert.type as AlertType,
            severity: newAlert.severity as AlertSeverity, title: newAlert.title as string,
            message: (newAlert.message as string) ?? '', timestamp: newAlert.created_at as string,
            status: (newAlert.status as AlertItem['status']) ?? 'new',
          }, ...prev]);
          if (newAlert.severity === 'critical') {
            toast({ title: '🚨 Critical Alert', description: newAlert.title as string, variant: 'destructive' });
          }
        })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [clientId]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: 'acknowledged' as const } : a
    ));
    toast({ title: "Alert acknowledged" });
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, status: 'resolved' as const } : a
    ));
    toast({ title: "Alert resolved" });
  };

  const addCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Competitor added", description: "Tracking will begin within 24 hours." });
    setShowAddCompetitor(false);
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'crisis': return <Zap className="h-5 w-5" />;
      case 'volume_spike': return <TrendingUp className="h-5 w-5" />;
      case 'sentiment_drop': return <TrendingDown className="h-5 w-5" />;
      case 'narrative_drift': return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-error-50 border-error-200 text-error-800';
      case 'warning': return 'bg-warning-50 border-warning-200 text-warning-800';
      case 'info': return 'bg-info-50 border-info-200 text-info-800';
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-lg text-neutral-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            Shield
          </h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            Crisis monitoring & competitor intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-body-sm">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              monitoringActive ? "bg-success-500" : "bg-neutral-400"
            )} />
            <span className={monitoringActive ? "text-success-700" : "text-neutral-500"}>
              {monitoringActive ? 'Monitoring Active' : 'Monitoring Paused'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setMonitoringActive(!monitoringActive)}
          >
            {monitoringActive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <Alert className="bg-error-50 border-error-200">
          <AlertTriangle className="h-4 w-4 text-error-600" />
          <AlertTitle className="text-error-800">Critical Alert{criticalCount > 1 ? 's' : ''} Active</AlertTitle>
          <AlertDescription className="text-error-700">
            {criticalCount} critical issue{criticalCount > 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-neutral-500 uppercase tracking-wider">Active Alerts</p>
                <p className="text-heading-lg text-neutral-900 font-bold mt-1">{activeAlerts.length}</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <Bell className="h-5 w-5 text-warning-600" />
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-caption">{criticalCount} Critical</Badge>
              )}
              <Badge variant="secondary" className="text-caption">
                {activeAlerts.filter(a => a.severity === 'warning').length} Warning
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-neutral-500 uppercase tracking-wider">Mention Volume (24h)</p>
                <p className="text-heading-lg text-neutral-900 font-bold mt-1">1,247</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="warning" className="text-caption">+340%</Badge>
              <span className="text-caption text-neutral-500">vs baseline</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-neutral-500 uppercase tracking-wider">Sentiment Score</p>
                <p className="text-heading-lg text-neutral-900 font-bold mt-1">0.42</p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-caption text-neutral-500">Slightly Positive</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-neutral-500 uppercase tracking-wider">Days Since Crisis</p>
                <p className="text-heading-lg text-success-600 font-bold mt-1">47</p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <Shield className="h-5 w-5 text-success-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-caption text-neutral-500">All clear</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-heading-md">Active Alerts</CardTitle>
                <CardDescription>Real-time monitoring notifications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {}}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence>
                {alerts.filter(a => a.status !== 'resolved').map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      getSeverityColor(alert.severity)
                    )}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        alert.severity === 'critical' ? "bg-error-200 text-error-700" :
                        alert.severity === 'warning' ? "bg-warning-200 text-warning-700" :
                        "bg-info-200 text-info-700"
                      )}>
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-body font-semibold">{alert.title}</h4>
                          <span className="text-caption opacity-75">
                            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-body-sm mt-1 opacity-90">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-3">
                          {alert.status === 'new' ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={(e) => { e.stopPropagation(); acknowledgeAlert(alert.id); }}
                              >
                                Acknowledge
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); resolveAlert(alert.id); }}
                              >
                                Resolve
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-caption">Acknowledged</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {activeAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p className="text-body text-neutral-600">No active alerts. All clear!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Playbooks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-md">Crisis Response Playbooks</CardTitle>
              <CardDescription>Predefined response strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Product Crisis', description: 'Quality issues or recalls', icon: Zap },
                  { name: 'Leadership Transition', description: 'Executive changes', icon: Users },
                  { name: 'Data Breach', description: 'Security incidents', icon: Shield },
                  { name: 'Competitive Attack', description: 'Negative campaigns', icon: Target }
                ].map((playbook) => (
                  <div key={playbook.name} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-primary-300 cursor-pointer transition-colors">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <playbook.icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-body font-semibold text-neutral-900">{playbook.name}</h4>
                      <p className="text-caption text-neutral-500">{playbook.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competitor Tracking */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-heading-md">Competitor Intelligence</CardTitle>
                <CardDescription>Track rival reputation metrics</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddCompetitor(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitors.map((comp) => (
                <div key={comp.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-body font-semibold text-neutral-900">{comp.name}</h4>
                      <p className="text-caption text-neutral-500">{comp.company}</p>
                    </div>
                    <Badge variant="outline" className="text-caption capitalize">
                      {comp.archetype}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <p className="text-caption text-neutral-500">LSI Score</p>
                      <div className="flex items-center gap-2">
                        <span className="text-heading-sm font-bold text-neutral-900">{comp.currentLSI}</span>
                        <span className={cn(
                          "text-caption flex items-center",
                          comp.lsiChange > 0 ? "text-error-600" : "text-success-600"
                        )}>
                          {comp.lsiChange > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                          {comp.lsiChange > 0 ? '+' : ''}{comp.lsiChange}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-caption text-neutral-500">Content/Month</p>
                      <p className="text-heading-sm font-bold text-neutral-900">{comp.contentVolume}</p>
                    </div>
                  </div>
                  
                  <p className="text-caption text-neutral-400 mt-3">
                    Last active: {formatDistanceToNow(new Date(comp.lastActivity), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-primary-50 border-primary-100">
            <CardHeader>
              <CardTitle className="text-heading-sm text-primary-900">Shield Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-primary-700">Crisis Detection</span>
                <Badge className="bg-success-500 text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-primary-700">Sentiment Monitoring</span>
                <Badge className="bg-success-500 text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-primary-700">Competitor Tracking</span>
                <Badge className="bg-success-500 text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-primary-700">Narrative Drift</span>
                <Badge variant="outline" className="text-primary-700">Paused</Badge>
              </div>
              
              <Button variant="outline" className="w-full mt-4 border-primary-300 text-primary-700 hover:bg-primary-100">
                Configure Monitoring
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium mb-2",
              selectedAlert?.severity === 'critical' ? "bg-error-100 text-error-700" :
              selectedAlert?.severity === 'warning' ? "bg-warning-100 text-warning-700" :
              "bg-info-100 text-info-700"
            )}>
              {selectedAlert && getAlertIcon(selectedAlert.type)}
              <span className="uppercase">{selectedAlert?.severity}</span>
            </div>
            <DialogTitle className="text-heading-lg">{selectedAlert?.title}</DialogTitle>
            <DialogDescription className="text-body text-neutral-600">
              Detected {selectedAlert && formatDistanceToNow(new Date(selectedAlert.timestamp), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <p className="text-body text-neutral-900">{selectedAlert?.message}</p>
            </div>

            {selectedAlert?.triggerData && (
              <div>
                <Label className="text-label mb-2 block">Trigger Data</Label>
                <pre className="text-caption bg-neutral-900 text-neutral-100 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedAlert.triggerData, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => selectedAlert && resolveAlert(selectedAlert.id)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Resolved
              </Button>
              <Button variant="outline" className="flex-1">
                <Flag className="mr-2 h-4 w-4" />
                Escalate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Competitor Dialog */}
      <Dialog open={showAddCompetitor} onOpenChange={setShowAddCompetitor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-heading-lg">Track Competitor</DialogTitle>
            <DialogDescription>Add a new competitor to monitor their reputation metrics.</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={addCompetitor} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g., Rahul Sharma" required />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="e.g., TechVentures Inc" required />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
              <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/..." />
            </div>
            <Button type="submit" className="w-full">
              <Target className="mr-2 h-4 w-4" />
              Start Tracking
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}