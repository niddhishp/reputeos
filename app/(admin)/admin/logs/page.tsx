'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const G='#C9A84C',BG='#0d1117',BD='rgba(201,168,76,0.12)',MT='rgba(255,255,255,0.35)',TX='rgba(255,255,255,0.75)';
const F="'Plus Jakarta Sans',system-ui,sans-serif",M="'DM Mono',monospace";

interface ScanEvent {
  id:string; user_id:string|null; client_id:string|null;
  scan_type:string; status:string; duration_ms:number|null;
  total_cost_usd:number|null; sources_queried:number|null;
  results_found:number|null; error_msg:string|null;
  metadata:Record<string,unknown>|null; created_at:string;
}
interface UsageLog {
  id:string; service:string; operation:string; model:string|null;
  user_id:string|null; client_id:string|null; scan_type:string|null;
  tokens_in:number|null; tokens_out:number|null; cost_usd:number|null;
  latency_ms:number|null; status:string; error_msg:string|null; created_at:string;
}

const STATUS_COLOR:Record<string,string>={started:'#f59e0b',completed:'#10b981',failed:'#ef4444',success:'#10b981',error:'#ef4444',timeout:'#f97316'};
const TYPE_COLOR:Record<string,string>={discover:'#3b82f6',lsi:G,legal:'#8b5cf6',content:'#10b981'};

function Dot({status}:{status:string}){return<span style={{width:7,height:7,borderRadius:'50%',background:STATUS_COLOR[status]??'#9ca3af',display:'inline-block',flexShrink:0}}/>;}

