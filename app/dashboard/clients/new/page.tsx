'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Hash, Check, Linkedin, Twitter, Instagram, Youtube, BookOpen, Mic } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const INDUSTRIES = ['Technology', 'Finance & Banking', 'Private Equity / VC', 'Real Estate', 'Healthcare', 'Energy & Climate', 'Manufacturing', 'Media & Entertainment', 'Legal', 'Consulting', 'Education', 'Government / Policy', 'FMCG / Retail', 'Other'];

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',        icon: Linkedin,  placeholder: 'https://linkedin.com/in/your-name',      required: true  },
  { id: 'twitter',   label: 'X / Twitter',      icon: Twitter,   placeholder: 'https://x.com/yourhandle',               required: false },
  { id: 'instagram', label: 'Instagram',        icon: Instagram, placeholder: 'https://instagram.com/yourhandle',       required: false },
  { id: 'youtube',   label: 'YouTube',          icon: Youtube,   placeholder: 'https://youtube.com/@yourchannel',       required: false },
  { id: 'medium',    label: 'Medium / Substack',icon: BookOpen,  placeholder: 'https://medium.com/@yourhandle',         required: false },
  { id: 'podcast',   label: 'Podcast',          icon: Mic,       placeholder: 'https://yourpodcast.com or show name',   required: false },
];

