// app/(dashboard)/clients/[id]/express/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Save,
  Send,
  BarChart3,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

import { cn } from '@/lib/utils';
import { usePositioningStore } from '@/store/positioning-store';

type ContentPlatform = 'linkedin' | 'twitter' | 'medium' | 'op_ed';

interface NLPCompliance {
  passed: boolean;
  archetypeAlignment: number;
  frameCheck: {
    passed: boolean;
    avoidFramesDetected: boolean;
    targetFramesPresent: boolean;
  };
  authorityMarkers: {
    count: number;
    markers: Array<{ type: string; text: string }>;
  };
  sentimentScore: number;
  voiceConsistency: number;
}

interface PerformancePrediction {
  engagementRate: number;
  impressions: number;
  shares: number;
  confidence: number;
  suggestions: Array<{
    issue: string;
    suggestion: string;
    impact: string;
  }>;
}

const PLATFORM_LIMITS: Record<ContentPlatform, number> = {
  linkedin: 3000,
  twitter: 280,
  medium: 10000,
  op_ed: 800
};

export default function CreateContentPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { toast } = useToast();
  const { positioning, isPositioned } = usePositioningStore();

  const [step, setStep] = useState<'platform' | 'topic' | 'generating' | 'edit'>('platform');
  const [platform, setPlatform] = useState<ContentPlatform>('linkedin');
  const [topic, setTopic] = useState('');
  const [template, setTemplate] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [compliance, setCompliance] = useState<NLPCompliance | null>(null);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not positioned
  useEffect(() => {
    if (!isPositioned && step !== 'platform') {
      toast({
        title: "Positioning Required",
        description: "Please complete POSITION module first for best results.",
        variant: "destructive"
      });
    }
  }, [isPositioned, step]);

  const generateContent = async () => {
    if (!topic) {
      toast({
        title: "Topic required",
        description: "Please enter a topic or theme for your content.",
        variant: "destructive"
      });
      return;
    }

    setStep('generating');
    setIsGenerating(true);

    // Simulate API call to /api/content/generate
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockContent = `I spent 15 years climbing the corporate ladder, only to realize I was building someone else's dream.

Not my own.

In 2019, I walked away from a $400K executive role. No plan. No safety net. Just a burning conviction that there had to be a better way to lead—and live.

Here's what I learned in the 4 years since:

1. **Your title is not your identity**
   I used to introduce myself as "VP of Strategy at [Company]." Now I lead with my values. The difference in the conversations I attract is staggering.

2. **Burnout is a leadership failure, not a badge of honor**
   I used to wear 80-hour weeks like a medal. Now I measure success by impact per hour, not hours logged. My output tripled. So did my team's.

3. **Vulnerability scales**
   I used to think leaders needed all the answers. Now I share my uncertainties openly. The trust this builds is worth more than any authority I pretended to have.

The old playbook says leaders must be invincible. 

The new reality? Your scars are your credentials. Your failures are your curriculum. Your doubts are what make you relatable enough to lead.

What's one "leadership rule" you're questioning?`;

    setGeneratedContent(mockContent);
    setIsGenerating(false);
    setStep('edit');

    // Simulate NLP compliance check
    setCompliance({
      passed: true,
      archetypeAlignment: 87,
      frameCheck: {
        passed: true,
        avoidFramesDetected: false,
        targetFramesPresent: true
      },
      authorityMarkers: {
        count: 3,
        markers: [
          { type: 'presupposition', text: '15 years climbing' },
          { type: 'factive', text: 'realize' },
          { type: 'quantification', text: '$400K' }
        ]
      },
      sentimentScore: 0.4,
      voiceConsistency: 85
    });

    // Simulate performance prediction
    setPrediction({
      engagementRate: 4.8,
      impressions: 15200,
      shares: 340,
      confidence: 0.85,
      suggestions: [
        {
          issue: "Opening could be stronger",
          suggestion: "Start with specific time-bound hook",
          impact: "+0.8% engagement"
        },
        {
          issue: "Add question in first 3 sentences",
          suggestion: "Include rhetorical question to boost comments",
          impact: "+1.2% engagement"
        }
      ]
    });
  };

  const regenerateContent = () => {
    generateContent();
  };

  const saveContent = async (status: 'draft' | 'published') => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: status === 'published' ? "Content Published" : "Draft Saved",
      description: status === 'published' ? "Your content is now live." : "Draft saved to your library."
    });
    
    setIsSaving(false);
    router.push(`/clients/${clientId}/express`);
  };

  const getPlatformName = (p: ContentPlatform) => {
    const names: Record<ContentPlatform, string> = {
      linkedin: 'LinkedIn Article',
      twitter: 'X/Twitter Thread',
      medium: 'Medium Story',
      op_ed: 'Op-Ed'
    };
    return names[p];
  };

  if (step === 'platform') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-heading-lg text-neutral-900">Select Platform</h1>
            <p className="text-body text-neutral-600 mt-2">Choose where you want to publish this content.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['linkedin', 'twitter', 'medium', 'op_ed'] as ContentPlatform[]).map((p) => (
              <motion.div
                key={p}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setPlatform(p); setStep('topic'); }}
                className={cn(
                  "cursor-pointer p-6 rounded-xl border-2 transition-all",
                  platform === p 
                    ? "border-primary-500 bg-primary-50" 
                    : "border-neutral-200 bg-white hover:border-primary-300"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    platform === p ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"
                  )}>
                    {p === 'linkedin' && <Linkedin className="h-5 w-5" />}
                    {p === 'twitter' && <Twitter className="h-5 w-5" />}
                    {p === 'medium' && <BookOpen className="h-5 w-5" />}
                    {p === 'op_ed' && <FileText className="h-5 w-5" />}
                  </div>
                  <h3 className="text-heading-sm font-semibold">{getPlatformName(p)}</h3>
                </div>
                <p className="text-body-sm text-neutral-600">
                  {p === 'linkedin' && 'Long-form professional content with high B2B engagement'}
                  {p === 'twitter' && 'Short-form threads for rapid viral potential'}
                  {p === 'medium' && 'In-depth thought leadership for serious readers'}
                  {p === 'op_ed' && 'Formal opinion pieces for publication in major outlets'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-caption">
                    {PLATFORM_LIMITS[p].toLocaleString()} char max
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'topic') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => setStep('platform')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-heading-lg text-neutral-900">Content Topic</h1>
            <p className="text-body text-neutral-600 mt-2">What do you want to write about?</p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>Topic or Theme</Label>
                <Textarea
                  placeholder="e.g., The mistakes I made scaling my first company, or Why I believe remote work is here to stay..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              {isPositioned && positioning?.content_pillars && (
                <div>
                  <Label className="text-neutral-500">Or select from your content pillars:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {positioning.content_pillars.map((pillar: any) => (
                      <Button
                        key={pillar.name}
                        variant="outline"
                        size="sm"
                        onClick={() => setTopic(pillar.themes[0])}
                      >
                        {pillar.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Influencer Template (Optional)</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a template style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="naval">Naval Ravikant Style</SelectItem>
                    <SelectItem value="sahil">Sahil Bloom Style</SelectItem>
                    <SelectItem value="dickie">Dickie Bush Style</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateContent} 
                size="lg" 
                className="w-full"
                disabled={!topic}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          <RefreshCw className="h-12 w-12 text-primary-600" />
        </motion.div>
        <h2 className="text-heading-lg text-neutral-900 mt-6">Generating Your Content</h2>
        <p className="text-body text-neutral-600 mt-2">
          AI is crafting content aligned with your {positioning?.personal_archetype || 'selected'} archetype...
        </p>
        <div className="mt-8 max-w-md mx-auto">
          <Progress value={45} className="h-2" />
          <div className="flex justify-between mt-2 text-caption text-neutral-500">
            <span>Analyzing topic</span>
            <span>Applying archetype voice</span>
            <span>Finalizing</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => setStep('topic')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={regenerateContent}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button variant="outline" onClick={() => saveContent('draft')} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button onClick={() => saveContent('published')} disabled={isSaving}>
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="border-b border-neutral-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={compliance?.passed ? "success" : "warning"}>
                    {compliance?.passed ? 'Compliant' : 'Needs Review'}
                  </Badge>
                  <span className="text-body-sm text-neutral-500">
                    Archetype Alignment: {compliance?.archetypeAlignment}%
                  </span>
                </div>
                <span className="text-caption text-neutral-400">
                  {generatedContent.length} / {PLATFORM_LIMITS[platform]} chars
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[500px] border-0 rounded-none resize-none font-mono text-body leading-relaxed p-6 focus-visible:ring-0"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* NLP Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-heading-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary-600" />
                NLP Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-600">Frame Check</span>
                {compliance?.frameCheck.passed ? (
                  <CheckCircle2 className="h-4 w-4 text-success-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-error-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-600">Authority Markers</span>
                <Badge variant="secondary">{compliance?.authorityMarkers.count} found</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-neutral-600">Voice Consistency</span>
                <span className="text-body-sm font-medium">{compliance?.voiceConsistency}%</span>
              </div>

              {compliance?.authorityMarkers.markers && (
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-caption text-neutral-500 mb-2">Detected Markers:</p>
                  <div className="space-y-1">
                    {compliance.authorityMarkers.markers.map((marker, i) => (
                      <div key={i} className="text-caption bg-neutral-50 p-2 rounded border border-neutral-200">
                        <span className="text-neutral-400 capitalize">{marker.type}:</span>{' '}
                        <span className="text-neutral-700 font-medium">"{marker.text}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Prediction */}
          {prediction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary-600" />
                  Performance Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 p-3 rounded-lg text-center">
                    <p className="text-heading-sm text-primary-600 font-bold">{prediction.engagementRate}%</p>
                    <p className="text-caption text-neutral-500">Engagement</p>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg text-center">
                    <p className="text-heading-sm text-neutral-900 font-bold">{(prediction.impressions / 1000).toFixed(1)}K</p>
                    <p className="text-caption text-neutral-500">Impressions</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-body-sm font-medium text-neutral-900 mb-2">Optimization Suggestions:</p>
                  <div className="space-y-2">
                    {prediction.suggestions.map((sugg, i) => (
                      <Alert key={i} className="bg-warning-50 border-warning-200 py-2">
                        <Lightbulb className="h-4 w-4 text-warning-600" />
                        <AlertDescription className="text-warning-800 text-body-sm">
                          {sugg.suggestion}
                          <span className="block text-caption text-warning-600 mt-1">{sugg.impact}</span>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}