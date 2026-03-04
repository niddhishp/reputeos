'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD = '#C9A84C';
const BG   = '#080C14';

export default function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const from = searchParams.get('from');
      router.push(from && from.startsWith('/') ? from : '/dashboard/clients');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: BG, fontFamily: "'Inter', system-ui, sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `${GOLD}18`, border: `1px solid ${GOLD}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Shield style={{ width: 24, height: 24, color: GOLD }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            ReputeOS
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            Strategic Reputation Engineering
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '36px 32px',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 24px' }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              color: '#f87171', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.2)' }} />
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{
                    width: '100%', padding: '11px 12px 11px 38px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                    transition: 'border-color 150ms',
                  }}
                  onFocus={e => (e.target.style.borderColor = `${GOLD}60`)}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.2)' }} />
                <input
                  type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 40px 11px 38px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                    transition: 'border-color 150ms',
                  }}
                  onFocus={e => (e.target.style.borderColor = `${GOLD}60`)}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', padding: 0, display: 'flex' }}
                >
                  {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 8, border: 'none',
                background: loading ? `${GOLD}60` : GOLD,
                color: '#080C14', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              {loading ? 'Signing in…' : <><span>Sign In</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20, marginBottom: 0 }}>
            No account?{' '}
            <Link href="/signup" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>
          Enterprise-grade encryption. Your data never leaves your control.
        </p>
      </div>
    </div>
  );
}
