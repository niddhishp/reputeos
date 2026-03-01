'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Shield, Eye, EyeOff, ArrowRight, Check, UserCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const SYNE = "'Syne', system-ui, sans-serif";
const MONO = "'DM Mono', monospace";

type Tab = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

const MODE_OPTIONS = [
  {
    value: 'individual',
    icon: UserCircle,
    title: 'Managing my own reputation',
    desc: 'One profile — mine. Perfect to start.',
    badge: 'Most popular',
  },
  {
    value: 'consultant',
    icon: Users,
    title: 'Managing clients',
    desc: "Consultant or agency managing multiple people's reputations.",
    badge: null,
  },
];

export function AuthModal({ isOpen, onClose, defaultTab = 'signup' }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [step, setStep] = useState<1 | 2>(1); // signup only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', mode: 'individual' });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setStep(1);
      setError('');
      setForm({ name: '', email: '', password: '', mode: 'individual' });
    }
  }, [isOpen, defaultTab]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onClose();
    router.push('/dashboard/clients');
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: form.mode, plan: 'individual' },
      },
    });
    if (err) { setError(err.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        name: form.name,
        role: form.mode,
        plan: 'individual',
      });
    }
    setLoading(false);
    onClose();
    router.push('/dashboard/clients');
    router.refresh();
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');`}</style>

      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          fontFamily: SYNE,
        }}
      >
        {/* Modal */}
        <div style={{
          width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto',
          backgroundColor: '#0D1220',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          position: 'relative',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, zIndex: 1 }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>

          {/* Header */}
          <div style={{ padding: '28px 28px 0' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <Shield style={{ width: 18, height: 18, color: '#C9A84C' }} />
              <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>ReputeOS</span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 28 }}>
              {(['signup', 'login'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setStep(1); setError(''); }}
                  style={{
                    flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                    paddingBottom: 12, fontSize: 14, fontWeight: 700, fontFamily: SYNE,
                    color: tab === t ? 'white' : 'rgba(255,255,255,0.3)',
                    borderBottom: tab === t ? '2px solid #C9A84C' : '2px solid transparent',
                    marginBottom: -1,
                    textAlign: 'center',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t === 'signup' ? 'Create account' : 'Sign in'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '0 28px 28px' }}>

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 24 }}>
                  Welcome back
                </p>
                <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" placeholder="you@company.com" />
                <Field
                  label="Password"
                  value={form.password}
                  onChange={v => set('password', v)}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  rightEl={
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                      {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                    </button>
                  }
                />
                {error && <ErrorBox message={error} />}
                <SubmitBtn loading={loading} label="Sign in" />
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16 }}>
                  No account?{' '}
                  <button type="button" onClick={() => setTab('signup')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9A84C', fontSize: 12, fontFamily: SYNE, fontWeight: 600, padding: 0 }}>
                    Start free trial
                  </button>
                </p>
              </form>
            )}

            {/* ── SIGNUP ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup}>
                {step === 1 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <StepDot n={1} active />
                      <div style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                      <StepDot n={2} active={false} />
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                      Create your account
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
                      14-day free trial. No credit card.
                    </p>
                    <Field label="Full name" value={form.name} onChange={v => set('name', v)} placeholder="Rajiv Mehta" required />
                    <Field label="Work email" value={form.email} onChange={v => set('email', v)} type="email" placeholder="rajiv@company.com" required />
                    <Field
                      label="Password"
                      value={form.password}
                      onChange={v => set('password', v)}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      required
                      rightEl={
                        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0 }}>
                          {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                        </button>
                      }
                    />
                    <SubmitBtn loading={false} label="Continue" icon={<ArrowRight style={{ width: 15, height: 15 }} />} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16 }}>
                      Already have an account?{' '}
                      <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9A84C', fontSize: 12, fontFamily: SYNE, fontWeight: 600, padding: 0 }}>
                        Sign in
                      </button>
                    </p>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <StepDot n={1} active done />
                      <div style={{ width: 24, height: 1, backgroundColor: '#C9A84C', opacity: 0.4 }} />
                      <StepDot n={2} active />
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                      How will you use ReputeOS?
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
                      You can change this later in Settings.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                      {MODE_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const selected = form.mode === opt.value;
                        return (
                          <button
                            key={opt.value} type="button"
                            onClick={() => set('mode', opt.value)}
                            style={{
                              textAlign: 'left', padding: '14px 16px', borderRadius: 12,
                              border: `1px solid ${selected ? '#C9A84C' : 'rgba(255,255,255,0.07)'}`,
                              backgroundColor: selected ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.015)',
                              cursor: 'pointer', fontFamily: SYNE, position: 'relative',
                            }}
                          >
                            {opt.badge && (
                              <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: MONO, fontSize: 9, color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {opt.badge}
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon style={{ width: 16, height: 16, color: selected ? '#C9A84C' : 'rgba(255,255,255,0.3)' }} />
                              </div>
                              <div>
                                <p style={{ fontWeight: 700, color: selected ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 3 }}>{opt.title}</p>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{opt.desc}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {error && <ErrorBox message={error} />}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ flex: '0 0 auto', padding: '13px 18px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontWeight: 600, borderRadius: 10, fontSize: 14, border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontFamily: SYNE }}>
                        Back
                      </button>
                      <SubmitBtn loading={loading} label="Start free trial →" fullWidth />
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder, required, rightEl }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 7, fontFamily: SYNE }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          type={type}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%', padding: '12px 14px', paddingRight: rightEl ? 40 : 14,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, color: 'white', fontSize: 14,
            fontFamily: SYNE, boxSizing: 'border-box', outline: 'none',
          }}
        />
        {rightEl}
      </div>
    </div>
  );
}

function StepDot({ n, active, done }: { n: number; active: boolean; done?: boolean }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, fontFamily: MONO,
      backgroundColor: active ? '#C9A84C' : 'rgba(255,255,255,0.06)',
      color: active ? '#080C14' : 'rgba(255,255,255,0.2)',
    }}>
      {done ? <Check style={{ width: 11, height: 11 }} /> : n}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 14 }}>
      {message}
    </div>
  );
}

function SubmitBtn({ loading, label, icon, fullWidth }: { loading: boolean; label: string; icon?: React.ReactNode; fullWidth?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: fullWidth !== false ? '100%' : undefined,
        flex: fullWidth ? 1 : undefined,
        padding: '13px 0', backgroundColor: '#C9A84C',
        color: '#080C14', fontWeight: 700, borderRadius: 10, fontSize: 14,
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: SYNE, opacity: loading ? 0.7 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
    >
      {loading ? 'Please wait…' : label}
      {!loading && icon}
    </button>
  );
}
