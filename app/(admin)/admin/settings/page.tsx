'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Key, AlertTriangle, CheckCircle, XCircle, RefreshCw,
  Copy, Eye, EyeOff, Zap, Globe, ToggleLeft, ToggleRight, ExternalLink,
} from 'lucide-react';

const G='#C9A84C', BG='#0d1117', BD='rgba(201,168,76,0.12)', MT='rgba(255,255,255,0.35)', TX='rgba(255,255,255,0.75)';
const F="'Plus Jakarta Sans',system-ui,sans-serif", M="'DM Mono',monospace";

const ENV_VARS = [
  { key:'OPENROUTER_API_KEY',             label:'OpenRouter',       group:'AI',       docsUrl:'https://openrouter.ai/settings/keys',               critical:true  },
  { key:'ANTHROPIC_API_KEY',              label:'Anthropic',        group:'AI',       docsUrl:'https://console.anthropic.com/settings/keys',       critical:false },
  { key:'OPENAI_API_KEY',                 label:'OpenAI',           group:'AI',       docsUrl:'https://platform.openai.com/api-keys',              critical:false },
  { key:'SERPAPI_API_KEY',                label:'SerpAPI',          group:'Search',   docsUrl:'https://serpapi.com/dashboard',                     critical:true  },
  { key:'EXA_API_KEY',                    label:'Exa.ai',           group:'Search',   docsUrl:'https://dashboard.exa.ai/api-keys',                 critical:false },
  { key:'FIRECRAWL_API_KEY',              label:'Firecrawl',        group:'Scraping', docsUrl:'https://www.firecrawl.dev/app/api-keys',            critical:false },
  { key:'APIFY_API_TOKEN',                label:'Apify',            group:'Scraping', docsUrl:'https://console.apify.com/account/integrations',    critical:false },
  { key:'NEXT_PUBLIC_SUPABASE_URL',       label:'Supabase URL',     group:'Database', docsUrl:'https://app.supabase.com/project/_/settings/api',  critical:true  },
  { key:'NEXT_PUBLIC_SUPABASE_ANON_KEY',  label:'Supabase Anon',    group:'Database', docsUrl:'https://app.supabase.com/project/_/settings/api',  critical:true  },
  { key:'SUPABASE_SERVICE_ROLE_KEY',      label:'Supabase Service', group:'Database', docsUrl:'https://app.supabase.com/project/_/settings/api',  critical:true  },
  { key:'NEXT_PUBLIC_APP_URL',            label:'App URL',          group:'Config',   docsUrl:'https://vercel.com/dashboard',                     critical:false },
] as const;

const GROUPS = ['AI','Search','Scraping','Database','Config'] as const;
const GROUP_COLOR: Record<string,string> = { AI:'#8b5cf6', Search:'#3b82f6', Scraping:'#f97316', Database:'#10b981', Config:G };

interface Feature { key:string; label:string; description:string; enabled:boolean; tag?:string }
const DEFAULT_FEATURES: Feature[] = [
  { key:'discover_scan',      label:'Discovery Scan',           description:'Run automated digital footprint scans',       enabled:true },
  { key:'lsi_scoring',        label:'LSI Scoring',              description:'Calculate reputation scores (LSI)',           enabled:true },
  { key:'ai_archetype',       label:'AI Archetype Assignment',  description:'Use AI to assign strategic archetypes',       enabled:true },
  { key:'content_generation', label:'Content Generation',       description:'AI-powered thought leadership content',       enabled:true },
  { key:'shield_legal',       label:'Shield Pro — Legal',       description:'Legal database scan (agency+ only)',          enabled:true, tag:'AGENCY+' },
  { key:'board_reports',      label:'Board Reports (PDF/PPTX)', description:'Export polished reports',                    enabled:true },
  { key:'influencer_intel',   label:'Influencer Intelligence',  description:'Discover and analyse target influencers',    enabled:true },
  { key:'ai_narrative',       label:'AI Narrative Layer',       description:'Generate plain-language reputation narratives', enabled:true },
];

