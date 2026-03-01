// app/(dashboard)/clients/[id]/position/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  TrendingUp, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  RefreshCw,
  Target,
  ArrowRight,
  Copy,
  Save,
  Wand2,
  ChevronRight,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

import { cn } from '@/lib/utils';
import { useClientStore } from '@/store/client-store';
import { usePositioningStore } from '@/store/positioning-store';

// Archetype data structure
interface Archetype {
  id: string;
  name: string;
  tier: 'jungian' | 'professional' | 'niche';
  category: string;
  description: string;
  traits: string[];
  voice: string;
  compatible: string[];
  incompatible: string[];
  followability: number;
  icon: string;
}

// Influencer Template
interface InfluencerTemplate {
  id: string;
  influencer_name: string;
  influencer_url: string;
  structure: {
    hook: string;
    problem: string;
    agitation: string;
    solution: string;
    proof: string;
    cta: string;
  };
  style: {
    sentenceLength: number;
    paragraphLength: number;
    activeVoice: number;
    pacing: 'fast' | 'contemplative';
  };
  emotional_triggers: string[];
  template_text: string;
}

// Content Pillar
interface ContentPillar {
  name: string;
  themes: string[];
  frequency: string;
  formats: string[];
}

// Target Influencer
interface TargetInfluencer {
  name: string;
  archetype: string;
  platforms: string[];
  strategy: string;
}

// Positioning State
interface PositioningData {
  id: string;
  mode: 'personal_only' | 'personal_and_business';
  personal_archetype: string;
  business_archetype?: string;
  archetype_confidence: number;
  followability_score: number;
  followability_factors: {
    uniqueness: number;
    emotionalResonance: number;
    contentOpportunity: number;
    platformFit: number;
    historicalPerformance: number;
  };
  positioning_statement: string;
  content_pillars: ContentPillar[];
  signature_lines: string[];
  target_influencers: TargetInfluencer[];
  ab_test_active: boolean;
}

