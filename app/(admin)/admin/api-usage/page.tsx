'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, AlertTriangle, TrendingDown, Zap, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

const G='#C9A84C',BG='#0d1117',BD='rgba(201,168,76,0.12)',MT='rgba(255,255,255,0.35)',TX='rgba(255,255,255,0.75)';
const F="'Plus Jakarta Sans',system-ui,sans-serif",M="'DM Mono',monospace";

// Estimated costs per call for non-token services
const SVC_INFO: Record<string,{color:string;label:string;costNote:string;docsUrl:string}> = {
  openrouter:  { color:'#6366f1', label:'OpenRouter',   costNote:'$0.00025–$0.015 / 1K tokens',  docsUrl:'https://openrouter.ai/docs' },
  anthropic:   { color:'#f59e0b', label:'Anthropic',    costNote:'$0.00025–$0.015 / 1K tokens',  docsUrl:'https://docs.anthropic.com' },
  openai:      { color:'#10b981', label:'OpenAI',       costNote:'$0.00015–$0.015 / 1K tokens',  docsUrl:'https://platform.openai.com' },
  serpapi:     { color:'#3b82f6', label:'SerpAPI',      costNote:'~$0.005 / search',              docsUrl:'https://serpapi.com' },
  exa:         { color:'#8b5cf6', label:'Exa.ai',       costNote:'~$0.001 / search',              docsUrl:'https://docs.exa.ai' },
  firecrawl:   { color:'#f97316', label:'Firecrawl',    costNote:'~$0.003 / page',                docsUrl:'https://docs.firecrawl.dev' },
  apify:       { color:'#ef4444', label:'Apify',        costNote:'Usage-based',                   docsUrl:'https://docs.apify.com' },
};

interface UsageData {
  period: { days:number; since:string };
  summary: { totalCost:number; totalCalls:number; totalTokens:number; errorRate:number; totalScans:number };
  byService: Record<string,{calls:number;errors:number;cost:number;tokens:number;avgLatency:number}>;
  byScanType: Record<string,{total:number;completed:number;failed:number;cost:number}>;
  topUsers: Array<{userId:string;cost:number;calls:number;tokens:number}>;
  recentErrors: Array<{service:string;operation:string;error_msg:string;created_at:string;model:string}>;
  recentScans: Array<{scan_type:string;status:string;duration_ms:number;total_cost_usd:number;user_id:string;created_at:string}>;
}

