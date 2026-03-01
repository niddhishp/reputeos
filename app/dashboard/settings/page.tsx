'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, LogOut, User, Building2, Mail, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Inter', system-ui",
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8,
};

export default function SettingsPage() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [name,    setName]    = useState('');
  const [company, setCompany] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setName(data.user.user_metadata?.name ?? '');
        setCompany(data.user.user_metadata?.company ?? '');
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    const { error: err } = await supabase.auth.updateUser({ data: { name, company } });
    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const plan = user?.user_metadata?.plan ?? 'solo';
  const role = user?.user_metadata?.role ?? 'consultant';
  const planColor = plan === 'enterprise' ? '#818cf8' : plan === 'agency' ? GOLD : '#4ade80';

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 600, paddingBottom: 60 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Manage your account and API configuration</p>
      </div>

      {/* Profile card */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 20 }}>
          Profile
        </h3>

        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}><Mail size={10} style={{ display: 'inline', marginRight: 4 }} />Email</span>
          <input value={user?.email ?? ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={labelStyle}><User size={10} style={{ display: 'inline', marginRight: 4 }} />Full Name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            style={{ ...inputStyle, borderColor: name ? `${GOLD}60` : BORDER }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <span style={labelStyle}><Building2 size={10} style={{ display: 'inline', marginRight: 4 }} />Company / Agency</span>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Your company"
            style={{ ...inputStyle, borderColor: company ? `${GOLD}60` : BORDER }}
          />
        </div>

        {/* Role + Plan badges */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={11} color="rgba(255,255,255,0.4)" />
            <span style={{ textTransform: 'capitalize' }}>{role}</span>
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 20, background: `${planColor}15`, border: `1px solid ${planColor}40`, fontSize: 12, color: planColor, fontWeight: 600, textTransform: 'capitalize' }}>
            {plan} plan
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '9px 14px', marginBottom: 14, color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          padding: '10px 22px', borderRadius: 8, background: saving ? 'rgba(201,168,76,0.4)' : GOLD,
          color: '#080C14', fontWeight: 700, fontSize: 13, border: 'none',
          cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {saved
            ? <><CheckCircle size={14} /> Saved!</>
            : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* API Keys info */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
          API Configuration
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 14 }}>
          API keys are configured via environment variables in Vercel. To update keys, go to your Vercel project settings → Environment Variables.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'OpenRouter (AI Generation)',       env: 'OPENROUTER_API_KEY' },
            { label: 'SerpAPI (Discovery Search)',        env: 'SERPAPI_KEY' },
            { label: 'NewsAPI (Media Monitoring)',        env: 'NEWSAPI_KEY' },
            { label: 'Exa.ai (Semantic Search)',          env: 'EXA_API_KEY' },
            { label: 'Firecrawl (Web Scraping)',          env: 'FIRECRAWL_API_KEY' },
            { label: 'Supabase (Database)',               env: 'NEXT_PUBLIC_SUPABASE_URL' },
          ].map(({ label, env }) => (
            <div key={env} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 7, border: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              <code style={{ fontSize: 11, color: GOLD, background: `${GOLD}10`, padding: '2px 8px', borderRadius: 5 }}>{env}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: CARD, border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
          Danger Zone
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
          Signing out will end your current session.
        </p>
        <button onClick={handleSignOut} style={{
          padding: '9px 18px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.4)',
          background: 'rgba(248,113,113,0.1)', color: '#f87171',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </div>
  );
}
