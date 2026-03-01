'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, UserCircle, Users, ArrowRight, ChevronRight, Check, X, Shield, BarChart2, Target, PenLine, CheckSquare, Zap, BookOpen, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Client {
  id: string; name: string; company: string | null; role: string | null;
  industry: string | null; status: string; baseline_lsi: number | null;
  target_lsi: number; is_self_profile: boolean | null; created_at: string; updated_at: string;
}
interface UserProfile { name: string; role: string; plan: string; }

const MODULE_STEPS = [
  { key: 'profile', label: 'Create your profile', icon: UserCircle, desc: 'Add your basic information and LinkedIn URL', color: '#6366f1' },
  { key: 'discover', label: 'Run Discovery Scan', icon: Search, desc: 'Scan 50+ sources to audit your digital footprint', color: '#0ea5e9' },
  { key: 'diagnose', label: 'Get your LSI Score', icon: BarChart2, desc: 'Calculate your 6-component reputation score', color: '#8b5cf6' },
  { key: 'position', label: 'Choose your Archetype', icon: Target, desc: 'Pick from 54 archetypes and lock your strategy', color: '#C9A84C' },
  { key: 'express', label: 'Create content', icon: PenLine, desc: 'Generate NLP-validated thought leadership content', color: '#10b981' },
  { key: 'validate', label: 'Validate your results', icon: CheckSquare, desc: 'Generate board-ready reports with statistical proof', color: '#f59e0b' },
];

function FirstTimeWizard({ onClose, userRole, onCreateProfile }: { onClose: () => void; userRole: string; onCreateProfile: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    { title: 'Welcome to ReputeOS', body: 'You are about to get your LSI score — a 0–100 measurement of your professional reputation across 6 statistical components. Most professionals have never seen this number. You are about to change that.', cta: 'Show me how it works' },
    { title: 'The 6-Module System', body: 'ReputeOS works in sequence: Discover your footprint → Diagnose your LSI score → Position your archetype → Express content → Validate results → Shield from threats. Each module feeds the next.', cta: 'Got it, what do I do first?' },
    { title: userRole === 'individual' ? 'Your first step: Your Profile' : 'Your first step: Create a Client', body: userRole === 'individual' ? "We already set up your profile. Now head to Discover to run your first scan. It takes about 2 minutes to start and audits 50+ sources automatically." : "Start by creating your first client profile. You'll need their name, LinkedIn URL, and the platforms they are active on. From there, the system guides you.", cta: "Let's get started" },
  ];
  const slide = slides[step];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: 24 }}>
      <div style={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 480, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {slides.map((_, i) => <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, backgroundColor: i <= step ? '#C9A84C' : 'rgba(255,255,255,0.08)' }} />)}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Shield style={{ width: 24, height: 24, color: '#C9A84C' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 12 }}>{slide.title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 32 }}>{slide.body}</p>
        <button onClick={() => { if (step < slides.length - 1) setStep(step + 1); else { onClose(); if (userRole === 'consultant') onCreateProfile(); } }} style={{ width: '100%', padding: '13px 0', backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, borderRadius: 10, fontSize: 15, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {slide.cta} →
        </button>
        {step > 0 && <button onClick={() => setStep(step - 1)} style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>}
      </div>
    </div>
  );
}

