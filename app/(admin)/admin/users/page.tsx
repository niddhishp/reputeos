'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, X, ChevronDown, ChevronUp, Mail, Ban, Shield, User, Zap, BarChart3 } from 'lucide-react';

const G='#C9A84C',BG='#0d1117',BD='rgba(201,168,76,0.12)',MT='rgba(255,255,255,0.35)',TX='rgba(255,255,255,0.75)',F="'Plus Jakarta Sans',system-ui,sans-serif",M="'DM Mono',monospace";
const PLAN_C:Record<string,string>={free:'#6b7280',individual:'#3b82f6',professional:G,agency:'#8b5cf6',enterprise:'#10b981'};
const ROLE_C:Record<string,string>={user:'#6b7280',consultant:'#3b82f6',admin:G,superadmin:'#ef4444'};

interface AdminUser {
  id:string; email:string; name:string; plan:string; authRole:string; company:string;
  isActive:boolean; emailConfirmed:boolean; createdAt:string; lastSignIn:string|null;
  scansCompleted:number; clientCount:number; trialEndsAt:string|null; planOverride:boolean;
}

function Badge({label,color}:{label:string;color:string}) {
  return <span style={{fontSize:10,fontWeight:700,color,background:`${color}15`,border:`1px solid ${color}35`,borderRadius:5,padding:'2px 7px',fontFamily:M,textTransform:'uppercase'}}>{label}</span>;
}