export default function LogsPage(){
  const [tab,setTab]=useState<'scans'|'api'>('scans');
  const [scanData,setScanData]=useState<ScanEvent[]>([]);
  const [apiData,setApiData]=useState<UsageLog[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [statusF,setStatusF]=useState('all');
  const [typeF,setTypeF]=useState('all');
  const [expandedId,setExpandedId]=useState<string|null>(null);
  const [page,setPage]=useState(0);
  const PER=50;

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const supabase=(await import('@/lib/supabase/client')).supabase;
      const [s,a]=await Promise.all([
        supabase.from('scan_events').select('*').order('created_at',{ascending:false}).limit(200),
        supabase.from('api_usage_log').select('*').order('created_at',{ascending:false}).limit(500),
      ]);
      setScanData((s.data??[]) as ScanEvent[]);
      setApiData((a.data??[]) as UsageLog[]);
    }catch(e){console.error(e);}
    setLoading(false);
  },[]);
  useEffect(()=>{load();},[load]);

  const filteredScans=scanData
    .filter(s=>statusF==='all'||s.status===statusF)
    .filter(s=>typeF==='all'||s.scan_type===typeF)
    .filter(s=>!search||s.id.includes(search)||s.user_id?.includes(search)||s.scan_type.includes(search));

  const filteredApi=apiData
    .filter(s=>statusF==='all'||s.status===statusF)
    .filter(s=>typeF==='all'||s.service===typeF)
    .filter(s=>!search||s.service.includes(search)||s.operation.includes(search)||(s.model??'').includes(search));

  const card:React.CSSProperties={background:BG,border:`1px solid ${BD}`,borderRadius:12,overflow:'hidden'};
  const hdr:React.CSSProperties={fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',letterSpacing:'0.05em'};

  const scanTypes=[...new Set(scanData.map(s=>s.scan_type))];
  const apiServices=[...new Set(apiData.map(s=>s.service))];

  return(
    <div style={{display:'flex',flexDirection:'column',gap:20,fontFamily:F}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .log-row:hover{background:rgba(255,255,255,0.02)!important}`}</style>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'rgba(255,255,255,0.9)',letterSpacing:'-0.02em',marginBottom:4}}>Scan Logs</h1>
          <p style={{fontSize:12,color:MT,fontFamily:M}}>Scan events · API call history · Error traces</p>
        </div>
        <button onClick={load} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',border:`1px solid ${BD}`,borderRadius:8,background:'none',color:MT,fontSize:12,cursor:'pointer',fontFamily:F}}>
          <RefreshCw style={{width:13}}/> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:4,width:'fit-content'}}>
        {([['scans',`Scan Events (${scanData.length})`],['api',`API Calls (${apiData.length})`]] as const).map(([t,l])=>(
          <button key={t} onClick={()=>{setTab(t);setPage(0);setTypeF('all');setStatusF('all');}} style={{padding:'8px 18px',borderRadius:7,border:'none',background:tab===t?G:'transparent',color:tab===t?'#080C14':MT,fontWeight:tab===t?700:400,fontSize:13,cursor:'pointer',fontFamily:F}}>{l}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{flex:1,minWidth:200,position:'relative'}}>
          <Search style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:13,color:MT}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ID, user, type…" style={{width:'100%',background:'#0d1117',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px 9px 32px',color:TX,fontSize:13,fontFamily:F,outline:'none'}}/>
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)} style={{background:'#0d1117',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px',color:TX,fontSize:13,fontFamily:F,outline:'none'}}>
          <option value="all">All status</option>
          {tab==='scans'?['started','completed','failed'].map(s=><option key={s} value={s}>{s}</option>):['success','error','timeout'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeF} onChange={e=>setTypeF(e.target.value)} style={{background:'#0d1117',border:`1px solid rgba(255,255,255,0.08)`,borderRadius:8,padding:'9px 12px',color:TX,fontSize:13,fontFamily:F,outline:'none'}}>
          <option value="all">{tab==='scans'?'All modules':'All services'}</option>
          {(tab==='scans'?scanTypes:apiServices).map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Scan events table */}
      {tab==='scans'&&(
        <div style={card}>
          <div style={{display:'grid',gridTemplateColumns:'auto 120px 80px 70px 70px 80px 100px',gap:14,alignItems:'center',padding:'11px 18px',background:'rgba(255,255,255,0.02)',borderBottom:`1px solid ${BD}`}}>
            {['','Type','Status','Duration','Cost','Sources','Time'].map(h=><span key={h} style={hdr}>{h}</span>)}
          </div>
          {loading?<div style={{padding:40,textAlign:'center'}}><div style={{width:22,height:22,border:`2px solid ${G}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>
          :filteredScans.length===0?<div style={{padding:40,textAlign:'center',color:MT,fontSize:13}}>No scan events match filters.</div>
          :filteredScans.slice(page*PER,(page+1)*PER).map(s=>(
            <div key={s.id}>
              <div className="log-row" onClick={()=>setExpandedId(expandedId===s.id?null:s.id)} style={{display:'grid',gridTemplateColumns:'auto 120px 80px 70px 70px 80px 100px',gap:14,alignItems:'center',padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)',cursor:'pointer'}}>
                <Dot status={s.status}/>
                <span style={{fontSize:12,color:TYPE_COLOR[s.scan_type]??TX,fontFamily:M,textTransform:'capitalize'}}>{s.scan_type}</span>
                <span style={{fontSize:11,color:STATUS_COLOR[s.status]??MT,fontFamily:M}}>{s.status}</span>
                <span style={{fontSize:12,color:MT,fontFamily:M}}>{s.duration_ms?`${(s.duration_ms/1000).toFixed(1)}s`:'—'}</span>
                <span style={{fontSize:12,color:s.total_cost_usd?G:MT,fontFamily:M}}>{s.total_cost_usd?`$${s.total_cost_usd.toFixed(4)}`:'—'}</span>
                <span style={{fontSize:12,color:MT,fontFamily:M}}>{s.sources_queried??'—'}</span>
                <span style={{fontSize:11,color:MT,fontFamily:M}}>{new Date(s.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              {expandedId===s.id&&(
                <div style={{padding:'14px 18px 16px 40px',background:'rgba(255,255,255,0.01)',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
                    {[
                      ['Scan ID', s.id],
                      ['User ID', s.user_id??'—'],
                      ['Client ID', s.client_id??'—'],
                      ['Results found', String(s.results_found??'—')],
                      ['Error', s.error_msg??'—'],
                    ].map(([k,v])=>(
                      <div key={k}>
                        <div style={{fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',marginBottom:3}}>{k}</div>
                        <div style={{fontSize:12,color:TX,fontFamily:M,wordBreak:'break-all'}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {s.metadata&&<div style={{marginTop:12}}>
                    <div style={{fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',marginBottom:4}}>Metadata</div>
                    <pre style={{fontSize:11,color:MT,fontFamily:M,background:'rgba(0,0,0,0.3)',borderRadius:6,padding:'10px',overflow:'auto',maxHeight:120,margin:0}}>{JSON.stringify(s.metadata,null,2)}</pre>
                  </div>}
                </div>
              )}
            </div>
          ))}
          {/* Pagination */}
          {filteredScans.length>PER&&(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontSize:12,color:MT,fontFamily:M}}>{filteredScans.length} total · showing {page*PER+1}–{Math.min((page+1)*PER,filteredScans.length)}</span>
              <div style={{display:'flex',gap:8}}>
                <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{padding:'6px 12px',border:`1px solid ${BD}`,borderRadius:7,background:'none',color:page===0?'rgba(255,255,255,0.15)':MT,fontSize:12,cursor:page===0?'not-allowed':'pointer',fontFamily:F}}>Prev</button>
                <button disabled={(page+1)*PER>=filteredScans.length} onClick={()=>setPage(p=>p+1)} style={{padding:'6px 12px',border:`1px solid ${BD}`,borderRadius:7,background:'none',color:(page+1)*PER>=filteredScans.length?'rgba(255,255,255,0.15)':MT,fontSize:12,cursor:(page+1)*PER>=filteredScans.length?'not-allowed':'pointer',fontFamily:F}}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* API call log table */}
      {tab==='api'&&(
        <div style={card}>
          <div style={{display:'grid',gridTemplateColumns:'auto 100px 130px 100px 60px 60px 80px 90px',gap:12,alignItems:'center',padding:'11px 18px',background:'rgba(255,255,255,0.02)',borderBottom:`1px solid ${BD}`}}>
            {['','Service','Operation','Model','Tokens','Cost','Latency','Time'].map(h=><span key={h} style={hdr}>{h}</span>)}
          </div>
          {loading?<div style={{padding:40,textAlign:'center'}}><div style={{width:22,height:22,border:`2px solid ${G}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/></div>
          :filteredApi.length===0?<div style={{padding:40,textAlign:'center',color:MT,fontSize:13}}>No API call logs match filters.</div>
          :filteredApi.slice(page*PER,(page+1)*PER).map((a,i)=>(
            <div key={a.id??i} className="log-row" style={{display:'grid',gridTemplateColumns:'auto 100px 130px 100px 60px 60px 80px 90px',gap:12,alignItems:'center',padding:'11px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <Dot status={a.status}/>
              <span style={{fontSize:11,fontWeight:600,color:TX,fontFamily:M}}>{a.service}</span>
              <span style={{fontSize:11,color:MT,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:M}}>{a.operation}</span>
              <span style={{fontSize:10,color:MT,fontFamily:M,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.model?.split('/').pop()??'—'}</span>
              <span style={{fontSize:11,color:MT,fontFamily:M}}>{((a.tokens_in??0)+(a.tokens_out??0)).toLocaleString()}</span>
              <span style={{fontSize:11,color:a.cost_usd?G:MT,fontFamily:M}}>{a.cost_usd?`$${a.cost_usd.toFixed(5)}`:'—'}</span>
              <span style={{fontSize:11,color:MT,fontFamily:M}}>{a.latency_ms?`${a.latency_ms}ms`:'—'}</span>
              <span style={{fontSize:10,color:MT,fontFamily:M}}>{new Date(a.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
            </div>
          ))}
          {filteredApi.length>PER&&(
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 18px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontSize:12,color:MT,fontFamily:M}}>{filteredApi.length} total · showing {page*PER+1}–{Math.min((page+1)*PER,filteredApi.length)}</span>
              <div style={{display:'flex',gap:8}}>
                <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{padding:'6px 12px',border:`1px solid ${BD}`,borderRadius:7,background:'none',color:page===0?'rgba(255,255,255,0.15)':MT,fontSize:12,cursor:page===0?'not-allowed':'pointer',fontFamily:F}}>Prev</button>
                <button disabled={(page+1)*PER>=filteredApi.length} onClick={()=>setPage(p=>p+1)} style={{padding:'6px 12px',border:`1px solid ${BD}`,borderRadius:7,background:'none',color:(page+1)*PER>=filteredApi.length?'rgba(255,255,255,0.15)':MT,fontSize:12,cursor:(page+1)*PER>=filteredApi.length?'not-allowed':'pointer',fontFamily:F}}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