function OnboardingChecklist({ completedSteps, userRole, clientId, onCreateClient }: { completedSteps: Set<string>; userRole: string; clientId: string | null; onCreateClient: () => void; }) {
  const pct = Math.round((completedSteps.size / MODULE_STEPS.length) * 100);
  return (
    <div style={{ border: '1px solid rgba(201,168,76,0.15)', borderRadius: 16, padding: 24, backgroundColor: 'rgba(201,168,76,0.02)', marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>Getting started</h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{completedSteps.size} of {MODULE_STEPS.length} steps complete</p>
        </div>
        <div style={{ position: 'relative', width: 48, height: 48 }}>
          <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" /><circle cx="24" cy="24" r="20" fill="none" stroke="#C9A84C" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`} transform="rotate(-90 24 24)" strokeLinecap="round" /></svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#C9A84C' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MODULE_STEPS.map((step, i) => {
          const done = completedSteps.has(step.key);
          const locked = i > 0 && !completedSteps.has(MODULE_STEPS[i - 1].key) && !done;
          const href = clientId ? (step.key === 'profile' ? `/dashboard/clients/${clientId}` : `/dashboard/clients/${clientId}/${step.key}`) : null;
          const Icon = step.icon;
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, backgroundColor: done ? 'rgba(16,185,129,0.05)' : locked ? 'transparent' : 'rgba(255,255,255,0.02)', border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : locked ? 'transparent' : 'rgba(255,255,255,0.04)'}`, opacity: locked ? 0.4 : 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: done ? 'rgba(16,185,129,0.15)' : `${step.color}15`, border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : `${step.color}25`}` }}>
                {done ? <Check style={{ width: 13, height: 13, color: '#10b981' }} /> : <Icon style={{ width: 13, height: 13, color: step.color }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)', textDecoration: done ? 'line-through' : 'none' }}>{step.label}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>{step.desc}</p>
              </div>
              {!done && !locked && href && (
                <Link href={href} style={{ fontSize: 11, color: '#C9A84C', textDecoration: 'none', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Go <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
              )}
              {!done && !locked && !href && (
                <button onClick={onCreateClient} style={{ fontSize: 11, color: '#C9A84C', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Go <ChevronRight style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profile } = await supabase.from('user_profiles').select('name, role, plan').eq('id', user.id).single();
    const role = profile?.role ?? user.user_metadata?.role ?? 'individual';
    setUserProfile({ name: profile?.name ?? user.user_metadata?.name ?? 'there', role, plan: profile?.plan ?? 'individual' });

    // Show wizard only on first visit (no clients yet)
    const { data: existingClients } = await supabase.from('clients').select('*').order('updated_at', { ascending: false });

    if (!existingClients || existingClients.length === 0) {
      setShowWizard(true);
      // Auto-create self profile for individual users
      if (role === 'individual') {
        const name = profile?.name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'My Profile';
        const { data: newProfile } = await supabase.from('clients').insert({ user_id: user.id, name, is_self_profile: true, status: 'active' }).select().single();
        if (newProfile) {
          setClients([newProfile]);
          setLoading(false);
          return;
        }
      }
    } else {
      setClients(existingClients);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.company ?? '').toLowerCase().includes(search.toLowerCase()));
  const isConsultant = userProfile?.role === 'consultant';
  const selfProfile = clients.find(c => c.is_self_profile);

  // Determine completed steps for the first client
  const getCompletedSteps = (client: Client): Set<string> => {
    const steps = new Set<string>();
    steps.add('profile'); // profile is always done once created
    if ((client as any).discover_completed) steps.add('discover');
    if (client.baseline_lsi !== null) steps.add('diagnose');
    return steps;
  };

  function getLSILabel(score: number | null) {
    if (!score) return null;
    if (score >= 86) return { label: 'Elite Authority', color: '#10b981' };
    if (score >= 71) return { label: 'Strong Authority', color: '#3b82f6' };
    if (score >= 56) return { label: 'Functional', color: '#eab308' };
    if (score >= 36) return { label: 'Vulnerable', color: '#f97316' };
    return { label: 'Impaired', color: '#ef4444' };
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#080C14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Shield style={{ width: 32, height: 32, color: '#C9A84C', margin: '0 auto 16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080C14', color: 'white', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');.mono{font-family:'DM Mono',monospace}`}</style>

      {showWizard && <FirstTimeWizard onClose={() => setShowWizard(false)} userRole={userProfile?.role ?? 'individual'} onCreateProfile={() => router.push('/dashboard/clients/new')} />}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 4 }}>
              {isConsultant ? `Good to see you, ${userProfile?.name?.split(' ')[0] ?? 'there'}.` : `Your Reputation Dashboard`}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
              {isConsultant ? `Managing ${clients.length} client${clients.length !== 1 ? 's' : ''}.` : 'Track, build, and protect your professional reputation.'}
            </p>
          </div>
          {isConsultant && (
            <button onClick={() => router.push('/dashboard/clients/new')} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
              <Plus style={{ width: 16, height: 16 }} /> New client
            </button>
          )}
        </div>

        {/* Onboarding checklist — show if <4 steps done */}
        {clients.length > 0 && (() => {
          const primaryClient = selfProfile ?? clients[0];
          const completed = getCompletedSteps(primaryClient);
          if (completed.size >= MODULE_STEPS.length) return null;
          return <OnboardingChecklist completedSteps={completed} userRole={userProfile?.role ?? 'individual'} clientId={primaryClient.id} onCreateClient={() => router.push('/dashboard/clients/new')} />;
        })()}

        {/* Quick actions for individual with self-profile */}
        {!isConsultant && selfProfile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Run Discovery', href: `/dashboard/clients/${selfProfile.id}/discover`, icon: Search, color: '#0ea5e9', desc: 'Scan 50+ sources' },
              { label: 'View my LSI', href: `/dashboard/clients/${selfProfile.id}/diagnose`, icon: BarChart2, color: '#8b5cf6', desc: selfProfile.baseline_lsi ? `Score: ${selfProfile.baseline_lsi}` : 'Not calculated yet' },
              { label: 'My Archetype', href: `/dashboard/clients/${selfProfile.id}/position`, icon: Target, color: '#C9A84C', desc: 'Set your strategy' },
              { label: 'Create content', href: `/dashboard/clients/${selfProfile.id}/express`, icon: PenLine, color: '#10b981', desc: 'Generate a post' },
            ].map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href} style={{ display: 'block', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, backgroundColor: 'rgba(255,255,255,0.015)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <Icon style={{ width: 16, height: 16, color: action.color }} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{action.label}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>{action.desc}</p>
                </Link>
              );
            })}
          </div>
        )}

        {/* Search for consultants */}
        {isConsultant && clients.length > 3 && (
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={{ width: '100%', padding: '10px 12px 10px 40px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: 'white', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        )}

        {/* Client list */}
        {filtered.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Users style={{ width: 24, height: 24, color: '#C9A84C' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>No clients yet</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Create your first client profile to get started.</p>
            <button onClick={() => router.push('/dashboard/clients/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#C9A84C', color: '#080C14', fontWeight: 700, padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
              <Plus style={{ width: 16, height: 16 }} /> Create first client
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(client => {
              const lsi = getLSILabel(client.baseline_lsi);
              const progress = client.baseline_lsi && client.target_lsi ? Math.min((client.baseline_lsi / client.target_lsi) * 100, 100) : 0;
              return (
                <div key={client.id} onClick={() => router.push(`/dashboard/clients/${client.id}`)} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, backgroundColor: 'rgba(255,255,255,0.015)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCircle style={{ width: 20, height: 20, color: '#C9A84C' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>{client.name}{client.is_self_profile ? ' (you)' : ''}</p>
                        {(client.role || client.company) && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{[client.role, client.company].filter(Boolean).join(' · ')}</p>}
                      </div>
                    </div>
                    {lsi && <span style={{ fontSize: 11, color: lsi.color, border: `1px solid ${lsi.color}30`, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }} className="mono">{lsi.label}</span>}
                  </div>
                  {client.baseline_lsi !== null ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>LSI Score</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }} className="mono">{client.baseline_lsi} / {client.target_lsi}</span>
                      </div>
                      <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: lsi?.color ?? '#C9A84C', borderRadius: 2 }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', backgroundColor: 'rgba(201,168,76,0.04)', borderRadius: 8, border: '1px solid rgba(201,168,76,0.1)' }}>
                      <Zap style={{ width: 14, height: 14, color: '#C9A84C' }} />
                      <span style={{ fontSize: 12, color: 'rgba(201,168,76,0.7)' }}>Run Discovery to get LSI score</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 14 }}>
                    <span style={{ fontSize: 12, color: 'rgba(201,168,76,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>Open <ChevronRight style={{ width: 14, height: 14 }} /></span>
                  </div>
                </div>
              );
            })}

            {isConsultant && (
              <button onClick={() => router.push('/dashboard/clients/new')} style={{ border: '2px dashed rgba(255,255,255,0.07)', borderRadius: 14, padding: 20, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 160, fontFamily: 'inherit' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1px dashed rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus style={{ width: 20, height: 20, color: 'rgba(201,168,76,0.4)' }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Add client</span>
              </button>
            )}
          </div>
        )}

        {/* Help section */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { icon: BookOpen, title: 'What is LSI?', desc: 'Understanding your Leadership Sentiment Index score' },
            { icon: Play, title: 'How Discovery works', desc: 'What the 50-source scan actually does' },
            { icon: Target, title: 'Choosing an archetype', desc: 'Guide to the 54-archetype positioning system' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, backgroundColor: 'rgba(255,255,255,0.01)', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Icon style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
