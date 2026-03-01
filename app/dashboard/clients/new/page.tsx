'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, UserCircle, Linkedin, Globe, Building2, Briefcase, Hash, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const INDUSTRIES = ['Technology', 'Finance & Banking', 'Private Equity / VC', 'Real Estate', 'Healthcare', 'Energy & Climate', 'Manufacturing', 'Media & Entertainment', 'Legal', 'Consulting', 'Education', 'Government / Policy', 'FMCG / Retail', 'Other'];
const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', required: true },
  { id: 'twitter', label: 'X / Twitter', required: false },
  { id: 'instagram', label: 'Instagram', required: false },
  { id: 'youtube', label: 'YouTube', required: false },
  { id: 'medium', label: 'Medium / Substack', required: false },
  { id: 'podcast', label: 'Podcast', required: false },
];

interface FormData {
  name: string; role: string; company: string; industry: string;
  linkedin_url: string; twitter_url: string; keywords: string;
  platforms: string[]; is_self_profile: boolean;
}

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    name: '', role: '', company: '', industry: '',
    linkedin_url: '', twitter_url: '', keywords: '',
    platforms: ['linkedin'], is_self_profile: false,
  });

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }));
  const togglePlatform = (id: string) => {
    if (id === 'linkedin') return; // always required
    set('platforms', form.platforms.includes(id) ? form.platforms.filter(p => p !== id) : [...form.platforms, id]);
  };

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0 && form.industry.length > 0;
    if (step === 2) return form.linkedin_url.trim().length > 0;
    return true;
  };

  async function handleSubmit() {
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const { data, error: insertError } = await supabase.from('clients').insert({
      user_id: user.id,
      name: form.name.trim(),
      role: form.role.trim() || null,
      company: form.company.trim() || null,
      industry: form.industry || null,
      linkedin_url: form.linkedin_url.trim() || null,
      keywords: keywords.length > 0 ? keywords : null,
      status: 'active',
      target_lsi: 75,
      is_self_profile: form.is_self_profile,
    }).select().single();

    if (insertError) { setError(insertError.message); setLoading(false); return; }
    router.push(`/dashboard/clients/${data.id}/discover`);
  }

  const accent = '#C9A84C';
  const syne = "'Inter', system-ui, sans-serif";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080C14', color: 'white', fontFamily: syne }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');.mono{font-family:'DM Mono',monospace}input:focus,textarea:focus{border-color:${accent}!important;outline:none}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}`}</style>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>

        {/* Back */}
        <Link href="/dashboard/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 36 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Back to dashboard
        </Link>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < step ? accent : 'rgba(255,255,255,0.07)', transition: 'background-color 0.3s' }} />
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p className="mono" style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of {TOTAL_STEPS}</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Basic information</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Tell us who this profile is for. All fields except name and industry are optional.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Full name <span style={{ color: accent }}>*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajiv Mehta" style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Current title / role</label>
                  <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Chief Executive Officer" style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Company / Organisation</label>
                  <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Tata Group" style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Industry <span style={{ color: accent }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INDUSTRIES.map(ind => (
                    <button key={ind} type="button" onClick={() => set('industry', ind)} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${form.industry === ind ? accent : 'rgba(255,255,255,0.08)'}`, backgroundColor: form.industry === ind ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)', color: form.industry === ind ? accent : 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: syne }}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Digital presence */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p className="mono" style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of {TOTAL_STEPS}</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Digital presence</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>LinkedIn is required — it is the primary source for the Discovery scan. Other platforms are optional but improve accuracy.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                  <Linkedin style={{ width: 14, height: 14, color: '#0a66c2' }} /> LinkedIn URL <span style={{ color: accent }}>*</span>
                </label>
                <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/rajiv-mehta" style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>Active platforms</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PLATFORMS.map(p => {
                    const active = form.platforms.includes(p.id);
                    return (
                      <button key={p.id} type="button" onClick={() => togglePlatform(p.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: `1px solid ${active ? accent + '40' : 'rgba(255,255,255,0.07)'}`, backgroundColor: active ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.01)', cursor: p.required ? 'default' : 'pointer', fontFamily: syne }}>
                        <span style={{ fontSize: 14, color: active ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400 }}>{p.label} {p.required && <span style={{ fontSize: 11, color: accent }}>(required)</span>}</span>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${active ? accent : 'rgba(255,255,255,0.15)'}`, backgroundColor: active ? 'rgba(201,168,76,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {active && <Check style={{ width: 11, height: 11, color: accent }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Hash style={{ width: 13, height: 13 }} /> Keywords / topics
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>Enter terms this person is known for or wants to be known for, separated by commas</span>
                </label>
                <textarea value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="renewable energy, sustainability, clean tech, ESG" rows={2} style={{ width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: syne, boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p className="mono" style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of {TOTAL_STEPS}</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Review & launch</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Everything looks good? Once you confirm, we will kick off the Discovery scan automatically.</p>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
              {[
                { label: 'Name', value: form.name },
                { label: 'Role', value: form.role || '—' },
                { label: 'Company', value: form.company || '—' },
                { label: 'Industry', value: form.industry },
                { label: 'LinkedIn', value: form.linkedin_url },
                { label: 'Platforms', value: form.platforms.join(', ') },
                { label: 'Keywords', value: form.keywords || '—' },
              ].map((row, i) => (
                <div key={row.label} style={{ display: 'flex', gap: 16, padding: '14px 20px', backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', width: 80, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: 'rgba(201,168,76,0.7)', lineHeight: 1.6 }}>
                <strong style={{ color: accent }}>After this:</strong> You will land on the Discovery page where a scan will run automatically across 50+ sources using the LinkedIn URL and keywords you provided. This takes 2–5 minutes.
              </p>
            </div>

            {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>{error}</div>}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => (s - 1) as 1|2)} style={{ padding: '13px 20px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderRadius: 10, fontSize: 15, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', fontFamily: syne, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" disabled={!canNext()} onClick={() => setStep(s => (s + 1) as 2|3)} style={{ flex: 1, padding: '13px 0', backgroundColor: canNext() ? accent : 'rgba(255,255,255,0.06)', color: canNext() ? '#080C14' : 'rgba(255,255,255,0.2)', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed', fontFamily: syne, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Continue <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={handleSubmit} style={{ flex: 1, padding: '13px 0', backgroundColor: accent, color: '#080C14', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: syne, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating profile...' : 'Create & Start Discovery →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
