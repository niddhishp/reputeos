// app/(dashboard)/clients/[id]/express/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Twitter, 
  Linkedin, 
  BookOpen, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  BarChart3,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

import { cn } from '@/lib/utils';
import { usePositioningStore } from '@/store/positioning-store';

type ContentPlatform = 'linkedin' | 'twitter' | 'medium' | 'op_ed' | 'whitepaper';
type ContentStatus = 'draft' | 'published' | 'scheduled';

interface ContentItem {
  id: string;
  title: string;
  excerpt: string;
  platform: ContentPlatform;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  nlpCompliance: {
    passed: boolean;
    archetypeAlignment: number;
    frameCheck: boolean;
    authorityMarkers: number;
  };
  performancePrediction?: {
    engagementRate: number;
    impressions: number;
  };
}

const PLATFORM_CONFIG: Record<ContentPlatform, { name: string; icon: React.ComponentType<{ className?: string }>; color: string; maxLength?: number }> = {
  linkedin: { name: 'LinkedIn Article', icon: Linkedin, color: '#0077B5', maxLength: 3000 },
  twitter: { name: 'X/Twitter Thread', icon: Twitter, color: '#000000', maxLength: 280 },
  medium: { name: 'Medium Story', icon: BookOpen, color: '#00AB6C', maxLength: 10000 },
  op_ed: { name: 'Op-Ed', icon: FileText, color: '#0066CC', maxLength: 800 },
  whitepaper: { name: 'Whitepaper', icon: FileText, color: '#6B7280', maxLength: 50000 },
};

function PlatformIcon({ platform, className }: { platform: ContentPlatform; className?: string }) {
  const Icon = PLATFORM_CONFIG[platform].icon;
  return <Icon className={className} />;
}