interface FormData {
  name: string; role: string; company: string; industry: string;
  linkedin_url: string;
  social_urls: Record<string, string>;
  platforms: string[];
  keywords: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    name: '', role: '', company: '', industry: '',
    linkedin_url: '',
    social_urls: {},
    platforms: ['linkedin'],
    keywords: '',
  });

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const togglePlatform = (id: string) => {
    if (id === 'linkedin') return;
    const isActive = form.platforms.includes(id);
    set('platforms', isActive ? form.platforms.filter(p => p !== id) : [...form.platforms, id]);
    if (isActive) {
      // Remove URL when deactivating
      const next = { ...form.social_urls };
      delete next[id];
      set('social_urls', next);
    }
  };

  const setSocialUrl = (id: string, url: string) => {
    set('social_urls', { ...form.social_urls, [id]: url });
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

    // Build social_links JSON from URLs
    const social_links: Record<string, string> = { linkedin: form.linkedin_url.trim() };
    form.platforms.forEach(pid => {
      if (pid !== 'linkedin' && form.social_urls[pid]) {
        social_links[pid] = form.social_urls[pid].trim();
      }
    });

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
    }).select().single();

    if (insertError) { setError(insertError.message); setLoading(false); return; }
    router.push(`/dashboard/clients/${data.id}/discover`);
  }

  const accent = '#C9A84C';
  const font = "'Inter', system-ui, sans-serif";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080C14', color: 'white', fontFamily: font }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px' }}>

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
              <p style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Step 1 of {TOTAL_STEPS}</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Basic information</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Tell us who this profile is for. Name and industry are required.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Field label="Full name" required accent={accent}>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Rajiv Mehta" style={inputStyle(font)} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Current title / role" accent={accent}>
                  <input value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. Chief Executive Officer" style={inputStyle(font)} />
                </Field>
                <Field label="Company / Organisation" accent={accent}>
                  <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Tata Group" style={inputStyle(font)} />
                </Field>
              </div>
              <Field label="Industry" required accent={accent}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INDUSTRIES.map(ind => (
                    <button key={ind} type="button" onClick={() => set('industry', ind)}
                      style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${form.industry === ind ? accent : 'rgba(255,255,255,0.08)'}`, backgroundColor: form.industry === ind ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)', color: form.industry === ind ? accent : 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: font }}>
                      {ind}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 — Digital presence */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Step 2 of {TOTAL_STEPS}</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Digital presence</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>LinkedIn is required — it powers the Discovery scan. Toggle other platforms to add their URLs.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* LinkedIn always visible */}
              <div style={{ border: `1px solid ${accent}40`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: 'rgba(201,168,76,0.05)' }}>
                  <Linkedin style={{ width: 16, height: 16, color: '#0a66c2', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white', flex: 1 }}>LinkedIn</span>
                  <span style={{ fontSize: 11, color: accent, backgroundColor: 'rgba(201,168,76,0.12)', padding: '2px 8px', borderRadius: 20 }}>Required</span>
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(201,168,76,0.12)' }}>
                  <input
                    value={form.linkedin_url}
                    onChange={e => set('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/your-name"
                    style={{ ...inputStyle(font), borderColor: 'rgba(201,168,76,0.2)' }}
                  />
                </div>
              </div>

              {/* Other platforms — toggle to expand URL input */}
              {PLATFORMS.filter(p => !p.required).map(p => {
                const Icon = p.icon;
                const active = form.platforms.includes(p.id);
                return (
                  <div key={p.id} style={{ border: `1px solid ${active ? accent + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button type="button" onClick={() => togglePlatform(p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', backgroundColor: active ? 'rgba(201,168,76,0.04)' : 'rgba(255,255,255,0.01)', width: '100%', cursor: 'pointer', border: 'none' }}>
                      <Icon style={{ width: 16, height: 16, color: active ? accent : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: active ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400, flex: 1, textAlign: 'left', fontFamily: font }}>{p.label}</span>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${active ? accent : 'rgba(255,255,255,0.15)'}`, backgroundColor: active ? 'rgba(201,168,76,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {active && <Check style={{ width: 12, height: 12, color: accent }} />}
                      </div>
                    </button>
                    {/* URL input — slides open when active */}
                    {active && (
                      <div style={{ padding: '12px 16px', borderTop: `1px solid ${accent}20` }}>
                        <input
                          value={form.social_urls[p.id] || ''}
                          onChange={e => setSocialUrl(p.id, e.target.value)}
                          placeholder={p.placeholder}
                          style={{ ...inputStyle(font), borderColor: 'rgba(201,168,76,0.2)' }}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Keywords */}
              <div style={{ marginTop: 4 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Hash style={{ width: 13, height: 13 }} /> Keywords / topics
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>Comma-separated terms this person is known for</span>
                </label>
                <textarea value={form.keywords} onChange={e => set('keywords', e.target.value)} placeholder="renewable energy, sustainability, clean tech, ESG" rows={2}
                  style={{ ...inputStyle(font), resize: 'vertical' as const }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Step 3 of {TOTAL_STEPS}</p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>Review & launch</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Everything looks good? Confirming will kick off the Discovery scan automatically.</p>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
              {[
                { label: 'Name',     value: form.name },
                { label: 'Role',     value: form.role || '—' },
                { label: 'Company',  value: form.company || '—' },
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
                <strong style={{ color: accent }}>After this:</strong> You will land on the Discovery page where a scan will run across 50+ sources using the LinkedIn URL and keywords provided. This takes 2–5 minutes.
              </p>
            </div>

            {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>{error}</div>}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => (s - 1) as 1|2)}
              style={{ padding: '13px 20px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderRadius: 10, fontSize: 15, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', fontFamily: font, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button type="button" disabled={!canNext()} onClick={() => setStep(s => (s + 1) as 2|3)}
              style={{ flex: 1, padding: '13px 0', backgroundColor: canNext() ? accent : 'rgba(255,255,255,0.06)', color: canNext() ? '#080C14' : 'rgba(255,255,255,0.2)', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: canNext() ? 'pointer' : 'not-allowed', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              Continue <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={handleSubmit}
              style={{ flex: 1, padding: '13px 0', backgroundColor: accent, color: '#080C14', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: font, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating profile...' : 'Create & Start Discovery →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function inputStyle(font: string): React.CSSProperties {
  return { width: '100%', padding: '12px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: font, boxSizing: 'border-box' as const };
}

function Field({ label, required, accent, children }: { label: string; required?: boolean; accent: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>
        {label} {required && <span style={{ color: accent }}>*</span>}
      </label>
      {children}
    </div>
  );
}
