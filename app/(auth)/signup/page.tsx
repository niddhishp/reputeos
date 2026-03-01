// app/(auth)/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Building2, ArrowRight, Shield, UserCircle, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';

const roleOptions = [
  {
    value: 'individual',
    icon: UserCircle,
    label: 'Managing my own reputation',
    desc: 'I want to build and protect my personal brand',
  },
  {
    value: 'consultant',
    icon: Users,
    label: 'Managing clients',
    desc: "I'm a consultant managing multiple people's reputations",
  },
];

export default function SignupPage() {
  const router = useRouter();
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
    role: 'individual',
    plan: 'solo',
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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

      router.push('/dashboard/clients');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
              {step === 1 ? 'Account Details' : 'Tell us about yourself'}
            </CardTitle>
          </CardHeader>

          <form
            onSubmit={
              step === 1
                ? (e) => { e.preventDefault(); setStep(2); }
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
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => update('email', e.target.value)}
                        className="pl-10"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={(e) => update('password', e.target.value)}
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => update('name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Company (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="company">Company <span className="text-neutral-400">(optional)</span></Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input
                        id="company"
                        placeholder="Acme Inc"
                        value={formData.company}
                        onChange={(e) => update('company', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Role — primary product decision */}
                  <div className="space-y-2">
                    <Label>How will you use ReputeOS?</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {roleOptions.map((option) => {
                        const Icon = option.icon;
                        const selected = formData.role === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => update('role', option.value)}
                            className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                              selected
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            <Icon className={`h-6 w-6 shrink-0 ${selected ? 'text-blue-600' : 'text-neutral-400'}`} />
                            <div>
                              <p className={`text-sm font-medium ${selected ? 'text-blue-900' : 'text-neutral-900'}`}>
                                {option.label}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">{option.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
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
                <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
                  {isLoading ? 'Creating account…' : step === 1 ? (
                    <> Continue <ArrowRight className="ml-2 h-4 w-4" /> </>
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
