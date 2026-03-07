'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Search, BarChart2, Target, PenLine,
  CheckSquare, Shield, ArrowRight, Pencil, RefreshCw,
} from 'lucide-react';

const GOLD   = '#C9A84C';
const CARD   = '#0d1117';
const BORDER = 'rgba(201,168,76,0.15)';

const MODULES = [
  { id: 'discover', label: 'Discover', desc: 'Audit digital footprint across 62 sources', Icon: Search,      color: '#818cf8' },
  { id: 'diagnose', label: 'Diagnose', desc: 'LSI scoring & statistical gap analysis',    Icon: BarChart2,   color: '#60a5fa' },
  { id: 'position', label: 'Position', desc: 'Archetype assignment & content strategy',  Icon: Target,      color: GOLD      },
  { id: 'express',  label: 'Express',  desc: 'Thought leadership content creation',     Icon: PenLine,     color: '#4ade80' },
  { id: 'validate', label: 'Validate', desc: 'Statistical proof of LSI improvement',     Icon: CheckSquare, color: '#34d399' },
  { id: 'shield',   label: 'Shield',   desc: 'Crisis monitoring & competitor intel',     Icon: Shield,      color: '#f87171' },
];

function getLSILabel(score: number) {
  if (score >= 86) return { label: 'Elite Authority',   color: '#4ade80' };
  if (score >= 71) return { label: 'Strong Authority',  color: '#34d399' };
  if (score >= 56) return { label: 'Functional',        color: GOLD      };
  if (score >= 36) return { label: 'Vulnerable',        color: '#fb923c' };
  return             { label: 'Severe Risk',            color: '#f87171' };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'just now';
}

export default function ClientOverviewPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params.id as string;

  const [client,     setClient]     = useState<Record<string,unknown> | null>(null);
  const [latestLSI,  setLatestLSI]  = useState<{ total_score: number; run_date: string } | null>(null);
  const [discoverRun,setDiscoverRun]= useState<{ status: string; run_date: string; total_mentions: number } | null>(null);
  const [positioning,setPositioning]= useState<{ personal_archetype: string; followability_score: number } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }

        const { data: c, error: ce } = await supabase
          .from('clients').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
        if (ce) throw new Error(ce.message);
        if (!c) { router.push('/dashboard/clients'); return; }
        setClient(c);

        const [lsiRes, discRes, posRes] = await Promise.all([
          supabase.from('lsi_runs').select('total_score, run_date')
            .eq('client_id', id).order('run_date', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('discover_runs').select('status, run_date, total_mentions')
            .eq('client_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('positioning').select('personal_archetype, followability_score')
            .eq('client_id', id).maybeSingle(),
        ]);

        setLatestLSI(lsiRes.data ?? null);
        setDiscoverRun(discRes.data ?? null);
        setPositioning(posRes.data ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load client');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (loading) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
      Loading client…
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <p style={{ color: '#f87171', marginBottom: 16 }}>Error: {error}</p>
        <button onClick={() => router.push('/dashboard/clients')}
          style={{ padding: '9px 20px', background: GOLD, color: '#080C14', fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          ← Back to Clients
        </button>
      </div>
    </div>
  );

  if (!client) return null;

  const c          = client as { id: string; name: string; company?: string; industry?: string; role?: string; status?: string; target_lsi?: number; baseline_lsi?: number };
  const lsiInfo    = latestLSI ? getLSILabel(latestLSI.total_score) : null;

  return (
    <div style={{ color: 'white', fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 6 }}>{c.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            {c.company  && <span>{c.company}</span>}
            {c.industry && <><span>·</span><span>{c.industry}</span></>}
            {c.role     && <><span>·</span><span>{c.role}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href={`/dashboard/clients/${id}/edit`} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Pencil size={13} /> Edit Profile
          </Link>
          <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.status === 'active' ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.05)', color: c.status === 'active' ? '#4ade80' : 'rgba(255,255,255,0.4)', border: `1px solid ${c.status === 'active' ? 'rgba(74,222,128,0.3)' : BORDER}`, textTransform: 'capitalize' }}>
            {c.status ?? 'active'}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {/* LSI */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Current LSI</div>
          {latestLSI ? (
            <>
              <div style={{ fontSize: 36, fontWeight: 800, color: lsiInfo?.color ?? GOLD }}>{Number(latestLSI.total_score).toFixed(1)}</div>
              <div style={{ fontSize: 12, color: lsiInfo?.color, marginTop: 4, fontWeight: 600 }}>{lsiInfo?.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{timeAgo(latestLSI.run_date)}</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Not scored yet</div>
          )}
        </div>

        {/* Target */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Target LSI</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: GOLD }}>{c.target_lsi ?? 75}</div>
          {c.baseline_lsi && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Baseline: {c.baseline_lsi}</div>}
        </div>

        {/* Archetype */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Archetype</div>
          {positioning ? (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginTop: 4 }}>{positioning.personal_archetype}</div>
              {positioning.followability_score > 0 && <div style={{ fontSize: 12, color: GOLD, marginTop: 6, fontWeight: 600 }}>{positioning.followability_score}% followability</div>}
            </>
          ) : (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Not positioned</div>
          )}
        </div>
      </div>

      {/* Discovery status banner */}
      {discoverRun && (
        <div style={{ background: discoverRun.status === 'completed' ? 'rgba(74,222,128,0.06)' : 'rgba(251,146,60,0.06)', border: `1px solid ${discoverRun.status === 'completed' ? 'rgba(74,222,128,0.2)' : 'rgba(251,146,60,0.2)'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Search size={14} color={discoverRun.status === 'completed' ? '#4ade80' : '#fb923c'} />
          <div style={{ fontSize: 13 }}>
            <span style={{ color: discoverRun.status === 'completed' ? '#4ade80' : '#fb923c', fontWeight: 600 }}>
              Last discovery: {discoverRun.status}
            </span>
            {discoverRun.total_mentions > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>· {discoverRun.total_mentions} mentions</span>}
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>· {timeAgo(discoverRun.run_date)}</span>
          </div>
        </div>
      )}

      {/* Module grid */}
      <h2 style={{ fontSize: 14, fontWeight: 600, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
        Reputation Engineering Modules
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {MODULES.map(({ id: mid, label, desc, Icon, color }) => (
          <Link key={mid} href={`/dashboard/clients/${id}/${mid}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column', height: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${color}50`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={color} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{label}</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, flex: 1 }}>{desc}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <ArrowRight size={14} color={`${color}80`} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