// Archetype Library (54 total - subset shown for brevity)
const ARCHETYPES: Archetype[] = [
  // Jungian Core (12)
  { id: 'sage', name: 'The Sage', tier: 'jungian', category: 'Knowledge', description: 'Seeks truth and understanding above all', traits: ['Analytical', 'Objective', 'Expert'], voice: 'Authoritative, precise, evidence-based', compatible: ['maven', 'visionary'], incompatible: ['jester', 'everyman'], followability: 78, icon: '📚' },
  { id: 'explorer', name: 'The Explorer', tier: 'jungian', category: 'Freedom', description: 'Pushes boundaries and discovers new paths', traits: ['Adventurous', 'Independent', 'Authentic'], voice: 'Curious, bold, experiential', compatible: ['pioneer', 'rebel'], incompatible: ['caregiver', 'ruler'], followability: 72, icon: '🧭' },
  { id: 'rebel', name: 'The Rebel', tier: 'jungian', category: 'Liberation', description: 'Challenges status quo and breaks rules', traits: ['Disruptive', 'Fearless', 'Radical'], voice: 'Provocative, direct, unapologetic', compatible: ['maverick', 'explorer'], incompatible: ['ruler', 'caregiver'], followability: 75, icon: '⚡' },
  { id: 'magician', name: 'The Magician', tier: 'jungian', category: 'Power', description: 'Transforms reality and makes things happen', traits: ['Visionary', 'Charismatic', 'Transformative'], voice: 'Inspiring, mysterious, empowering', compatible: ['visionary', 'alchemist'], incompatible: ['everyman', 'sage'], followability: 82, icon: '🔮' },
  { id: 'hero', name: 'The Hero', tier: 'jungian', category: 'Mastery', description: 'Overcomes obstacles and proves worth', traits: ['Courageous', 'Disciplined', 'Competitive'], voice: 'Motivational, determined, action-oriented', compatible: ['warrior', 'champion'], incompatible: ['caregiver', 'innocent'], followability: 80, icon: '🛡️' },
  { id: 'caregiver', name: 'The Caregiver', tier: 'jungian', category: 'Service', description: 'Protects and cares for others', traits: ['Compassionate', 'Generous', 'Nurturing'], voice: 'Warm, supportive, empathetic', compatible: ['healer', 'guardian'], incompatible: ['rebel', 'trickster'], followability: 68, icon: '❤️' },
  { id: 'ruler', name: 'The Ruler', tier: 'jungian', category: 'Control', description: 'Creates order and prosperity', traits: ['Responsible', 'Commanding', 'Organized'], voice: 'Decisive, structured, leadership-focused', compatible: ['sovereign', 'architect'], incompatible: ['rebel', 'jester'], followability: 74, icon: '👑' },
  { id: 'jester', name: 'The Jester', tier: 'jungian', category: 'Enjoyment', description: 'Brings joy and humor to life', traits: ['Playful', 'Spontaneous', 'Humorous'], voice: 'Witty, light, entertaining', compatible: ['entertainer', 'provocateur'], incompatible: ['ruler', 'sage'], followability: 70, icon: '🃏' },
  { id: 'everyman', name: 'The Everyman', tier: 'jungian', category: 'Belonging', description: 'Connects with others through shared experience', traits: ['Relatable', 'Humble', 'Realistic'], voice: 'Conversational, down-to-earth, accessible', compatible: ['companion', 'neighbor'], incompatible: ['magician', 'ruler'], followability: 65, icon: '🤝' },
  { id: 'lover', name: 'The Lover', tier: 'jungian', category: 'Intimacy', description: 'Creates relationships and inspires passion', traits: ['Passionate', 'Committed', 'Appreciative'], voice: 'Sensual, warm, relationship-focused', compatible: ['partner', 'aesthete'], incompatible: ['sage', 'rebel'], followability: 71, icon: '💕' },
  { id: 'creator', name: 'The Creator', tier: 'jungian', category: 'Innovation', description: 'Imagines and builds new things', traits: ['Imaginative', 'Original', 'Expressive'], voice: 'Visionary, artistic, detail-oriented', compatible: ['artist', 'maker'], incompatible: ['everyman', 'caregiver'], followability: 76, icon: '🎨' },
  { id: 'innocent', name: 'The Innocent', tier: 'jungian', category: 'Safety', description: 'Seeks happiness and does things right', traits: ['Optimistic', 'Honest', 'Pure'], voice: 'Simple, hopeful, trustworthy', compatible: ['dreamer', 'idealist'], incompatible: ['rebel', 'magician'], followability: 63, icon: '🌟' },
  
  // Professional (21) - subset
  { id: 'maven', name: 'The Maven', tier: 'professional', category: 'Expertise', description: 'Accumulates deep knowledge and shares generously', traits: ['Knowledgeable', 'Generous', 'Connected'], voice: 'Educational, detailed, generous', compatible: ['sage', 'teacher'], incompatible: ['trickster'], followability: 81, icon: '🎓' },
  { id: 'visionary', name: 'The Visionary', tier: 'professional', category: 'Leadership', description: 'Sees future possibilities and inspires others', traits: ['Forward-thinking', 'Inspiring', 'Strategic'], voice: 'Big-picture, inspiring, conceptual', compatible: ['magician', 'explorer'], incompatible: ['bureaucrat'], followability: 85, icon: '🔭' },
  { id: 'pioneer', name: 'The Pioneer', tier: 'professional', category: 'Innovation', description: 'First to explore new territories', traits: ['Bold', 'Innovative', 'Resilient'], voice: 'Adventurous, risk-taking, inspiring', compatible: ['explorer', 'founder'], incompatible: ['guardian'], followability: 79, icon: '🚀' },
  { id: 'architect', name: 'The Architect', tier: 'professional', category: 'Design', description: 'Designs systems and structures', traits: ['Systematic', 'Precise', 'Innovative'], voice: 'Technical, structured, elegant', compatible: ['ruler', 'creator'], incompatible: ['jester'], followability: 77, icon: '🏗️' },
  
  // Niche (21) - subset
  { id: 'disruptor', name: 'The Disruptor', tier: 'niche', category: 'Change', description: 'Fundamentally changes how things work', traits: ['Revolutionary', 'Fearless', 'Systematic'], voice: 'Challenging, analytical, bold', compatible: ['rebel', 'pioneer'], incompatible: ['ruler', 'guardian'], followability: 83, icon: '💥' },
  { id: 'alchemist', name: 'The Alchemist', tier: 'niche', category: 'Transformation', description: 'Turns the ordinary into extraordinary', traits: ['Transformative', 'Mysterious', 'Powerful'], voice: 'Metaphorical, transformative, deep', compatible: ['magician', 'visionary'], incompatible: ['skeptic'], followability: 80, icon: '⚗️' },
];