function Section({ title, icon:Icon, children }: { title:string; icon:React.ElementType; children:React.ReactNode }) {
  return (
    <div style={{ background:BG, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'15px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <Icon style={{ width:14, color:G }} />
        <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.85)' }}>{title}</span>
      </div>
      <div style={{ padding:'20px 22px' }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [envStatus, setEnvStatus] = useState<Record<string,'present'|'missing'|'loading'>>({});
  const [envLoading, setEnvLoading] = useState(false);
  const [features, setFeatures]     = useState<Feature[]>(DEFAULT_FEATURES);
  const [copied, setCopied]          = useState(false);
  const [revealKeys, setRevealKeys]  = useState(false);
  const [dangerMsg, setDangerMsg]    = useState('');

  const checkEnv = useCallback(async () => {
    setEnvLoading(true);
    try {
      const r = await fetch('/api/debug/env-check');
      const d = await r.json() as Record<string, unknown>;
      const status: Record<string,'present'|'missing'> = {};
      // env-check now returns flat { KEY: true|false, present:[...], missing:[...] }
      for (const [k, v] of Object.entries(d)) {
        // Only process env var keys (all caps with underscores), skip 'present'/'missing' arrays
        if (/^[A-Z][A-Z0-9_]+$/.test(k)) {
          status[k] = v === true ? 'present' : 'missing';
        }
      }
      setEnvStatus(status);
    } catch { /* silent */ }
    setEnvLoading(false);
  }, []);

  useEffect(() => { checkEnv(); }, [checkEnv]);

  function copyTemplate() {
    const lines = ENV_VARS.map(v => `${v.key}=`).join('\n');
    navigator.clipboard.writeText(lines);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function runDanger(label: string, fn: () => Promise<string>) {
    setDangerMsg('Running…');
    try { setDangerMsg(await fn()); }
    catch(e) { setDangerMsg(e instanceof Error ? e.message : 'Failed'); }
    setTimeout(() => setDangerMsg(''), 4000);
  }

  const missingCritical = ENV_VARS.filter(v => v.critical && envStatus[v.key] === 'missing');
  const presentCount = Object.values(envStatus).filter(v=>v==='present').length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22, fontFamily:F }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.02em', marginBottom:4 }}>Settings</h1>
        <p style={{ fontSize:12, color:MT, fontFamily:M }}>Environment config · Feature flags · System health</p>
      </div>

      {missingCritical.length > 0 && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10 }}>
          <AlertTriangle style={{ width:14, color:'#ef4444', flexShrink:0, marginTop:1 }} />
          <div style={{ fontSize:12, color:TX, lineHeight:1.6 }}>
            <strong style={{ color:'#ef4444' }}>Critical keys missing: </strong>
            {missingCritical.map(v=>v.label).join(', ')} — set in Vercel → Project → Settings → Environment Variables.
          </div>
        </div>
      )}

      {/* ENV VARS */}
      <Section title="Environment Variables" icon={Key}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:12, color:MT }}>
            {envLoading ? 'Checking…' : `${presentCount} / ${ENV_VARS.length} keys detected`}
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={copyTemplate} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', border:`1px solid ${BD}`, borderRadius:8, background:'none', color:MT, fontSize:12, cursor:'pointer', fontFamily:F }}>
              <Copy style={{ width:12 }} />{copied ? 'Copied!' : '.env template'}
            </button>
            <button onClick={checkEnv} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', border:`1px solid ${BD}`, borderRadius:8, background:'none', color:MT, fontSize:12, cursor:'pointer', fontFamily:F }}>
              <RefreshCw style={{ width:12, animation:envLoading?'spin 1s linear infinite':undefined }} /> Recheck
            </button>
          </div>
        </div>

        {GROUPS.map(group => {
          const vars = ENV_VARS.filter(v => v.group === group);
          const gc = GROUP_COLOR[group];
          return (
            <div key={group} style={{ marginBottom:18 }}>
              <div style={{ fontSize:10, fontWeight:700, color:gc, fontFamily:M, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:gc }}/>{group}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {vars.map(v => {
                  const st = envStatus[v.key];
                  return (
                    <div key={v.key} style={{ display:'grid', gridTemplateColumns:'180px 1fr 24px 24px', gap:12, alignItems:'center', padding:'9px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${st==='missing'&&v.critical?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.05)'}`, borderRadius:8 }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:TX }}>{v.label}</div>
                        {v.critical && <div style={{ fontSize:9, color:'#ef4444', fontFamily:M }}>REQUIRED</div>}
                      </div>
                      <code style={{ fontSize:10, color:MT, fontFamily:M, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {revealKeys ? v.key : v.key.slice(0,12)+'…'}
                      </code>
                      <div style={{ display:'flex', justifyContent:'center' }}>
                        {st === undefined || envLoading
                          ? <div style={{ width:11, height:11, border:'1px solid rgba(255,255,255,0.2)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
                          : st === 'present'
                            ? <CheckCircle style={{ width:14, color:'#10b981' }}/>
                            : <XCircle style={{ width:14, color: v.critical ? '#ef4444' : '#f59e0b' }}/>
                        }
                      </div>
                      <a href={v.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color:MT, display:'flex', justifyContent:'center' }}>
                        <ExternalLink style={{ width:12 }}/>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <button onClick={()=>setRevealKeys(!revealKeys)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:MT, fontFamily:F, fontSize:12, marginTop:6 }}>
          {revealKeys ? <EyeOff style={{ width:12 }}/> : <Eye style={{ width:12 }}/>}
          {revealKeys ? 'Hide key names' : 'Show full key names'}
        </button>
      </Section>

      {/* FEATURE FLAGS */}
      <Section title="Feature Flags" icon={ToggleRight}>
        <div style={{ fontSize:12, color:MT, marginBottom:14 }}>In-memory toggles. Persisted per-session only — real persistence needs a DB feature_flags table.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {features.map(f => (
            <div key={f.key} style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:20, alignItems:'center', padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:9 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:TX }}>{f.label}</span>
                  {f.tag && <span style={{ fontSize:9, fontWeight:700, color:G, background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:4, padding:'1px 6px', fontFamily:M }}>{f.tag}</span>}
                </div>
                <div style={{ fontSize:11, color:MT, marginTop:2 }}>{f.description}</div>
              </div>
              <button onClick={()=>setFeatures(fs=>fs.map(x=>x.key===f.key?{...x,enabled:!x.enabled}:x))} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', color:f.enabled?'#10b981':MT, padding:0, fontFamily:F }}>
                {f.enabled ? <ToggleRight style={{ width:26 }}/> : <ToggleLeft style={{ width:26 }}/>}
                <span style={{ fontSize:11, fontFamily:M }}>{f.enabled?'ON':'OFF'}</span>
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* PLAN REFERENCE */}
      <Section title="Plan Limits Reference" icon={Zap}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${BD}` }}>
                {['Plan','Clients','Scans/mo','AI Calls/mo','Reports','Shield Pro'].map(h=>(
                  <th key={h} style={{ padding:'8px 14px', textAlign:'left', color:MT, fontSize:10, fontFamily:M, textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Free','1','2','20','—','—'],
                ['Individual','3','10','100','PDF','—'],
                ['Professional','10','50','500','PDF+PPTX','—'],
                ['Agency','50','200','2000','All','✓'],
                ['Enterprise','Unlimited','Unlimited','Unlimited','All','✓'],
              ].map(([plan,...cols])=>(
                <tr key={plan} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding:'10px 14px', color:G, fontWeight:700, fontFamily:M }}>{plan}</td>
                  {cols.map((c,i)=>(
                    <td key={i} style={{ padding:'10px 14px', color:c==='✓'?'#10b981':c==='—'?MT:TX, fontFamily:M }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* DANGER ZONE */}
      <Section title="Danger Zone" icon={AlertTriangle}>
        {dangerMsg && (
          <div style={{ padding:'10px 14px', background:'rgba(201,168,76,0.06)', border:`1px solid ${BD}`, borderRadius:8, fontSize:12, color:G, fontFamily:M, marginBottom:14 }}>{dangerMsg}</div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            {
              label:'Check Database Connection',
              desc:'Ping Supabase and count tables.',
              color:'#3b82f6',
              fn: async () => {
                const { supabase } = await import('@/lib/supabase/client');
                const { count } = await supabase.from('clients').select('*',{count:'exact',head:true});
                return `DB OK — ${count??0} clients in table`;
              },
            },
            {
              label:'Flush Demo Clients',
              desc:'Delete all clients where is_demo = true.',
              color:'#f59e0b',
              fn: async () => {
                if (!confirm('Delete all demo clients? Cannot be undone.')) return 'Cancelled';
                const { supabase } = await import('@/lib/supabase/client');
                const { error } = await supabase.from('clients').delete().eq('is_demo',true);
                return error ? `Error: ${error.message}` : 'Demo clients deleted';
              },
            },
            {
              label:'Prune Old API Usage Logs (30d+)',
              desc:'Remove api_usage_log rows older than 30 days.',
              color:'#ef4444',
              fn: async () => {
                if (!confirm('Delete api_usage_log rows older than 30 days?')) return 'Cancelled';
                const cutoff = new Date(Date.now()-30*86400_000).toISOString();
                const { supabase } = await import('@/lib/supabase/client');
                const { error, count } = await supabase.from('api_usage_log').delete({count:'exact'}).lt('created_at',cutoff);
                return error ? `Error: ${error.message}` : `Deleted ${count??0} rows`;
              },
            },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', background:`${item.color}08`, border:`1px solid ${item.color}22`, borderRadius:9 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:TX }}>{item.label}</div>
                <div style={{ fontSize:11, color:MT, marginTop:2 }}>{item.desc}</div>
              </div>
              <button onClick={()=>runDanger(item.label, item.fn)} style={{ padding:'7px 15px', border:`1px solid ${item.color}50`, borderRadius:8, background:`${item.color}10`, color:item.color, fontSize:12, cursor:'pointer', fontFamily:F, flexShrink:0, marginLeft:14 }}>
                Run
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* QUICK LINKS */}
      <Section title="Quick Links" icon={Globe}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:8 }}>
          {[
            ['Supabase Dashboard',  'https://app.supabase.com'],
            ['Vercel Dashboard',    'https://vercel.com/dashboard'],
            ['OpenRouter Account',  'https://openrouter.ai/account'],
            ['SerpAPI Dashboard',   'https://serpapi.com/dashboard'],
            ['Exa Dashboard',       'https://dashboard.exa.ai'],
            ['Firecrawl Dashboard', 'https://www.firecrawl.dev/app'],
          ].map(([label,url])=>(
            <a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, textDecoration:'none', color:TX, fontSize:12 }}>
              {label} <ExternalLink style={{ width:11, color:MT }}/>
            </a>
          ))}
        </div>
      </Section>

      <div style={{ fontSize:11, color:'rgba(255,255,255,0.15)', fontFamily:M, textAlign:'center' }}>
        ReputeOS Admin · env checks via /api/debug/env-check
      </div>
    </div>
  );
}