function ContentCard({ content }: { content: ContentItem }) {
  const config = PLATFORM_CONFIG[content.platform];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="hover:shadow-md transition-all duration-150 cursor-pointer border-neutral-200 hover:border-primary-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg")} style={{ backgroundColor: `${config.color}15` }}>
                <span style={{ color: config.color }} className="flex items-center"><Icon className="h-4 w-4" /></span>
              </div>
              <Badge variant={content.status === 'published' ? 'default' : content.status === 'scheduled' ? 'secondary' : 'outline'}>
                {content.status}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-error-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-heading-sm mt-2 line-clamp-2">{content.title}</CardTitle>
          <CardDescription className="line-clamp-2">{content.excerpt}</CardDescription>
        </CardHeader>
        
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-caption text-neutral-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(content.updatedAt), 'MMM d')}
            </div>
            {content.nlpCompliance && (
              <div className="flex items-center gap-1">
                {content.nlpCompliance.passed ? (
                  <CheckCircle2 className="h-3 w-3 text-success-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-warning-500" />
                )}
                {content.nlpCompliance.archetypeAlignment}% aligned
              </div>
            )}
          </div>
        </CardContent>

        {content.performancePrediction && (
          <CardFooter className="pt-0 border-t border-neutral-100 mt-3">
            <div className="flex items-center gap-4 w-full text-caption">
              <div className="flex items-center gap-1 text-neutral-600">
                <BarChart3 className="h-3 w-3" />
                {content.performancePrediction.engagementRate}% engagement
              </div>
              <div className="text-neutral-400">
                {content.performancePrediction.impressions.toLocaleString()} impressions
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}

// Decision Gate Modal
function DecisionGateModal({ 
  open, 
  onOpenChange, 
  onQuickSetup, 
  onSkip 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onQuickSetup: () => void;
  onSkip: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-warning-600" />
          </div>
          <DialogTitle className="text-heading-lg text-center">Complete POSITION First</DialogTitle>
          <DialogDescription className="text-body text-neutral-600 text-center">
            For best results, complete POSITION to establish your archetype and content strategy. Without it, content may lack strategic alignment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={onQuickSetup} size="lg" className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            2-Min Quick Setup
          </Button>
          <Button variant="outline" onClick={onSkip} size="lg" className="w-full">
            Skip Anyway
          </Button>
          <p className="text-caption text-neutral-500 text-center">
            Skipping may result in generic content that doesn't build your reputation equity.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ExpressPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { toast } = useToast();
  const { isPositioned } = usePositioningStore();

  const [showDecisionGate, setShowDecisionGate] = useState(!isPositioned);
  const [activeTab, setActiveTab] = useState('all');

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  // Load real content from Supabase
  useEffect(() => {
    async function loadContent() {
      if (!clientId) return;
      setLoadingContent(true);
      try {
        const { supabase } = await import('@/lib/supabase/client');
        const { data, error } = await supabase
          .from('content_items')
          .select('id, title, body, platform, status, created_at, updated_at, published_at, nlp_compliance, performance_prediction')
          .eq('client_id', clientId)
          .order('updated_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const items: ContentItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          title: (row.title as string | null) ?? 'Untitled',
          excerpt: typeof row.body === 'string' ? (row.body as string).slice(0, 120) + '...' : '',
          platform: (row.platform as ContentPlatform) ?? 'linkedin',
          status: (row.status as ContentStatus) ?? 'draft',
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          publishedAt: (row.published_at as string | null) ?? undefined,
          nlpCompliance: (row.nlp_compliance as ContentItem['nlpCompliance']) ?? {
            passed: false, archetypeAlignment: 0, frameCheck: false, authorityMarkers: 0,
          },
          performancePrediction: row.performance_prediction as ContentItem['performancePrediction'],
        }));
        setContentItems(items);
      } catch {
        // Keep empty array on error — user will see empty state
      } finally {
        setLoadingContent(false);
      }
    }
    loadContent();
  }, [clientId]);

  const filteredContent = activeTab === 'all'
    ? contentItems
    : contentItems.filter(c => c.status === activeTab);

  const handleCreateContent = () => {
    if (!isPositioned) {
      setShowDecisionGate(true);
      return;
    }
    router.push(`/clients/${clientId}/express/create`);
  };

  const handleQuickSetup = () => {
    router.push(`/clients/${clientId}/position`);
  };

  const handleSkip = () => {
    setShowDecisionGate(false);
    router.push(`/clients/${clientId}/express/create`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Decision Gate Alert (persistent if not positioned) */}
      {!isPositioned && (
        <Alert variant="warning" className="border-warning-200 bg-warning-50">
          <AlertTriangle className="h-4 w-4 text-warning-600" />
          <AlertTitle className="text-warning-800">Positioning Recommended</AlertTitle>
          <AlertDescription className="text-warning-700 flex items-center justify-between">
            <span>Complete POSITION for strategic alignment and higher-performing content.</span>
            <Button variant="outline" size="sm" onClick={() => setShowDecisionGate(true)} className="border-warning-300 text-warning-800 hover:bg-warning-100">
              Set Up Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-lg text-neutral-900">Express</h1>
          <p className="text-body-sm text-neutral-500 mt-1">
            AI-powered thought leadership content creation
          </p>
        </div>
        <Button onClick={handleCreateContent} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Create Content
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-caption text-neutral-500 uppercase tracking-wider">Total Content</p>
            <p className="text-heading-lg text-neutral-900 font-bold mt-1">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-caption text-neutral-500 uppercase tracking-wider">Published</p>
            <p className="text-heading-lg text-success-600 font-bold mt-1">18</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-caption text-neutral-500 uppercase tracking-wider">Avg Engagement</p>
            <p className="text-heading-lg text-primary-600 font-bold mt-1">4.8%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-caption text-neutral-500 uppercase tracking-wider">NLP Compliance</p>
            <p className="text-heading-lg text-neutral-900 font-bold mt-1">92%</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Library */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search content..." 
                className="pl-9 pr-4 py-2 border border-neutral-300 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {filteredContent.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-heading-md text-neutral-900 mb-2">No content yet</h3>
              <p className="text-body text-neutral-600 mb-6">Create your first piece of thought leadership content.</p>
              <Button onClick={handleCreateContent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Content
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map(content => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decision Gate Modal */}
      <DecisionGateModal
        open={showDecisionGate}
        onOpenChange={setShowDecisionGate}
        onQuickSetup={handleQuickSetup}
        onSkip={handleSkip}
      />
    </div>
  );
}