// Archetype Selection Card Component
function ArchetypeCard({ 
  archetype, 
  selected, 
  onClick 
}: { 
  archetype: Archetype; 
  selected: boolean; 
  onClick: () => void; 
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border-2 p-4 transition-all duration-150",
        selected 
          ? "border-primary-500 bg-primary-50 shadow-md" 
          : "border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{archetype.icon}</span>
        <Badge variant={selected ? "default" : "secondary"} className="text-xs">
          {archetype.tier}
        </Badge>
      </div>
      <h4 className="text-heading-sm font-semibold text-neutral-900 mb-1">
        {archetype.name}
      </h4>
      <p className="text-caption text-neutral-500 mb-3 line-clamp-2">
        {archetype.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {archetype.traits.slice(0, 2).map(trait => (
            <span key={trait} className="text-caption bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
              {trait}
            </span>
          ))}
        </div>
        <div className="text-body-sm font-medium text-primary-600">
          {archetype.followability}%
        </div>
      </div>
    </motion.div>
  );
}

// Followability Prediction Display
function FollowabilityPrediction({ 
  score, 
  factors 
}: { 
  score: number; 
  factors: PositioningData['followability_factors']; 
}) {
  const getLabel = (s: number) => {
    if (s >= 85) return { text: 'Exceptional', color: 'bg-success-500' };
    if (s >= 70) return { text: 'Strong', color: 'bg-primary-500' };
    if (s >= 55) return { text: 'Moderate', color: 'bg-warning-500' };
    return { text: 'Challenging', color: 'bg-error-500' };
  };

  const label = getLabel(score);

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="text-display-md text-primary-600 font-bold">
            {score}%
          </div>
          <p className="text-body text-neutral-600 mt-1">Predicted Followability</p>
          <Badge className={cn("mt-2 text-white", label.color)}>
            {label.text}
          </Badge>
        </div>

        <div className="space-y-3">
          <FactorBar label="Uniqueness" value={factors.uniqueness} />
          <FactorBar label="Emotional Resonance" value={factors.emotionalResonance} />
          <FactorBar label="Content Opportunity" value={factors.contentOpportunity} />
          <FactorBar label="Platform Fit" value={factors.platformFit} />
          <FactorBar label="Historical Performance" value={factors.historicalPerformance} />
        </div>
      </CardContent>
    </Card>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-body-sm text-neutral-600">{label}</span>
        <span className="text-body-sm font-medium text-neutral-900">{value}%</span>
      </div>
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>
    </div>
  );
}