function UserDrawer({u,onClose,onRefresh}:{u:AdminUser;onClose:()=>void;onRefresh:()=>void}) {
  const [plan,setPlan]=useState(u.plan);
  const [role,setRole]=useState(u.authRole);
  const [trial,setTrial]=useState('');
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const [err,setErr]=useState('');
  const sel:React.CSSProperties={width:'100%',background:'#080C14',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'9px 12px',color:TX,fontSize:13,fontFamily:F,outline:'none'};
  const inp:React.CSSProperties={...sel};
  const lbl:React.CSSProperties={fontSize:11,color:MT,fontFamily:M,letterSpacing:'0.05em',textTransform:'uppercase',display:'block',marginBottom:6};
  async function save(){
    setSaving(true);setErr('');setMsg('');
    try{
      const body:Record<string,unknown>={userId:u.id};
      if(plan!==u.plan)body.plan=plan;
      if(role!==u.authRole)body.authRole=role;
      if(trial)body.trialDays=parseInt(trial,10);
      const r=await fetch('/api/admin/subscriptions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d=await r.json() as {error?:string};
      if(!r.ok)throw new Error(d.error??'Save failed');
      setMsg('Saved');onRefresh();
    }catch(e){setErr(e instanceof Error?e.message:'Failed');}
    setSaving(false);
  }
  async function toggleBan(){
    setSaving(true);setErr('');
    try{
      const r=await fetch('/api/admin/subscriptions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:u.id,banned:u.isActive})});
      if(!r.ok)throw new Error('Ban toggle failed');
      setMsg(u.isActive?'User banned':'User unbanned');onRefresh();
    }catch(e){setErr(e instanceof Error?e.message:'Failed');}
    setSaving(false);
  }
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:200,display:'flex',justifyContent:'flex-end'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:420,background:'#0a0f1a',borderLeft:`1px solid ${BD}`,height:'100%',overflowY:'auto',padding:'28px 28px 40px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
          <div>
            <div style={{width:44,height:44,borderRadius:'50%',background:`hsl(${(u.email.charCodeAt(0)*17)%360},40%,22%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:'rgba(255,255,255,0.7)',marginBottom:12}}>{u.email.slice(0,2).toUpperCase()}</div>
            <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.9)'}}>{u.name||u.email.split('@')[0]}</div>
            <div style={{fontSize:12,color:MT,fontFamily:M,marginTop:2}}>{u.email}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:MT,padding:4}}><X style={{width:18}}/></button>
        </div>

        {/* Status badges */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:22}}>
          <Badge label={u.plan} color={PLAN_C[u.plan]??'#9ca3af'}/>
          <Badge label={u.authRole} color={ROLE_C[u.authRole]??'#6b7280'}/>
          {!u.isActive&&<Badge label="BANNED" color="#ef4444"/>}
          {u.planOverride&&<Badge label="OVERRIDDEN" color={G}/>}
          {!u.emailConfirmed&&<Badge label="UNVERIFIED" color="#f97316"/>}
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:22}}>
          {[['Scans',u.scansCompleted,G],['Clients',u.clientCount,'#3b82f6'],['Status',u.isActive?'Active':'Banned',u.isActive?'#10b981':'#ef4444']].map(([l,v,c])=>(
            <div key={String(l)} style={{background:'rgba(255,255,255,0.03)',border:`1px solid rgba(255,255,255,0.06)`,borderRadius:8,padding:'12px',textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:String(c),fontFamily:M}}>{v}</div>
              <div style={{fontSize:10,color:MT,marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Info rows */}
        <div style={{marginBottom:22,display:'flex',flexDirection:'column',gap:8}}>
          {[
            ['Joined', new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})],
            ['Last sign-in', u.lastSignIn?new Date(u.lastSignIn).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Never'],
            ['Company', u.company||'—'],
            ...(u.trialEndsAt?[['Trial ends', new Date(u.trialEndsAt).toLocaleDateString('en-IN')]]:[] as [string,string][]),
          ].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontSize:12,color:MT}}>{k}</span>
              <span style={{fontSize:12,color:TX,fontFamily:M}}>{v}</span>
            </div>
          ))}
        </div>

        {/* Edit controls */}
        <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:20}}>
          <div>
            <label style={lbl}>Plan Override</label>
            <select value={plan} onChange={e=>setPlan(e.target.value)} style={sel}>
              {['free','individual','professional','agency','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Auth Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} style={sel}>
              {['user','consultant','admin','superadmin'].map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Extend Trial (days from now)</label>
            <input type="number" value={trial} onChange={e=>setTrial(e.target.value)} placeholder="e.g. 14" style={inp} min="0" max="365"/>
          </div>
        </div>

        {msg&&<div style={{fontSize:12,color:'#10b981',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>{msg}</div>}
        {err&&<div style={{fontSize:12,color:'#ef4444',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>{err}</div>}

        <div style={{display:'flex',gap:10}}>
          <button onClick={toggleBan} disabled={saving} style={{flex:1,padding:'10px',border:`1px solid ${u.isActive?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`,borderRadius:8,background:u.isActive?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.06)',color:u.isActive?'#ef4444':'#10b981',fontSize:12,cursor:'pointer',fontFamily:F}}>
            {u.isActive?'Ban User':'Unban User'}
          </button>
          <button onClick={save} disabled={saving} style={{flex:2,padding:'10px',background:G,color:'#080C14',border:'none',borderRadius:8,fontWeight:700,fontSize:13,cursor:saving?'not-allowed':'pointer',fontFamily:F,opacity:saving?0.7:1}}>
            {saving?'Saving…':'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage(){
  const [users,setUsers]=useState<AdminUser[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [planF,setPlanF]=useState('all');
  const [roleF,setRoleF]=useState('all');
  const [selected,setSelected]=useState<AdminUser|null>(null);
  const [sortDir,setSortDir]=useState<'asc'|'desc'>('desc');

  const load=useCallback(async()=>{
    setLoading(true);
    try{const r=await fetch('/api/admin/subscriptions');const d=await r.json() as {users:AdminUser[]};if(d.users)setUsers(d.users);}
    catch(e){console.error(e);}
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const filtered=users
    .filter(u=>planF==='all'||u.plan===planF)
    .filter(u=>roleF==='all'||u.authRole===roleF)
    .filter(u=>!search||u.email.toLowerCase().includes(search.toLowerCase())||u.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sortDir==='desc'?new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime():new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());

  const card:React.CSSProperties={background:BG,border:`1px solid ${BD}`,borderRadius:12};
  const hdr:React.CSSProperties={fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',letterSpacing:'0.05em'};
  const row:React.CSSProperties={display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 1fr 1fr 1fr auto',gap:14,alignItems:'center',padding:'13px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'};

  return(
    <div style={{display:'flex',flexDirection:'column',gap:20,fontFamily:F}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .urow:hover{background:rgba(255,255,255,0.02)!important}`}</style>
      {selected&&<UserDrawer u={selected} onClose={()=>setSelected(null)} onRefresh={()=>{load();setSelected(null);}}/>}

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'rgba(255,255,255,0.9)',letterSpacing:'-0.02em',marginBottom:4}}>Users</h1>
          <p style={{fontSize:12,color:MT,fontFamily:M}}>{users.length} total · click any row to manage</p>
        </div>
        <button onClick={load} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',border:`1px solid ${BD}`,borderRadius:8,background:'none',color:MT,fontSize:12,cursor:'pointer',fontFamily:F}}>
          <RefreshCw style={{width:13}}/> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{flex:1,minWidth:200,position:'relative'}}>
          <Search style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:13,color:MT}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email or name…" style={{width:'100%',background:'#0d1117',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px 9px 32px',color:TX,fontSize:13,fontFamily:F,outline:'none'}}/>
        </div>
        <select value={planF} onChange={e=>setPlanF(e.target.value)} style={{background:'#0d1117',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px',color:TX,fontSize:13,fontFamily:F,outline:'none'}}>
          <option value="all">All plans</option>
          {['free','individual','professional','agency','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <select value={roleF} onChange={e=>setRoleF(e.target.value)} style={{background:'#0d1117',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px',color:TX,fontSize:13,fontFamily:F,outline:'none'}}>
          <option value="all">All roles</option>
          {['user','consultant','admin','superadmin'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')} style={{display:'flex',alignItems:'center',gap:5,padding:'9px 12px',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,background:'none',color:MT,fontSize:12,cursor:'pointer',fontFamily:F}}>
          {sortDir==='desc'?<ChevronDown style={{width:12}}/>:<ChevronUp style={{width:12}}/>} Date
        </button>
      </div>

      {/* Table */}
      <div style={card}>
        <div style={{...row,cursor:'default',background:'rgba(255,255,255,0.02)',borderBottom:`1px solid ${BD}`}}>
          {['User','Plan','Role','Scans','Clients','Joined',''].map(h=><span key={h} style={hdr}>{h}</span>)}
        </div>
        {loading?(
          <div style={{padding:40,textAlign:'center'}}><div style={{width:22,height:22,border:`2px solid ${G}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>
        ):filtered.length===0?(
          <div style={{padding:48,textAlign:'center',color:MT,fontSize:13}}>No users match your filters.</div>
        ):(
          filtered.map(u=>(
            <div key={u.id} className="urow" onClick={()=>setSelected(u)} style={row}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:`hsl(${(u.email.charCodeAt(0)*17)%360},40%,22%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',flexShrink:0}}>{u.email.slice(0,2).toUpperCase()}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</div>
                  {u.name&&<div style={{fontSize:11,color:MT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>}
                </div>
              </div>
              <span style={{fontSize:10,fontWeight:700,color:PLAN_C[u.plan]??'#6b7280',fontFamily:M}}>{u.plan.toUpperCase()}</span>
              <span style={{fontSize:10,fontWeight:700,color:ROLE_C[u.authRole]??'#6b7280',fontFamily:M}}>{u.authRole.toUpperCase()}</span>
              <span style={{fontSize:13,color:TX,fontFamily:M}}>{u.scansCompleted}</span>
              <span style={{fontSize:13,color:TX,fontFamily:M}}>{u.clientCount}</span>
              <span style={{fontSize:12,color:MT,fontFamily:M,whiteSpace:'nowrap'}}>{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</span>
              <div style={{display:'flex',alignItems:'center',gap:5}}>
                {!u.isActive&&<span style={{width:6,height:6,borderRadius:'50%',background:'#ef4444',display:'inline-block'}}/>}
                {!u.emailConfirmed&&<span style={{fontSize:9,color:'#f97316',fontFamily:M}}>!</span>}
                {u.planOverride&&<span style={{fontSize:9,color:G,fontFamily:M}}>✱</span>}
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{fontSize:11,color:'rgba(255,255,255,0.2)',fontFamily:M,textAlign:'right'}}>{filtered.length} of {users.length} users · ✱ = plan overridden · ! = email unverified</div>
    </div>
  );
}
