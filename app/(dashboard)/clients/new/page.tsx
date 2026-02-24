// app/(dashboard)/clients/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, User, Briefcase, Link as LinkIcon, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const INDUSTRIES = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Consulting',
  'Real Estate',
  'Energy',
  'Conglomerate',
  'Other',
];

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    industry: '',
    linkedinUrl: '',
    websiteUrl: '',
    bio: '',
    keywords: '',
    targetLSI: '75',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call to create client
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Client created",
        description: `${formData.name} has been added to your portfolio.`
      });

      router.push('/clients');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.name && formData.company && formData.role && formData.industry;
  const isStep2Valid = formData.linkedinUrl;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Button>

      <div className="mb-8">
        <h1 className="text-heading-lg text-neutral-900">Add New Client</h1>
        <p className="text-body text-neutral-600 mt-2">
          Set up a new reputation engineering engagement
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-neutral-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-neutral-200'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary-500' : 'bg-neutral-200'}`} />
        </div>
        <div className="flex justify-between text-caption text-neutral-500">
          <span>Basic Info</span>
          <span>Online Presence</span>
          <span>Goals</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary-600" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>Who is this reputation engagement for?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Ananya Birla"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company/Organization *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          id="company"
                          placeholder="e.g., Svatantra Microfin"
                          value={formData.company}
                          onChange={(e) => updateField('company', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role/Title *</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                          id="role"
                          placeholder="e.g., Founder & CEO"
                          value={formData.role}
                          onChange={(e) => updateField('role', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select value={formData.industry} onValueChange={(v) => updateField('industry', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Brief Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Key background information, achievements, areas of expertise..."
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end mt-6">
                <Button 
                  type="button" 
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-primary-600" />
                    Online Presence
                  </CardTitle>
                  <CardDescription>Where can we find their digital footprint?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn Profile URL *</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedinUrl}
                      onChange={(e) => updateField('linkedinUrl', e.target.value)}
                      required
                    />
                    <p className="text-caption text-neutral-500">
                      Used for discovery scanning and content analysis
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Company/Personal Website</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://..."
                      value={formData.websiteUrl}
                      onChange={(e) => updateField('websiteUrl', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Key Topics/Keywords</Label>
                    <Textarea
                      id="keywords"
                      placeholder="e.g., microfinance, financial inclusion, women empowerment, rural development..."
                      value={formData.keywords}
                      onChange={(e) => updateField('keywords', e.target.value)}
                      rows={3}
                    />
                    <p className="text-caption text-neutral-500">
                      Comma-separated keywords for content and monitoring
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setStep(3)}
                  disabled={!isStep2Valid}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-600" />
                    Engagement Goals
                  </CardTitle>
                  <CardDescription>What are we aiming to achieve?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetLSI">Target LSI Score</Label>
                    <Select value={formData.targetLSI} onValueChange={(v) => updateField('targetLSI', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="65">65 - Functional Legitimacy</SelectItem>
                        <SelectItem value="75">75 - Strong Authority (Recommended)</SelectItem>
                        <SelectItem value="85">85 - Elite Authority</SelectItem>
                        <SelectItem value="90">90 - Industry Leader</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-caption text-neutral-500">
                      Based on current baseline and industry benchmarks
                    </p>
                  </div>

                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                    <h4 className="text-body-sm font-semibold text-primary-900 mb-2">Recommended First Steps</h4>
                    <ul className="space-y-2 text-body-sm text-primary-800">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600">1.</span>
                        Run DISCOVER scan to establish baseline
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600">2.</span>
                        Complete DIAGNOSE for LSI scoring
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-600">3.</span>
                        Lock POSITION for strategic foundation
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? 'Creating...' : 'Create Client & Start Discovery'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

import { AnimatePresence } from 'framer-motion';