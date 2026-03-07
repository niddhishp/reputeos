'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, ChevronDown, Check, X, RefreshCw,
  Shield, Clock, AlertTriangle, Crown, Ban,
} from 'lucide-react';

const GOLD='#C9A84C'; const CARD='#0d1117'; const BORDER='rgba(201,168,76,0.12)'; const MUTED='rgba(255,255,255,0.35)'; const TEXT='rgba(255,255,255,0.7)'; const font="'Plus Jakarta Sans',system-ui,sans-serif"; const mono="'DM Mono',monospace";

const PLANS = ['free','individual','professional','agency','enterprise'];
const PLAN_COLOR: Record<string,string> = {
  free:'#6b7280', individual:'#3b82f6', professional:GOLD, agency:'#8b5cf6', enterprise:'#10b981',
};

interface SubUser {
  id:string; email:string; name:string; plan:string; authRole:string;
  company:string; isActive:boolean; emailConfirmed:boolean;
  createdAt:string; lastSignIn:string|null;
  scansCompleted:number; clientCount:number;
  trialEndsAt:string|null; planOverride:boolean;
}

function PlanBadge({ plan }:{ plan:string }) {
  return <span style={{ fontSize:10, fontWeight:700, color:PLAN_COLOR[plan]??'#9ca3af', background:`${PLAN_COLOR[plan]??'#9ca3af'}18`, border:`1px solid ${PLAN_COLOR[plan]??'#9ca3af'}40`, borderRadius:5, padding:'2px 8px', fontFamily:mono, textTransform:'uppercase' }}>{plan}</span>;
}

