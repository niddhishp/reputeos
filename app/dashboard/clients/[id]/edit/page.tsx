'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Linkedin, Twitter, Instagram, Youtube, BookOpen, Mic, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Private Equity / VC', 'Real Estate',
  'Healthcare', 'Energy & Climate', 'Manufacturing', 'Media & Entertainment',
  'Legal', 'Consulting', 'Education', 'Government / Policy', 'FMCG / Retail', 'Other',
];

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn',         icon: Linkedin,  placeholder: 'https://linkedin.com/in/your-name',    required: true  },
  { id: 'twitter',   label: 'X / Twitter',       icon: Twitter,   placeholder: 'https://x.com/yourhandle',            required: false },
  { id: 'instagram', label: 'Instagram',         icon: Instagram, placeholder: 'https://instagram.com/yourhandle',    required: false },
  { id: 'youtube',   label: 'YouTube',           icon: Youtube,   placeholder: 'https://youtube.com/@yourchannel',    required: false },
  { id: 'medium',    label: 'Medium / Substack', icon: BookOpen,  placeholder: 'https://medium.com/@yourhandle',      required: false },
  { id: 'podcast',   label: 'Podcast',           icon: Mic,       placeholder: 'https://yourpodcast.com',             required: false },
];

interface FormData {
  name: string;
  role: string;
  company: string;
  industry: string;
  linkedin_url: string;
  social_urls: Record<string, string>;
  platforms: string[];
  keywords: string;
  bio: string;
  target_lsi: number;
}

