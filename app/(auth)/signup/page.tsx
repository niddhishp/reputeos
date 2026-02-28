// app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    role: 'consultant',
    plan: 'solo',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company: formData.company,
            role: formData.role,
            plan: formData.plan,
          },
        },
      });

      if (signUpError) throw signUpError;

      toast({
        title: 'Account created',
        description:
          'Welcome to ReputeOS! Check your email to verify your account.',
      });

      router.push('/clients');
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
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
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-neutral-900">ReputeOS</h1>
          </div>
          <p className="text-neutral-600">Create your account</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-neutral-500">Step {step} of 2</span>
            </div>
            <Progress value={step === 1 ? 50 : 100} className="h-1" />
            <CardTitle className="mt-4">
              {step === 1 ? 'Account Details' : 'Profile Setup'}
            </CardTitle>
          </CardHeader>

          <form
            onSubmit={
              step === 1
                ? (e) => {
                    e.preventDefault();
                    setStep(2);
                  }
                : handleSignup
            }
          >
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
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
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
                      autoComplete="new-password"
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
                          <RadioGroupItem value={plan} id={plan} className="peer sr-only" />
                          <Label
                            htmlFor={plan}
                            className="flex flex-col items-center rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                          >
                            <span className="text-sm font-semibold capitalize">{plan}</span>
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
                      {[
                        { value: 'consultant', label: 'Consultant', desc: 'Full platform access' },
                        { value: 'client_view', label: 'Client View', desc: 'Read-only access' },
                      ].map((r) => (
                        <div key={r.value}>
                          <RadioGroupItem value={r.value} id={r.value} className="peer sr-only" />
                          <Label
                            htmlFor={r.value}
                            className="flex flex-col items-center rounded-md border-2 border-muted p-4 hover:bg-muted peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
                          >
                            <span className="text-sm font-semibold">{r.label}</span>
                            <span className="text-xs text-neutral-500 mt-1">{r.desc}</span>
                          </Label>
                        </div>
                      ))}
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
                    'Creating account…'
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

              <p className="text-sm text-neutral-600 text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
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