function EditModal({ user, onClose, onSaved }:{ user:SubUser; onClose:()=>void; onSaved:()=>void }) {
  const [plan, setPlan] = useState(user.plan);
  const [role, setRole] = useState(user.authRole);
  const [trialDays, setTrialDays] = useState('');
  const [banned, setBanned] = useState(!user.isActive);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setSaving(true); setError('');
    try {
      const body: Record<string,unknown> = { userId: user.id, note };
      if (plan !== user.plan) body.plan = plan;
      if (role !== user.authRole) body.authRole = role;
      if (trialDays) body.trialDays = parseInt(trialDays, 10);
      if (banned !== !user.isActive) body.banned = banned;

      const res = await fetch('/api/admin/subscriptions', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await res.json() as { error?:string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      onSaved();
      onClose();
    } catch(e) { setError(e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  }

  const overlay:React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 };
  const modal:React.CSSProperties  = { background:'#0a0f1a', border:`1px solid ${BORDER}`, borderRadius:16, padding:'28px 32px', width:'100%', maxWidth:500, fontFamily:font };
  const label:React.CSSProperties  = { fontSize:11, color:MUTED, fontFamily:mono, letterSpacing:'0.04em', textTransform:'uppercase', display:'block', marginBottom:6 };
  const sel:React.CSSProperties    = { width:'100%', background:'#080C14', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, padding:'10px 12px', color:TEXT, fontSize:13, fontFamily:font, outline:'none' };
  const inp:React.CSSProperties    = { ...sel };

  return (
    <div style={overlay} onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div>
            <h3 style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:2 }}>Manage User</h3>
            <div style={{ fontSize:12, color:MUTED, fontFamily:mono }}>{user.email}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:MUTED }}><X style={{ width:18 }} /></button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={label}>Plan</label>
            <select value={plan} onChange={e=>setPlan(e.target.value)} style={sel}>
              {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
            {user.planOverride && <div style={{ fontSize:11, color:GOLD, marginTop:4, fontFamily:mono }}>⚡ Plan was previously overridden</div>}
          </div>

          <div>
            <label style={label}>Auth Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={sel}>
              {['user','consultant','admin','superadmin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label style={label}>Extend Trial (days from now)</label>
            <input type="number" value={trialDays} onChange={e=>setTrialDays(e.target.value)} placeholder="e.g. 14" style={inp} min="0" max="365" />
            {user.trialEndsAt && <div style={{ fontSize:11, color:MUTED, marginTop:4 }}>Current trial ends: {new Date(user.trialEndsAt).toLocaleDateString('en-IN')}</div>}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <label style={label}>Account Status</label>
            <button onClick={()=>setBanned(!banned)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', border:`1px solid ${banned?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`, borderRadius:8, background:banned?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.06)', color:banned?'#ef4444':'#10b981', fontSize:12, cursor:'pointer', fontFamily:font }}>
              {banned ? <><Ban style={{ width:13 }} /> Banned — click to unban</> : <><Check style={{ width:13 }} /> Active — click to ban</>}
            </button>
          </div>

          <div>
            <label style={label}>Admin Note (stored in metadata)</label>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional internal note" style={inp} />
          </div>

          {error && <div style={{ fontSize:12, color:'#ef4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px' }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:'10px', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, background:'none', color:MUTED, cursor:'pointer', fontFamily:font, fontSize:13 }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex:2, padding:'10px', background:GOLD, color:'#080C14', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:saving?'not-allowed':'pointer', fontFamily:font, opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [users, setUsers]   = useState<SubUser[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [editing, setEditing] = useState<SubUser|null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'plan'|'created'|'scans'|'cost'>('created');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json() as { users:SubUser[]; error?:string };
      if (data.users) setUsers(data.users);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const filtered = users
    .filter(u => planFilter==='all' || u.plan===planFilter)
    .filter(u => !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sortBy==='plan')    return PLANS.indexOf(b.plan)-PLANS.indexOf(a.plan);
      if (sortBy==='scans')   return b.scansCompleted-a.scansCompleted;
      return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
    });

  const planCounts = PLANS.reduce((acc,p) => { acc[p]=users.filter(u=>u.plan===p).length; return acc; }, {} as Record<string,number>);

  const row:React.CSSProperties = { display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr auto', gap:16, alignItems:'center', padding:'13px 18px', borderBottom:`1px solid rgba(255,255,255,0.04)` };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:font }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {editing && <EditModal user={editing} onClose={()=>setEditing(null)} onSaved={load} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.02em', marginBottom:4 }}>Subscriptions</h1>
          <p style={{ fontSize:12, color:MUTED, fontFamily:mono }}>Plan management · Trial controls · Role overrides</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:`1px solid ${BORDER}`, borderRadius:8, background:'none', color:MUTED, fontSize:12, cursor:'pointer', fontFamily:font }}>
          <RefreshCw style={{ width:13 }} /> Refresh
        </button>
      </div>

      {/* Plan summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
        {PLANS.map(p => (
          <button key={p} onClick={()=>setPlanFilter(planFilter===p?'all':p)} style={{ padding:'14px', border:`1px solid ${planFilter===p?PLAN_COLOR[p]+'60':BORDER}`, borderRadius:10, background:planFilter===p?`${PLAN_COLOR[p]}10`:'#0d1117', cursor:'pointer', fontFamily:font, textAlign:'center', transition:'all 150ms' }}>
            <div style={{ fontSize:22, fontWeight:800, color:PLAN_COLOR[p], fontFamily:mono }}>{planCounts[p]??0}</div>
            <div style={{ fontSize:11, color:MUTED, textTransform:'uppercase', letterSpacing:'0.04em', marginTop:4 }}>{p}</div>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200, position:'relative' }}>
          <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:13, color:MUTED }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email or name…" style={{ width:'100%', background:'#0d1117', border:`1px solid rgba(255,255,255,0.08)`, borderRadius:8, padding:'9px 12px 9px 34px', color:TEXT, fontSize:13, fontFamily:font, outline:'none' }} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {(['created','plan','scans'] as const).map(s => (
            <button key={s} onClick={()=>setSortBy(s)} style={{ padding:'8px 12px', border:`1px solid ${sortBy===s?BORDER:'rgba(255,255,255,0.06)'}`, borderRadius:7, background:sortBy===s?'rgba(201,168,76,0.08)':'none', color:sortBy===s?GOLD:MUTED, fontSize:11, cursor:'pointer', fontFamily:mono, textTransform:'uppercase' }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ ...row, background:'rgba(255,255,255,0.02)', borderBottom:`1px solid ${BORDER}` }}>
          {['User','Plan','Usage','Joined','Actions'].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:600, color:MUTED, fontFamily:mono, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ width:22, height:22, border:`2px solid ${GOLD}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:MUTED, fontSize:13 }}>No users match your filters.</div>
        ) : (
          filtered.map(u => (
            <div key={u.id} style={row}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:`hsl(${(u.email.charCodeAt(0)*17)%360},40%,22%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)', flexShrink:0 }}>
                    {u.email.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                    {u.name && <div style={{ fontSize:11, color:MUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}{u.company ? ` · ${u.company}` : ''}</div>}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <PlanBadge plan={u.plan} />
                {u.planOverride && <span style={{ fontSize:9, color:GOLD, fontFamily:mono }}>OVERRIDDEN</span>}
                {!u.isActive && <span style={{ fontSize:9, color:'#ef4444', fontFamily:mono }}>BANNED</span>}
                {u.authRole !== 'user' && <span style={{ fontSize:9, color:'#8b5cf6', fontFamily:mono }}>{u.authRole.toUpperCase()}</span>}
              </div>

              <div>
                <div style={{ fontSize:12, color:TEXT }}>{u.scansCompleted} scans</div>
                <div style={{ fontSize:11, color:MUTED }}>{u.clientCount} clients</div>
              </div>

              <div>
                <div style={{ fontSize:12, color:TEXT }}>{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</div>
                {u.lastSignIn && <div style={{ fontSize:11, color:MUTED }}>{new Date(u.lastSignIn).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>}
              </div>

              <button onClick={()=>setEditing(u)} style={{ padding:'7px 14px', border:`1px solid ${BORDER}`, borderRadius:7, background:'none', color:MUTED, fontSize:12, cursor:'pointer', fontFamily:font, whiteSpace:'nowrap' }}>
                Manage
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:mono, textAlign:'right' }}>
        {filtered.length} of {users.length} users shown
      </div>
    </div>
  );
}