const accent = '#C9A84C';
const bg = '#080C14';
const cardBg = '#0d1117';
const border = 'rgba(201,168,76,0.15)';
const font = "'Inter', system-ui, sans-serif";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasExistingScans, setHasExistingScans] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: '', role: '', company: '', industry: '',
    linkedin_url: '', social_urls: {}, platforms: ['linkedin'],
    keywords: '', bio: '', target_lsi: 75,
  });

  useEffect(() => {
    async function loadClient() {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        setError('Client not found');
        setLoading(false);
        return;
      }

      // Check for existing scans
      const { count } = await supabase
        .from('discover_runs')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'completed');

      setHasExistingScans((count ?? 0) > 0);

      // Reconstruct social_urls from stored data
      const socialLinks: Record<string, string> = client.social_links ?? {};
      const activePlatforms = ['linkedin', ...Object.keys(socialLinks).filter(k => k !== 'linkedin' && socialLinks[k])];

      setForm({
        name: client.name ?? '',
        role: client.role ?? '',
        company: client.company ?? '',
        industry: client.industry ?? '',
        linkedin_url: client.linkedin_url ?? socialLinks.linkedin ?? '',
        social_urls: Object.fromEntries(
          Object.entries(socialLinks).filter(([k]) => k !== 'linkedin')
        ),
        platforms: activePlatforms,
        keywords: (client.keywords ?? []).join(', '),
        bio: client.bio ?? '',
        target_lsi: client.target_lsi ?? 75,
      });

      setLoading(false);
    }

    loadClient();
  }, [clientId]);

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const togglePlatform = (id: string) => {
    if (id === 'linkedin') return;
    const isActive = form.platforms.includes(id);
    set('platforms', isActive ? form.platforms.filter(p => p !== id) : [...form.platforms, id]);
    if (isActive) {
      const next = { ...form.social_urls };
      delete next[id];
      set('social_urls', next);
    }
  };

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    setSuccess(false);

    const keywords = form.keywords.split(',').map(k => k.trim()).filter(Boolean);

    const social_links: Record<string, string> = { linkedin: form.linkedin_url.trim() };
    form.platforms.forEach(pid => {
      if (pid !== 'linkedin' && form.social_urls[pid]?.trim()) {
        social_links[pid] = form.social_urls[pid].trim();
      }
    });

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        name: form.name.trim(),
        role: form.role.trim() || null,
        company: form.company.trim() || null,
        industry: form.industry || null,
        linkedin_url: form.linkedin_url.trim() || null,
        social_links,
        keywords: keywords.length > 0 ? keywords : null,
        bio: form.bio.trim() || null,
        target_lsi: form.target_lsi,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/clients/${clientId}`);
      }, 1500);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: accent }}>Loading client data...</div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${border}`,
    borderRadius: 8, color: 'white', fontSize: 14, outline: 'none',
    fontFamily: font, boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: '0.05em',
    textTransform: 'uppercase',
  };

  const sectionStyle: React.CSSProperties = {
    background: cardBg, border: `1px solid ${border}`,
    borderRadius: 12, padding: 24, marginBottom: 20,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: 'white', fontFamily: font }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Link href={`/dashboard/clients/${clientId}`}
            style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Back to Client
          </Link>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: 'white' }}>
          Edit Client Profile
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>
          Update details. If key details change (name, company, role), re-run Discovery for accurate results.
        </p>

        {/* Rescan warning */}
        {hasExistingScans && (
          <div style={{
            background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.3)`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 24,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <AlertCircle size={18} color={accent} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ color: accent, fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                Existing scan data detected
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                Changing name, company, role, or adding social URLs will affect discovery accuracy.
                Re-run Discover after saving for updated results.
              </p>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: accent, marginBottom: 20, letterSpacing: '0.05em' }}>
            BASIC INFORMATION
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div>
              <label style={labelStyle}>Role / Title</label>
              <input
                style={inputStyle}
                value={form.role}
                onChange={e => set('role', e.target.value)}
                placeholder="e.g. CEO & Co-Founder"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Company / Organisation</label>
              <input
                style={inputStyle}
                value={form.company}
                onChange={e => set('company', e.target.value)}
                placeholder="e.g. TechVentures India"
              />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.industry}
                onChange={e => set('industry', e.target.value)}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Professional Bio / Context</label>
            <textarea
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Brief professional background, key achievements, what you want to be known for. This context helps the AI better understand and position you."
            />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>
              More context = better archetype matching and content alignment
            </p>
          </div>
        </div>

        {/* Social Profiles */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: accent, marginBottom: 8, letterSpacing: '0.05em' }}>
            SOCIAL & DIGITAL PROFILES
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 20 }}>
            Adding profiles significantly improves Discovery accuracy across all 62 sources.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const isActive = form.platforms.includes(platform.id);
              const isLinkedIn = platform.id === 'linkedin';

              return (
                <div key={platform.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Toggle */}
                  <button
                    onClick={() => togglePlatform(platform.id)}
                    disabled={isLinkedIn}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: `1px solid ${border}`,
                      background: isActive ? `rgba(201,168,76,0.15)` : 'rgba(255,255,255,0.03)',
                      cursor: isLinkedIn ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color={isActive ? accent : 'rgba(255,255,255,0.3)'} />
                  </button>

                  {/* Label */}
                  <span style={{ width: 120, fontSize: 13, color: isActive ? 'white' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                    {platform.label}
                    {platform.required && <span style={{ color: accent }}> *</span>}
                  </span>

                  {/* URL input */}
                  <input
                    style={{
                      ...inputStyle,
                      opacity: isActive ? 1 : 0.3,
                      cursor: isActive ? 'text' : 'not-allowed',
                    }}
                    disabled={!isActive}
                    value={isLinkedIn ? form.linkedin_url : (form.social_urls[platform.id] ?? '')}
                    onChange={e => {
                      if (isLinkedIn) set('linkedin_url', e.target.value);
                      else set('social_urls', { ...form.social_urls, [platform.id]: e.target.value });
                    }}
                    placeholder={platform.placeholder}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Keywords & Target */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: accent, marginBottom: 20, letterSpacing: '0.05em' }}>
            SEARCH & DISCOVERY SETTINGS
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Focus Keywords</label>
            <input
              style={inputStyle}
              value={form.keywords}
              onChange={e => set('keywords', e.target.value)}
              placeholder="e.g. renewable energy, climate tech, impact investing"
            />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>
              Comma-separated. Used to filter relevant mentions from 62 sources.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Target LSI Score</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range" min={50} max={95} step={5}
                value={form.target_lsi}
                onChange={e => set('target_lsi', Number(e.target.value))}
                style={{ flex: 1, accentColor: accent }}
              />
              <span style={{ color: accent, fontWeight: 700, fontSize: 18, minWidth: 40 }}>
                {form.target_lsi}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>
              Current scale: 0–100. Elite Authority = 86+. Strong Authority = 71–85.
            </p>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            color: '#34d399', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={16} /> Saved. Redirecting...
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving || success}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: 8,
              background: saving ? 'rgba(201,168,76,0.5)' : accent,
              color: '#080C14', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <Link href={`/dashboard/clients/${clientId}`}
            style={{
              padding: '12px 24px', borderRadius: 8,
              border: `1px solid ${border}`, color: 'rgba(255,255,255,0.6)',
              fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center',
            }}>
            Cancel
          </Link>
        </div>

        {hasExistingScans && !success && (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 }}>
            After saving, go to Discover → Run Scan to refresh your reputation data.
          </p>
        )}
      </div>
    </div>
  );
}