function KPI({label,value,sub,color='rgba(255,255,255,0.9)'}:{label:string;value:string|number;sub?:string;color?:string}) {
  return (
    <div style={{background:BG,border:`1px solid ${BD}`,borderRadius:12,padding:'18px 20px'}}>
      <div style={{fontSize:11,color:MT,fontFamily:M,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>{label}</div>
      <div style={{fontSize:28,fontWeight:800,color,fontFamily:M,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:MT,marginTop:6}}>{sub}</div>}
    </div>
  );
}

function MiniBar({pct,color}:{pct:number;color:string}) {
  return <div style={{width:'100%',height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
    <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:color,borderRadius:2,transition:'width 0.6s ease'}}/>
  </div>;
}

export default function ApiUsagePage() {
  const [data,setData]=useState<UsageData|null>(null);
  const [loading,setLoading]=useState(true);
  const [days,setDays]=useState(30);
  const [expandSvc,setExpandSvc]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);
    try {
      const r=await fetch(`/api/admin/usage?days=${days}`);
      const d=await r.json() as UsageData;
      setData(d);
    } catch(e){console.error(e);}
    setLoading(false);
  },[days]);

  useEffect(()=>{load();},[load]);

  const card:React.CSSProperties={background:BG,border:`1px solid ${BD}`,borderRadius:12,padding:'22px 24px'};
  const maxCost=Math.max(...Object.values(data?.byService??{}).map(s=>s.cost),0.0001);

  const statusColor=(s:string)=>s==='completed'?'#10b981':s==='failed'?'#ef4444':'#f59e0b';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24,fontFamily:F}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .svc-row:hover{background:rgba(255,255,255,0.02)!important}`}</style>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:14}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:'rgba(255,255,255,0.9)',letterSpacing:'-0.02em',marginBottom:4}}>API Usage</h1>
          <p style={{fontSize:12,color:MT,fontFamily:M}}>External service costs · Token spend · Error rates</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {[7,30,90].map(d=>(
            <button key={d} onClick={()=>setDays(d)} style={{padding:'7px 14px',border:`1px solid ${days===d?G:BD}`,borderRadius:8,background:days===d?'rgba(201,168,76,0.08)':'none',color:days===d?G:MT,fontSize:12,cursor:'pointer',fontFamily:M}}>
              {d}d
            </button>
          ))}
          <button onClick={load} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',border:`1px solid ${BD}`,borderRadius:8,background:'none',color:MT,fontSize:12,cursor:'pointer',fontFamily:F}}>
            <RefreshCw style={{width:13,animation:loading?'spin 1s linear infinite':undefined}}/> Refresh
          </button>
        </div>
      </div>

      {loading&&!data?(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}>
          <div style={{width:24,height:24,border:`2px solid ${G}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        </div>
      ):(
        <>
          {/* KPI row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14}}>
            <KPI label="Total Spend" value={`$${(data?.summary?.totalCost??0).toFixed(4)}`} color={G} sub={`${days} day window`}/>
            <KPI label="API Calls" value={(data?.summary?.totalCalls??0).toLocaleString()} sub="all services"/>
            <KPI label="Tokens Used" value={((data?.summary?.totalTokens??0)/1000).toFixed(1)+'K'} sub="in + out combined"/>
            <KPI label="Error Rate" value={`${data?.summary?.errorRate??0}%`} color={(data?.summary?.errorRate??0)>5?'#ef4444':(data?.summary?.errorRate??0)>2?'#f59e0b':'#10b981'} sub="across all services"/>
            <KPI label="Total Scans" value={data?.summary?.totalScans??0} sub="completed scan runs"/>
          </div>

          {/* Service breakdown */}
          <div style={card}>
            <div style={{fontSize:12,color:MT,fontFamily:M,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:20}}>Per-Service Breakdown</div>
            {Object.keys(data?.byService??{}).length===0?(
              <div style={{textAlign:'center',padding:'32px 0',color:MT,fontSize:13}}>
                No usage data yet. Run a scan to populate this.
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {Object.entries(data?.byService??{})
                  .sort((a,b)=>b[1].cost-a[1].cost)
                  .map(([svc,s])=>{
                    const info=SVC_INFO[svc]??{color:'#9ca3af',label:svc,costNote:'',docsUrl:''};
                    const expanded=expandSvc===svc;
                    return (
                      <div key={svc}>
                        <div className="svc-row" onClick={()=>setExpandSvc(expanded?null:svc)} style={{display:'grid',gridTemplateColumns:'180px 1fr 80px 80px 100px 90px',gap:16,alignItems:'center',padding:'14px 16px',borderRadius:10,cursor:'pointer',transition:'background 150ms'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:10,height:10,borderRadius:'50%',background:info.color,flexShrink:0}}/>
                            <div>
                              <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.85)'}}>{info.label}</div>
                              <div style={{fontSize:10,color:MT,fontFamily:M}}>{info.costNote}</div>
                            </div>
                          </div>
                          <div style={{paddingRight:16}}>
                            <MiniBar pct={s.cost/maxCost*100} color={info.color}/>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:12,color:TX,fontFamily:M}}>{s.calls.toLocaleString()}</div>
                            <div style={{fontSize:10,color:MT}}>calls</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:12,color:s.errors>0?'#f97316':'#10b981',fontFamily:M}}>{s.errors}</div>
                            <div style={{fontSize:10,color:MT}}>errors</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:12,color:MT,fontFamily:M}}>{s.avgLatency}ms</div>
                            <div style={{fontSize:10,color:MT}}>avg latency</div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontSize:14,fontWeight:700,color:G,fontFamily:M}}>${s.cost.toFixed(4)}</div>
                            <div style={{fontSize:10,color:MT}}>{(s.cost/Math.max(data?.summary?.totalCost??1,0.0001)*100).toFixed(1)}% of total</div>
                          </div>
                        </div>
                        {expanded&&(
                          <div style={{margin:'0 16px 8px',padding:'14px 16px',background:'rgba(255,255,255,0.02)',borderRadius:8,border:`1px solid rgba(255,255,255,0.06)`}}>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:12}}>
                              <div><div style={{fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',marginBottom:4}}>Total Tokens</div><div style={{fontSize:18,fontWeight:700,color:TX,fontFamily:M}}>{s.tokens.toLocaleString()}</div></div>
                              <div><div style={{fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',marginBottom:4}}>Error Rate</div><div style={{fontSize:18,fontWeight:700,color:s.errors>0?'#f97316':'#10b981',fontFamily:M}}>{s.calls>0?((s.errors/s.calls)*100).toFixed(1):0}%</div></div>
                              <div><div style={{fontSize:10,color:MT,fontFamily:M,textTransform:'uppercase',marginBottom:4}}>Cost / Call</div><div style={{fontSize:18,fontWeight:700,color:TX,fontFamily:M}}>${s.calls>0?(s.cost/s.calls).toFixed(5):0}</div></div>
                            </div>
                            {info.docsUrl&&<a href={info.docsUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:G,fontFamily:M}}>→ {info.docsUrl}</a>}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {/* Scan type breakdown */}
            <div style={card}>
              <div style={{fontSize:12,color:MT,fontFamily:M,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:18}}>Scans by Module</div>
              {Object.keys(data?.byScanType??{}).length===0?(
                <div style={{color:MT,fontSize:13,textAlign:'center',padding:'20px 0'}}>No scan data yet.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {Object.entries(data?.byScanType??{}).sort((a,b)=>b[1].total-a[1].total).map(([type,s])=>(
                    <div key={type} style={{display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:12,alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:TX,textTransform:'capitalize'}}>{type}</div>
                        <div style={{fontSize:11,color:MT,marginTop:2}}>
                          <span style={{color:'#10b981'}}>{s.completed} ok</span>
                          {s.failed>0&&<span style={{color:'#ef4444',marginLeft:8}}>{s.failed} failed</span>}
                        </div>
                      </div>
                      <div style={{fontSize:12,color:MT,textAlign:'right',fontFamily:M}}>{s.total}<br/><span style={{fontSize:10}}>total</span></div>
                      <div style={{fontSize:12,color:TX,textAlign:'right',fontFamily:M}}>{s.total>0?Math.round(s.completed/s.total*100):0}%<br/><span style={{fontSize:10,color:MT}}>success</span></div>
                      <div style={{fontSize:13,fontWeight:700,color:G,textAlign:'right',fontFamily:M}}>${s.cost.toFixed(4)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent scans */}
            <div style={card}>
              <div style={{fontSize:12,color:MT,fontFamily:M,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:18}}>Recent Scan Events</div>
              {!data?.recentScans?.length?(
                <div style={{color:MT,fontSize:13,textAlign:'center',padding:'20px 0'}}>No scan events yet.</div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {data.recentScans.slice(0,8).map((s,i)=>(
                    <div key={i} style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto',gap:10,alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:statusColor(s.status),flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:12,color:TX,textTransform:'capitalize'}}>{s.scan_type}</div>
                        <div style={{fontSize:11,color:MT,fontFamily:M}}>{new Date(s.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <div style={{fontSize:11,color:MT,fontFamily:M,textAlign:'right'}}>{s.duration_ms?`${(s.duration_ms/1000).toFixed(1)}s`:'—'}</div>
                      <div style={{fontSize:12,fontWeight:600,color:G,fontFamily:M,textAlign:'right'}}>{s.total_cost_usd?`$${s.total_cost_usd.toFixed(4)}`:'—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent errors */}
          {(data?.recentErrors?.length??0)>0&&(
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
                <AlertTriangle style={{width:14,color:'#f97316'}}/>
                <span style={{fontSize:12,color:MT,fontFamily:M,letterSpacing:'0.06em',textTransform:'uppercase'}}>Recent API Errors</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {data!.recentErrors.map((e,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'90px auto 1fr auto',gap:14,alignItems:'center',padding:'11px 14px',background:'rgba(249,115,22,0.04)',border:'1px solid rgba(249,115,22,0.1)',borderRadius:9}}>
                    <span style={{fontSize:11,fontWeight:700,color:'#f97316',fontFamily:M}}>{e.service}</span>
                    {e.model&&<span style={{fontSize:10,color:MT,fontFamily:M,whiteSpace:'nowrap'}}>{e.model.split('/').pop()}</span>}
                    <span style={{fontSize:12,color:TX,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.error_msg||e.operation}</span>
                    <span style={{fontSize:11,color:MT,fontFamily:M,whiteSpace:'nowrap'}}>{new Date(e.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top users by cost */}
          {(data?.topUsers?.length??0)>0&&(
            <div style={card}>
              <div style={{fontSize:12,color:MT,fontFamily:M,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:18}}>Top Users by API Spend</div>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {data!.topUsers.slice(0,10).map((u,i)=>(
                  <div key={u.userId} style={{display:'grid',gridTemplateColumns:'24px 1fr auto auto auto',gap:14,alignItems:'center',padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <span style={{fontSize:12,color:MT,fontFamily:M}}>#{i+1}</span>
                    <span style={{fontSize:12,color:TX,fontFamily:M,overflow:'hidden',textOverflow:'ellipsis'}}>{u.userId.slice(0,8)}…</span>
                    <span style={{fontSize:11,color:MT,fontFamily:M}}>{u.calls} calls</span>
                    <span style={{fontSize:11,color:MT,fontFamily:M}}>{(u.tokens/1000).toFixed(1)}K tok</span>
                    <span style={{fontSize:13,fontWeight:700,color:G,fontFamily:M}}>${u.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
