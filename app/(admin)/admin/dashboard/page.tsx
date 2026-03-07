'use client';
import { useEffect, useState, useCallback } from 'react';
import { Users, Activity, Cpu, CreditCard, TrendingUp, AlertTriangle, RefreshCw, Shield, BarChart3, Zap } from 'lucide-react';

const GOLD='#C9A84C'; const CARD='#0d1117'; const BORDER='rgba(201,168,76,0.12)'; const MUTED='rgba(255,255,255,0.35)'; const TEXT='rgba(255,255,255,0.7)'; const font="'Plus Jakarta Sans',system-ui,sans-serif"; const mono="'DM Mono',monospace";

interface DashStats {
  totalUsers:number; activeUsers:number; newUsersToday:number;
  totalClients:number; totalContentItems:number; totalLSIRuns:number;
  recentSignups:Array<{id:string;email:string;role:string;created_at:string}>;
}
interface UsageStats {
  summary:{ totalCost:number; totalCalls:number; totalTokens:number; errorRate:number; totalScans:number };
  byService:Record<string,{calls:number;errors:number;cost:number;tokens:number;avgLatency:number}>;
  recentErrors:Array<{service:string;operation:string;error_msg:string;created_at:string}>;
}

function Stat({ icon:Icon, label, value, sub, color='white' }:{ icon:React.ElementType; label:string; value:string|number; sub?:string; color?:string }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:'20px 22px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'rgba(201,168,76,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:15, color:GOLD }} />
        </div>
        <span style={{ fontSize:12, color:MUTED, fontFamily:mono }}>{label}</span>
      </div>
      <div style={{ fontSize:32, fontWeight:800, color, lineHeight:1, fontFamily:mono }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:MUTED, marginTop:6 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dash,  setDash]    = useState<DashStats|null>(null);
  const [usage, setUsage]   = useState<UsageStats|null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRaw, ua, subsRaw] = await Promise.all([
        fetch('/api/admin/analytics').then(r=>r.json()),
        fetch('/api/admin/usage?days=30').then(r=>r.json()),
        fetch('/api/admin/subscriptions').then(r=>r.json()),
      ]);
      // Normalise nested analytics shape → flat DashStats
      const ov = analyticsRaw?.analytics?.overview ?? analyticsRaw ?? {};
      const allUsers = (subsRaw?.users ?? []) as Array<{createdAt:string;email:string;id:string;authRole:string}>;
      const today = new Date(); today.setHours(0,0,0,0);
      const newUsersToday = allUsers.filter(u=>new Date(u.createdAt)>=today).length;
      const recentSignups = [...allUsers]
        .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
        .slice(0,5)
        .map(u=>({id:u.id, email:u.email, role:u.authRole, created_at:u.createdAt}));
      setDash({
        totalUsers:       ov.totalUsers       ?? allUsers.length,
        activeUsers:      ov.activeUsers       ?? 0,
        newUsersToday,
        totalClients:     ov.totalClients      ?? 0,
        totalContentItems:ov.totalContentItems ?? 0,
        totalLSIRuns:     ov.totalLSIRuns      ?? 0,
        recentSignups,
      });
      setUsage(ua);
    } catch(e){ console.error(e); }
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const card:React.CSSProperties = { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:'22px 24px' };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <div style={{ width:24, height:24, border:`2px solid ${GOLD}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const svcOrder = ['openrouter','anthropic','openai','serpapi','exa','firecrawl','apify'];
  const services = Object.entries(usage?.byService ?? {}).sort((a,b)=>(svcOrder.indexOf(a[0])>svcOrder.indexOf(b[0])?1:-1));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, fontFamily:font }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.02em', marginBottom:4 }}>Overview</h1>
          <p style={{ fontSize:12, color:MUTED, fontFamily:mono }}>Last 30 days · Real-time stats</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:`1px solid ${BORDER}`, borderRadius:8, background:'none', color:MUTED, fontSize:12, cursor:'pointer', fontFamily:font }}>
          <RefreshCw style={{ width:13 }} /> Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14 }}>
        <Stat icon={Users}      label="TOTAL USERS"    value={dash?.totalUsers??0}          sub={`${dash?.newUsersToday??0} joined today`} />
        <Stat icon={Activity}   label="ACTIVE USERS"   value={dash?.activeUsers??0}          sub="not banned" />
        <Stat icon={BarChart3}  label="CLIENTS"        value={dash?.totalClients??0}          sub="across all users" />
        <Stat icon={Zap}        label="LSI RUNS"       value={dash?.totalLSIRuns??0}           sub="total scored" />
        <Stat icon={CreditCard} label="API SPEND (30D)" value={`$${(usage?.summary?.totalCost??0).toFixed(2)}`} color={GOLD} sub={`${usage?.summary?.totalCalls??0} calls`} />
        <Stat icon={Cpu}        label="TOTAL SCANS"    value={usage?.summary?.totalScans??0}  sub="all types" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* API Service breakdown */}
        <div style={card}>
          <div style={{ fontSize:12, color:MUTED, fontFamily:mono, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:18 }}>API Services — 30 Day Spend</div>
          {services.length === 0 ? (
            <div style={{ color:MUTED, fontSize:13, textAlign:'center', padding:'24px 0' }}>No usage data yet — scans will populate this.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {services.map(([svc, s]) => (
                <div key={svc} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', fontFamily:mono }}>{svc}</div>
                    <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{s.calls.toLocaleString()} calls · {s.avgLatency}ms avg</div>
                  </div>
                  <div style={{ fontSize:12, color:MUTED, textAlign:'right' }}>{s.tokens.toLocaleString()}<br/><span style={{ fontSize:10 }}>tokens</span></div>
                  <div style={{ fontSize:12, color:s.errors>0?'#f97316':'#10b981', textAlign:'right' }}>
                    {s.errors > 0 ? `${s.errors} err` : '✓'}<br/><span style={{ fontSize:10, color:MUTED }}>{s.calls>0?Math.round(s.errors/s.calls*100):0}%</span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:GOLD, textAlign:'right', fontFamily:mono }}>${s.cost.toFixed(4)}</div>
                </div>
              ))}
              <div style={{ paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:MUTED }}>Total</span>
                <span style={{ fontSize:16, fontWeight:800, color:GOLD, fontFamily:mono }}>${(usage?.summary?.totalCost??0).toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div style={card}>
          <div style={{ fontSize:12, color:MUTED, fontFamily:mono, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:18 }}>Recent Sign-ups</div>
          {!dash?.recentSignups?.length ? (
            <div style={{ color:MUTED, fontSize:13, textAlign:'center', padding:'24px 0' }}>No recent sign-ups.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {dash.recentSignups.map((u,i) => (
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<dash.recentSignups.length-1?`1px solid rgba(255,255,255,0.04)`:'none' }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`hsl(${(u.email.charCodeAt(0)*17)%360},40%,25%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', flexShrink:0 }}>
                    {u.email.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:TEXT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                    <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{new Date(u.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color:GOLD, background:'rgba(201,168,76,0.08)', border:`1px solid ${BORDER}`, borderRadius:5, padding:'2px 7px', fontFamily:mono }}>
                    {(u.role||'user').toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent errors */}
      {(usage?.recentErrors?.length ?? 0) > 0 && (
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            <AlertTriangle style={{ width:14, color:'#f97316' }} />
            <span style={{ fontSize:12, color:MUTED, fontFamily:mono, letterSpacing:'0.05em', textTransform:'uppercase' }}>Recent API Errors</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {usage!.recentErrors.slice(0,5).map((e,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, padding:'10px 14px', background:'rgba(249,115,22,0.05)', border:'1px solid rgba(249,115,22,0.12)', borderRadius:8, alignItems:'center' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#f97316', fontFamily:mono, whiteSpace:'nowrap' }}>{e.service}</span>
                <span style={{ fontSize:12, color:TEXT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.error_msg ?? e.operation}</span>
                <span style={{ fontSize:11, color:MUTED, whiteSpace:'nowrap', fontFamily:mono }}>{new Date(e.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
