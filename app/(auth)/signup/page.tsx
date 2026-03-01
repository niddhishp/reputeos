'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, UserCircle, Users, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const MODE_OPTIONS = [
  {
    value: 'individual',
    icon: UserCircle,
    title: 'Managing my own reputation',
    desc: 'I want to build and protect my personal brand. One profile — mine.',
    badge: 'Most popular',
  },
  {
    value: 'consultant',
    icon: Users,
    title: 'Managing clients',
    desc: "I'm a consultant, PR professional, or agency managing multiple people's reputations.",
    badge: null,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', mode: 'individual' });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: form.mode, plan: form.mode === 'individual' ? 'individual' : 'solo' },
      },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    if (data.user) {
      // Insert user profile
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        name: form.name,
        role: form.mode,
        plan: form.mode === 'individual' ? 'individual' : 'solo',
      });
    }

    router.push('/dashboard/clients');
  }

  const syne = "'Syne', system-ui, sans-serif";
  const mono = "'DM Mono', monospace";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080C14', display: 'flex', fontFamily: syne }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');`}</style>

      {/* Left panel — branding */}
      <div style={{ width: '42%', minHeight: '100vh', backgroundColor: '#0a0f1a', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '48px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 'auto' }}>
          <Shield style={{ width: 20, height: 20, color: '#C9A84C' }} />
          <span style={{ fontWeight: 700, color: 'white' }}>ReputeOS</span>
        </Link>
        <div style={{ marginBottom: 'auto', paddingTop: 80 }}>
          <p style={{ fontFamily: mono, fontSize: 11, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>What you get</p>
          {['Your LSI score in 14 days', '54-archetype positioning system', 'AI content engineered to your identity', 'Statistical proof of improvement', 'Crisis monitoring & alerts'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check style={{ width: 10, height: 10, color: '#C9A84C' }} />
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>{f}</span>
            </div>
          ))}
          <div style={{ marginTop: 48, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
              &quot;I had never thought about my reputation as a number. The LSI score made it real — and fixable.&quot;
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>— Managing Partner, PE Firm · LSI 42 → 84</p>
          </div>
        </div>
        <p style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>14-day free trial · No credit card</p>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, backgroundColor: step >= s ? '#C9A84C' : 'rgba(255,255,255,0.06)', color: step >= s ? '#080C14' : 'rgba(255,255,255,0.25)' }}>{s < step ? <Check style={{ width: 12, height: 12 }} /> : s}</div>
                <span style={{ fontFamily: mono, fontSize: 11, color: step === s ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{s === 1 ? 'Your account' : 'How you use it'}</span>
                {s < 2 && <div style={{ width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>Create your account</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>Start your 14-day free trial. No credit card required.</p>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Full name</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Rajiv Mehta" style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Work email</label>
                  <input value={form.email} onChange={e => set('email', e.target.value)} required type="email" placeholder="rajiv@company.com" style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ marginBottom: 28, position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Password</label>
                  <input value={form.password} onChange={e => set('password', e.target.value)} required type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" style={{ width: '100%', padding: '12px 44px 12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box', outline: 'none' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}>{showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}</button>
                </div>

                <button type="submit" style={{ width: '100%', padding: '14px 0', backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: syne, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Continue <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>How will you use ReputeOS?</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>This sets up your dashboard. You can always change it later in Settings.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {MODE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const selected = form.mode === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => set('mode', opt.value)} style={{ textAlign: 'left', padding: 20, borderRadius: 12, border: `1px solid ${selected ? '#C9A84C' : 'rgba(255,255,255,0.07)'}`, backgroundColor: selected ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.015)', cursor: 'pointer', fontFamily: syne, position: 'relative' }}>
                        {opt.badge && <span style={{ position: 'absolute', top: 12, right: 12, fontFamily: mono, fontSize: 10, color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{opt.badge}</span>}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: selected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon style={{ width: 18, height: 18, color: selected ? '#C9A84C' : 'rgba(255,255,255,0.3)' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: selected ? 'white' : 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 4 }}>{opt.title}</p>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>{opt.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>{error}</div>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStep(1)} style={{ flex: '0 0 auto', padding: '14px 20px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderRadius: 10, fontSize: 15, border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontFamily: syne }}>Back</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '14px 0', backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: syne, opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Creating account...' : 'Start free trial →'}
                  </button>
                </div>
              </>
            )}
          </form>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