// Influencer DNA Analyzer Dialog
function InfluencerDNAAnalyzer({ 
  open, 
  onOpenChange,
  onSave 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (template: InfluencerTemplate) => void;
}) {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<InfluencerTemplate | null>(null);
  const { toast } = useToast();

  const analyzeContent = async () => {
    if (!url.includes('linkedin.com') && !url.includes('twitter.com') && !url.includes('x.com')) {
      toast({
        title: "Invalid URL",
        description: "Please provide a LinkedIn or X/Twitter URL",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const mockResult: InfluencerTemplate = {
      id: crypto.randomUUID(),
      influencer_name: "Sample Influencer",
      influencer_url: url,
      structure: {
        hook: "I made a $10M mistake so you don't have to...",
        problem: "Most leaders focus on revenue growth while ignoring...",
        agitation: "This blindspot cost me 2 years and nearly my company...",
        solution: "Here's the framework I wish I had 5 years ago...",
        proof: "After implementing this, we grew 340% in 18 months...",
        cta: "Save this. Your future self will thank you."
      },
      style: {
        sentenceLength: 12,
        paragraphLength: 3,
        activeVoice: 87,
        pacing: 'contemplative'
      },
      emotional_triggers: ['vulnerability', 'urgency', 'curiosity', 'validation'],
      template_text: `[HOOK: Personal mistake/confession]

[PROBLEM: Industry blindspot]

[AGITATION: Personal cost/story]

[SOLUTION: Framework/method]

[PROOF: Specific results]

[CTA: Save/Share/Comment]`
    };
    
    setResult(mockResult);
    setAnalyzing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-heading-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            Influencer Content DNA Analyzer
          </DialogTitle>
          <DialogDescription className="text-body text-neutral-600">
            Extract the exact structure, style, and emotional triggers from any influencer's content.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-label">Influencer Content URL</Label>
              <Input
                placeholder="https://linkedin.com/posts/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-caption text-neutral-500 mt-1.5">
                LinkedIn post, X/Twitter thread, or Medium article
              </p>
            </div>
            
            <Button 
              onClick={analyzeContent} 
              disabled={analyzing || !url}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Content DNA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extract DNA
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Structure Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-sm">Structure Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(result.structure).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-label text-neutral-500 uppercase text-xs mb-1">{key}</dt>
                    <dd className="text-body-sm text-neutral-900 font-mono bg-neutral-50 p-2 rounded border border-neutral-200">
                      {value}
                    </dd>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Style Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-heading-sm">Style Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-sm text-neutral-600">Avg Sentence Length</span>
                    <span className="text-body-sm font-medium">{result.style.sentenceLength} words</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-neutral-600">Paragraph Length</span>
                    <span className="text-body-sm font-medium">{result.style.paragraphLength} sentences</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-neutral-600">Active Voice</span>
                    <span className="text-body-sm font-medium">{result.style.activeVoice}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-sm text-neutral-600">Pacing</span>
                    <Badge variant="outline">{result.style.pacing}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-heading-sm">Emotional Triggers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.emotional_triggers.map(trigger => (
                      <Badge key={trigger} variant="secondary" className="capitalize">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Template */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-heading-sm">Reusable Template</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(result.template_text)}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-body-sm font-mono bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                  {result.template_text}
                </pre>
              </CardContent>
            </Card>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                Analyze Another
              </Button>
              <Button onClick={() => { onSave(result); onOpenChange(false); }}>
                <Save className="mr-2 h-4 w-4" />
                Save to Library
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Archetype Evolution Dialog
function ArchetypeEvolutionDialog({
  open,
  onOpenChange,
  currentArchetype,
  onEvolve
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentArchetype: string;
  onEvolve: (mode: 'add' | 'replace', archetype: string) => void;
}) {
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  
  const current = ARCHETYPES.find(a => a.id === currentArchetype);
  const compatible = current ? ARCHETYPES.filter(a => current.compatible.includes(a.id)) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-heading-lg">Archetype Evolution Strategy</DialogTitle>
          <DialogDescription>
            Current archetype not performing? Add a secondary or replace entirely.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'add' | 'replace')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">ADD Secondary</TabsTrigger>
            <TabsTrigger value="replace">REPLACE Primary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="space-y-4 mt-4">
            <Alert className="bg-info-50 border-info-200">
              <AlertTitle className="text-info-800">Adding Complexity</AlertTitle>
              <AlertDescription className="text-info-700">
                Adding a secondary archetype increases complexity but can boost followability by 8-15 points.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-3">
              {compatible.map(archetype => (
                <ArchetypeCard
                  key={archetype.id}
                  archetype={archetype}
                  selected={selectedArchetype === archetype.id}
                  onClick={() => setSelectedArchetype(archetype.id)}
                />
              ))}
            </div>

            {selectedArchetype && (
              <Card className="bg-success-50 border-success-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body-sm text-success-800 font-medium">Predicted Improvement</p>
                    <p className="text-heading-md text-success-900 font-bold">+12% Followability</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-success-600" />
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="replace" className="space-y-4 mt-4">
            <Alert className="bg-warning-50 border-warning-200">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              <AlertTitle className="text-warning-800">Major Change</AlertTitle>
              <AlertDescription className="text-warning-700">
                Replacing your primary archetype resets your content strategy. Use with caution.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {ARCHETYPES.map(archetype => (
                <ArchetypeCard
                  key={archetype.id}
                  archetype={archetype}
                  selected={selectedArchetype === archetype.id}
                  onClick={() => setSelectedArchetype(archetype.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            disabled={!selectedArchetype}
            onClick={() => onEvolve(mode, selectedArchetype)}
          >
            {mode === 'add' ? 'Add Secondary Archetype' : 'Replace Primary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Position Page Component
export default function PositionPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { toast } = useToast();
  const { currentClient } = useClientStore();
  const { positioning, setPositioning, isPositioned } = usePositioningStore();

  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [showEvolution, setShowEvolution] = useState(false);
  const [showDNAAnalyzer, setShowDNAAnalyzer] = useState(false);
  const [influencerTemplates, setInfluencerTemplates] = useState<InfluencerTemplate[]>([]);

  // Wizard state
  const [mode, setMode] = useState<'personal_only' | 'personal_and_business'>('personal_only');
  const [personalArchetype, setPersonalArchetype] = useState('');
  const [businessArchetype, setBusinessArchetype] = useState('');
  const [predictedFollowability, setPredictedFollowability] = useState<number | null>(null);

  useEffect(() => {
    // Check if positioning exists
    const timer = setTimeout(() => {
      if (!isPositioned) {
        setShowWizard(true);
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [isPositioned]);

  const predictFollowability = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const baseScore = ARCHETYPES.find(a => a.id === personalArchetype)?.followability || 70;
    const adjusted = baseScore + Math.random() * 10 - 5;
    
    setPredictedFollowability(Math.round(adjusted));
  };

  const completePositioning = async () => {
    const newPositioning: PositioningData = {
      id: crypto.randomUUID(),
      mode,
      personal_archetype: personalArchetype,
      business_archetype: mode === 'personal_and_business' ? businessArchetype : undefined,
      archetype_confidence: 85,
      followability_score: predictedFollowability || 75,
      followability_factors: {
        uniqueness: Math.round(70 + Math.random() * 20),
        emotionalResonance: Math.round(75 + Math.random() * 15),
        contentOpportunity: Math.round(80 + Math.random() * 10),
        platformFit: Math.round(85 + Math.random() * 10),
        historicalPerformance: Math.round(60 + Math.random() * 25)
      },
      positioning_statement: `The ${ARCHETYPES.find(a => a.id === personalArchetype)?.name} who transforms ${currentClient?.industry || 'industry'} through ${ARCHETYPES.find(a => a.id === personalArchetype)?.traits[0].toLowerCase()} leadership.`,
      content_pillars: [
        { name: 'Industry Insights', themes: ['Trends', 'Analysis', 'Predictions'], frequency: '2x weekly', formats: ['LinkedIn articles', 'Threads'] },
        { name: 'Leadership Lessons', themes: ['Management', 'Culture', 'Growth'], frequency: '1x weekly', formats: ['Personal stories', 'Frameworks'] },
        { name: 'Behind the Scenes', themes: ['Operations', 'Decision-making', 'Challenges'], frequency: '1x weekly', formats: ['Short posts', 'Carousels'] }
      ],
      signature_lines: [
        "What would you add?",
        "Agree or disagree?",
        "Your thoughts?"
      ],
      target_influencers: [
        { name: 'Naval Ravikant', archetype: 'sage', platforms: ['Twitter', 'Podcast'], strategy: 'Engage with philosophical takes' },
        { name: 'Sara Blakely', archetype: 'rebel', platforms: ['LinkedIn', 'Instagram'], strategy: 'Comment on founder stories' }
      ],
      ab_test_active: false
    };

    setPositioning(newPositioning);
    setShowWizard(false);
    toast({
      title: "Positioning Locked",
      description: "Your strategic foundation is now set. All content will align with this positioning."
    });
  };

  const handleEvolve = (evolveMode: 'add' | 'replace', archetypeId: string) => {
    toast({
      title: "Evolution Started",
      description: `30-day A/B test initiated for ${evolveMode === 'add' ? 'secondary' : 'new primary'} archetype.`
    });
    setShowEvolution(false);
  };

  const saveInfluencerTemplate = (template: InfluencerTemplate) => {
    setInfluencerTemplates(prev => [...prev, template]);
    toast({
      title: "Template Saved",
      description: `${template.influencer_name}'s DNA added to your library.`
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  // Wizard Modal
  if (showWizard) {
    const steps = ['Select Mode', 'Choose Archetype', 'Predict Followability', 'Review & Confirm'];
    
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-2 border-primary-100">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-primary-600">
                Step {wizardStep + 1} of {steps.length}
              </Badge>
              <span className="text-caption text-neutral-500">{steps[wizardStep]}</span>
            </div>
            <Progress value={((wizardStep + 1) / steps.length) * 100} className="h-2" />
          </CardHeader>

          <CardContent className="py-6">
            <AnimatePresence mode="wait">
              {wizardStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-heading-lg text-neutral-900 mb-2">Select Positioning Mode</h2>
                    <p className="text-body text-neutral-600">Choose how you want to position your reputation.</p>
                  </div>

                  <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="space-y-4">
                    <div className={cn(
                      "flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      mode === 'personal_only' ? "border-primary-500 bg-primary-50" : "border-neutral-200 hover:border-primary-300"
                    )} onClick={() => setMode('personal_only')}>
                      <RadioGroupItem value="personal_only" id="personal_only" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="personal_only" className="text-heading-sm font-semibold cursor-pointer">Personal Archetype Only</Label>
                        <p className="text-body-sm text-neutral-600 mt-1">Best for: Film actors, artists, writers, independent consultants</p>
                        <ul className="mt-2 space-y-1 text-caption text-neutral-500">
                          <li>• Single cohesive narrative</li>
                          <li>• Easier to maintain consistency</li>
                          <li>• Stronger personal connection</li>
                        </ul>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      mode === 'personal_and_business' ? "border-primary-500 bg-primary-50" : "border-neutral-200 hover:border-primary-300"
                    )} onClick={() => setMode('personal_and_business')}>
                      <RadioGroupItem value="personal_and_business" id="personal_and_business" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="personal_and_business" className="text-heading-sm font-semibold cursor-pointer">Personal + Business Archetypes</Label>
                        <p className="text-body-sm text-neutral-600 mt-1">Best for: CEOs, founders, executives, company leaders</p>
                        <ul className="mt-2 space-y-1 text-caption text-neutral-500">
                          <li>• Dual narrative flexibility</li>
                          <li>• Company + personal reputation</li>
                          <li>• Higher complexity, higher reward</li>
                        </ul>
                      </div>
                    </div>
                  </RadioGroup>
                </motion.div>
              )}

              {wizardStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-heading-lg text-neutral-900 mb-2">Choose Your Archetype</h2>
                    <p className="text-body text-neutral-600">Select the persona that best represents your natural strengths.</p>
                  </div>

                  <Tabs defaultValue="jungian" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="jungian">Jungian Core (12)</TabsTrigger>
                      <TabsTrigger value="professional">Professional (21)</TabsTrigger>
                      <TabsTrigger value="niche">Niche (21)</TabsTrigger>
                    </TabsList>
                    
                    {['jungian', 'professional', 'niche'].map((tier) => (
                      <TabsContent key={tier} value={tier} className="mt-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {ARCHETYPES.filter(a => a.tier === tier).map(archetype => (
                            <ArchetypeCard
                              key={archetype.id}
                              archetype={archetype}
                              selected={personalArchetype === archetype.id}
                              onClick={() => setPersonalArchetype(archetype.id)}
                            />
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {mode === 'personal_and_business' && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                      <Label className="text-label mb-3 block">Select Business Archetype (Optional)</Label>
                      <Select value={businessArchetype} onValueChange={setBusinessArchetype}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose business archetype..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ARCHETYPES.filter(a => a.tier === 'professional').map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </motion.div>
              )}

              {wizardStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-heading-lg text-neutral-900 mb-2">Predict Followability</h2>
                    <p className="text-body text-neutral-600">Our AI analyzes archetype-market fit to predict audience resonance.</p>
                  </div>

                  {!predictedFollowability ? (
                    <div className="text-center py-8">
                      <Button size="lg" onClick={predictFollowability} className="mx-auto">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Calculate Followability Score
                      </Button>
                    </div>
                  ) : (
                    <FollowabilityPrediction 
                      score={predictedFollowability}
                      factors={{
                        uniqueness: Math.round(75 + Math.random() * 15),
                        emotionalResonance: Math.round(70 + Math.random() * 20),
                        contentOpportunity: Math.round(80 + Math.random() * 15),
                        platformFit: Math.round(85 + Math.random() * 10),
                        historicalPerformance: Math.round(65 + Math.random() * 20)
                      }}
                    />
                  )}
                </motion.div>
              )}

              {wizardStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-heading-lg text-neutral-900 mb-2">Review Your Positioning</h2>
                    <p className="text-body text-neutral-600">Confirm your strategic foundation before locking.</p>
                  </div>

                  <Card className="bg-neutral-50">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                        <span className="text-body-sm text-neutral-500">Mode</span>
                        <Badge variant="secondary">{mode === 'personal_only' ? 'Personal Only' : 'Personal + Business'}</Badge>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                        <span className="text-body-sm text-neutral-500">Personal Archetype</span>
                        <span className="text-body font-medium">{ARCHETYPES.find(a => a.id === personalArchetype)?.name}</span>
                      </div>
                      {businessArchetype && (
                        <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                          <span className="text-body-sm text-neutral-500">Business Archetype</span>
                          <span className="text-body font-medium">{ARCHETYPES.find(a => a.id === businessArchetype)?.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-body-sm text-neutral-500">Predicted Followability</span>
                        <span className="text-heading-sm text-primary-600 font-bold">{predictedFollowability}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert className="border-warning-200 bg-warning-50">
                    <AlertTriangle className="h-4 w-4 text-warning-600" />
                    <AlertTitle className="text-warning-800">Strategic Lock</AlertTitle>
                    <AlertDescription className="text-warning-700">
                      Once confirmed, this positioning will guide all content in the EXPRESS module. You can evolve it later, but changes require a 30-day transition period.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-neutral-100 pt-6">
            <Button
              variant="outline"
              onClick={() => setWizardStep(Math.max(0, wizardStep - 1))}
              disabled={wizardStep === 0}
            >
              Back
            </Button>
            
            {wizardStep < steps.length - 1 ? (
              <Button 
                onClick={() => setWizardStep(wizardStep + 1)}
                disabled={(wizardStep === 0 && !mode) || (wizardStep === 1 && !personalArchetype)}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={completePositioning} className="bg-success-600 hover:bg-success-700">
                <Lock className="mr-2 h-4 w-4" />
                Lock Positioning
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main Positioning Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Strategic Lock Indicator */}
      <Alert className="border-success-500 bg-success-50">
        <Lock className="h-4 w-4 text-success-700" />
        <AlertTitle className="text-success-800">Strategic Foundation Locked</AlertTitle>
        <AlertDescription className="text-success-700 flex items-center justify-between">
          <span>All content in EXPRESS will align with this positioning.</span>
          <Button variant="link" onClick={() => setShowEvolution(true)} className="text-success-800 hover:text-success-900">
            Evolve archetype →
          </Button>
        </AlertDescription>
      </Alert>

      {/* Positioning Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-caption text-neutral-500 uppercase tracking-wider">Archetype</Label>
              <p className="text-heading-md text-neutral-900 mt-2">
                {ARCHETYPES.find(a => a.id === positioning?.personal_archetype)?.name}
                {positioning?.business_archetype && (
                  <span className="text-neutral-400"> + {ARCHETYPES.find(a => a.id === positioning.business_archetype)?.name}</span>
                )}
              </p>
              <p className="text-body-sm text-neutral-600 mt-1">
                {ARCHETYPES.find(a => a.id === positioning?.personal_archetype)?.description}
              </p>
            </div>
            
            <div>
              <Label className="text-caption text-neutral-500 uppercase tracking-wider">Followability Score</Label>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-heading-md text-primary-600 font-bold">
                  {positioning?.followability_score}%
                </span>
                <Badge className={cn(
                  positioning?.followability_score! >= 80 ? "bg-success-500" :
                  positioning?.followability_score! >= 65 ? "bg-primary-500" :
                  "bg-warning-500",
                  "text-white"
                )}>
                  {positioning?.followability_score! >= 80 ? 'Exceptional' :
                   positioning?.followability_score! >= 65 ? 'Strong' : 'Moderate'}
                </Badge>
              </div>
              <div className="mt-3 space-y-1">
                {Object.entries(positioning?.followability_factors || {}).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-caption">
                    <span className="text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-medium text-neutral-700">{Number(value)}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-caption text-neutral-500 uppercase tracking-wider">Mode</Label>
              <p className="text-body text-neutral-900 mt-2">
                {positioning?.mode === 'personal_only' ? 'Personal Only' : 'Personal + Business'}
              </p>
              <p className="text-body-sm text-neutral-600 mt-1">
                {positioning?.mode === 'personal_only' 
                  ? 'Single archetype strategy for focused personal brand' 
                  : 'Dual archetype strategy for complex leadership roles'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-heading-md flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-600" />
              Content Pillars
            </CardTitle>
            <CardDescription>Strategic themes for consistent content creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {positioning?.content_pillars.map((pillar: ContentPillar, i: number) => (
              <div key={i} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-heading-sm font-semibold text-neutral-900">{pillar.name}</h4>
                  <Badge variant="outline">{pillar.frequency}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {pillar.themes.map((theme: string) => (
                    <span key={theme} className="text-caption bg-white text-neutral-600 px-2 py-1 rounded border border-neutral-200">
                      {theme}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {pillar.formats.map((format: string) => (
                    <span key={format} className="text-caption text-neutral-500">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Content Pillar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-heading-md">Signature Lines</CardTitle>
            <CardDescription>Reusable closing phrases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {positioning?.signature_lines.map((line: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200 group">
                <span className="text-body-sm text-neutral-700">{line}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => navigator.clipboard.writeText(line)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-body-sm">
              <Plus className="mr-2 h-3 w-3" />
              Add Signature
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Influencer Mapping */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-heading-md flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Target Influencers
            </CardTitle>
            <CardDescription>Strategic relationships to cultivate</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDNAAnalyzer(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Influencer DNA
            </Button>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Target
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positioning?.target_influencers.map((influencer: TargetInfluencer, i: number) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-heading-sm">
                  {influencer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="text-body font-semibold text-neutral-900">{influencer.name}</h4>
                  <p className="text-caption text-neutral-500 capitalize mb-2">{influencer.archetype} archetype</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {influencer.platforms.map((platform: string) => (
                      <Badge key={platform} variant="secondary" className="text-caption">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-body-sm text-neutral-600">{influencer.strategy}</p>
                </div>
              </div>
            ))}
          </div>

          {influencerTemplates.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h4 className="text-heading-sm font-semibold text-neutral-900 mb-3">Saved Templates</h4>
              <div className="space-y-2">
                {influencerTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-primary-50 rounded border border-primary-100">
                    <div>
                      <p className="text-body-sm font-medium text-neutral-900">{template.influencer_name} Style</p>
                      <p className="text-caption text-neutral-500">{template.style.pacing} pacing • {template.style.activeVoice}% active voice</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ArchetypeEvolutionDialog
        open={showEvolution}
        onOpenChange={setShowEvolution}
        currentArchetype={positioning?.personal_archetype || ''}
        onEvolve={handleEvolve}
      />

      <InfluencerDNAAnalyzer
        open={showDNAAnalyzer}
        onOpenChange={setShowDNAAnalyzer}
        onSave={saveInfluencerTemplate}
      />
    </div>
  );
}