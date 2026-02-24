// app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    role: 'consultant',
    plan: 'solo'
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClientComponentClient();
      
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company: formData.company,
            role: formData.role,
            plan: formData.plan
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      toast({
        title: "Account created",
        description: "Welcome to PersonaOS! Check your email to verify your account."
      });

      router.push('/dashboard');
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-display-md font-bold text-neutral-900">PersonaOS</h1>
          <p className="text-body text-neutral-600 mt-2">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-neutral-500">Step {step} of 2</span>
            </div>
            <Progress value={step === 1 ? 50 : 100} className="h-1" />
            <CardTitle className="text-heading-lg mt-4">
              {step === 1 ? 'Account Details' : 'Profile Setup'}
            </CardTitle>
          </CardHeader>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSignup}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="pl-10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <RadioGroup 
                      value={formData.plan} 
                      onValueChange={(v) => updateField('plan', v)}
                      className="grid grid-cols-3 gap-3"
                    >
                      {['solo', 'agency', 'enterprise'].map((plan) => (
                        <div key={plan}>
                          <RadioGroupItem
                            value={plan}
                            id={plan}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={plan}
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary-500 peer-data-[state=checked]:bg-primary-50 [&:has([data-state=checked])]:border-primary-500 cursor-pointer"
                          >
                            <span className="text-body-sm font-semibold capitalize">{plan}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="company"
                        placeholder="Acme Inc"
                        value={formData.company}
                        onChange={(e) => updateField('company', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RadioGroup 
                      value={formData.role} 
                      onValueChange={(v) => updateField('role', v)}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div>
                        <RadioGroupItem
                          value="consultant"
                          id="consultant"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="consultant"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary-500 peer-data-[state=checked]:bg-primary-50 [&:has([data-state=checked])]:border-primary-500 cursor-pointer"
                        >
                          <span className="text-body-sm font-semibold">Consultant</span>
                          <span className="text-caption text-neutral-500">Full platform access</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="client_view"
                          id="client_view"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="client_view"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-muted peer-data-[state=checked]:border-primary-500 peer-data-[state=checked]:bg-primary-50 [&:has([data-state=checked])]:border-primary-500 cursor-pointer"
                        >
                          <span className="text-body-sm font-semibold">Client View</span>
                          <span className="text-caption text-neutral-500">Read-only access</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <div className="flex gap-3 w-full">
                {step === 2 && (
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="flex-1"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Creating account...'
                  ) : step === 1 ? (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>

              <p className="text-body-sm text-neutral-600 text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

import { Progress } from '@/components/ui/progress';