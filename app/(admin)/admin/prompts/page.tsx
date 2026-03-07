'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronRight, Save, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, Terminal, Beaker } from 'lucide-react';

const G='#C9A84C',BG='#0d1117',BD='rgba(201,168,76,0.12)',MT='rgba(255,255,255,0.35)',TX='rgba(255,255,255,0.75)';
const F="'Plus Jakarta Sans',system-ui,sans-serif",M="'DM Mono',monospace";

const MODULE_COLOR: Record<string,string> = {
  discover:'#3b82f6', diagnose:G, position:'#8b5cf6',
  express:'#10b981', shield:'#ef4444', general:'#9ca3af',
};

interface Prompt {
  id:string; key:string; module:string; label:string; description:string;
  system_prompt:string; user_prompt_template:string; model:string|null;
  temperature:number; max_tokens:number; is_active:boolean;
  updated_at:string; updated_by:string|null;
}

interface SaveState { [key:string]: 'idle'|'saving'|'saved'|'error' }

function PromptCard({ p, onSave }: { p:Prompt; onSave:(key:string, changes:Partial<Prompt>)=>Promise<void> }) {
  const [open, setOpen]     = useState(false);
  const [draft, setDraft]   = useState<Partial<Prompt>>({});
  const [saveState, setSaveState] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const modColor = MODULE_COLOR[p.module] ?? '#9ca3af';

  const current = { ...p, ...draft };

  async function save() {
    if (!Object.keys(draft).length) return;
    setSaveState('saving');
    try {
      await onSave(p.key, draft);
      setDraft({});
      setSaveState('saved');
      setTimeout(()=>setSaveState('idle'), 2000);
    } catch { setSaveState('error'); }
  }

  async function test() {
    if (!testInput.trim()) return;
    setTesting(true); setTestResult('');
    try {
      const r = await fetch('/api/admin/test-prompt', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          systemPrompt: current.system_prompt,
          userPrompt: testInput,
          model: current.model ?? 'fast',
          temperature: current.temperature,
          maxTokens: Math.min(current.max_tokens, 1000),
        }),
      });
      const d = await r.json() as { result?:string; error?:string };
      setTestResult(d.result ?? d.error ?? 'No response');
    } catch(e) { setTestResult(e instanceof Error ? e.message : 'Failed'); }
    setTesting(false);
  }

  const hasChanges = Object.keys(draft).length > 0;
  const ta:React.CSSProperties = { width:'100%', background:'#080C14', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'12px', color:TX, fontSize:12, fontFamily:M, outline:'none', resize:'vertical', lineHeight:1.6 };
  const inp:React.CSSProperties = { background:'#080C14', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'8px 10px', color:TX, fontSize:12, fontFamily:M, outline:'none' };
  const lbl:React.CSSProperties = { fontSize:10, color:MT, fontFamily:M, textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 };

  return (
    <div style={{ background:BG, border:`1px solid ${open ? BD : 'rgba(255,255,255,0.06)'}`, borderRadius:12, overflow:'hidden', transition:'all 150ms' }}>
      {/* Header row */}
      <div onClick={()=>setOpen(!open)} style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', cursor:'pointer' }}>
        <div style={{ width:3, height:32, borderRadius:4, background:modColor, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.88)' }}>{p.label}</span>
            <span style={{ fontSize:9, fontWeight:700, color:modColor, background:`${modColor}15`, border:`1px solid ${modColor}30`, borderRadius:4, padding:'1px 6px', fontFamily:M, textTransform:'uppercase' }}>{p.module}</span>
            {!p.is_active && <span style={{ fontSize:9, color:'#ef4444', fontFamily:M }}>DISABLED</span>}
            {hasChanges && <span style={{ fontSize:9, color:'#f59e0b', fontFamily:M }}>● UNSAVED</span>}
          </div>
          {p.description && <div style={{ fontSize:11, color:MT, marginTop:3 }}>{p.description}</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {saveState === 'saved' && <CheckCircle style={{ width:14, color:'#10b981' }}/>}
          {saveState === 'error' && <AlertTriangle style={{ width:14, color:'#ef4444' }}/>}
          <span style={{ fontSize:11, color:MT, fontFamily:M }}>{p.key}</span>
          {open ? <ChevronDown style={{ width:14, color:MT }}/> : <ChevronRight style={{ width:14, color:MT }}/>}
        </div>
      </div>

      {/* Expanded editor */}
      {open && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
            {/* System prompt */}
            <div style={{ gridColumn:'span 2' }}>
              <label style={lbl}>System Prompt</label>
              <textarea
                value={current.system_prompt}
                onChange={e=>setDraft(d=>({...d,system_prompt:e.target.value}))}
                rows={8}
                style={ta}
                spellCheck={false}
              />
            </div>

            {/* User prompt template */}
            <div style={{ gridColumn:'span 2' }}>
              <label style={lbl}>User Prompt Template <span style={{ color:'rgba(255,255,255,0.2)', fontWeight:400, textTransform:'none' }}>(use {'{'+'variable'+'}'} for dynamic values)</span></label>
              <textarea
                value={current.user_prompt_template ?? ''}
                onChange={e=>setDraft(d=>({...d,user_prompt_template:e.target.value}))}
                rows={3}
                style={ta}
                placeholder="Optional — leave blank to use runtime user prompt"
                spellCheck={false}
              />
            </div>

            {/* Model */}
            <div>
              <label style={lbl}>Model Override</label>
              <select value={current.model ?? ''} onChange={e=>setDraft(d=>({...d,model:e.target.value||null}))} style={{...inp,width:'100%'}}>
                <option value="">Default (smart = sonnet)</option>
                <option value="fast">fast (claude-haiku)</option>
                <option value="smart">smart (claude-sonnet)</option>
                <option value="anthropic/claude-sonnet-4-6">claude-sonnet-4-6</option>
                <option value="anthropic/claude-haiku-4-5">claude-haiku-4-5</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
              </select>
            </div>

            {/* Temperature */}
            <div>
              <label style={lbl}>Temperature — {current.temperature}</label>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="range" min="0" max="1" step="0.05" value={current.temperature}
                  onChange={e=>setDraft(d=>({...d,temperature:parseFloat(e.target.value)}))}
                  style={{ flex:1, accentColor:G }}/>
                <input type="number" min="0" max="1" step="0.05" value={current.temperature}
                  onChange={e=>setDraft(d=>({...d,temperature:parseFloat(e.target.value)}))}
                  style={{...inp,width:70}}/>
              </div>
            </div>

            {/* Max tokens */}
            <div>
              <label style={lbl}>Max Tokens</label>
              <input type="number" value={current.max_tokens} min="100" max="16000" step="100"
                onChange={e=>setDraft(d=>({...d,max_tokens:parseInt(e.target.value,10)}))}
                style={{...inp,width:'100%'}}/>
            </div>

            {/* Active toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <label style={{...lbl,marginBottom:0}}>Active</label>
              <button onClick={()=>setDraft(d=>({...d,is_active:!current.is_active}))} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color: current.is_active ? '#10b981' : '#ef4444', padding:0 }}>
                {current.is_active
                  ? <ToggleRight style={{ width:28 }}/>
                  : <ToggleLeft style={{ width:28 }}/>}
                <span style={{ fontSize:12, fontFamily:M }}>{current.is_active ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          </div>

          {/* Last updated info */}
          {p.updated_at && (
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontFamily:M, marginBottom:16 }}>
              Last saved: {new Date(p.updated_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
            </div>
          )}

          {/* Save row */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <button onClick={save} disabled={!hasChanges || saveState==='saving'} style={{
              display:'flex', alignItems:'center', gap:7, padding:'10px 18px',
              background: hasChanges ? G : 'rgba(255,255,255,0.04)',
              color: hasChanges ? '#080C14' : MT,
              border:`1px solid ${hasChanges?G:'rgba(255,255,255,0.08)'}`,
              borderRadius:8, fontWeight:700, fontSize:13, cursor: hasChanges?'pointer':'not-allowed',
              fontFamily:F, opacity:saveState==='saving'?0.7:1,
            }}>
              <Save style={{ width:13 }}/> {saveState==='saving'?'Saving…':saveState==='saved'?'Saved ✓':saveState==='error'?'Error — retry':'Save Changes'}
            </button>
            {hasChanges && (
              <button onClick={()=>setDraft({})} style={{ padding:'10px 16px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, background:'none', color:MT, fontSize:13, cursor:'pointer', fontFamily:F }}>
                Discard
              </button>
            )}
          </div>

          {/* Test panel */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <Beaker style={{ width:13, color:MT }}/>
              <span style={{ fontSize:11, color:MT, fontFamily:M, textTransform:'uppercase', letterSpacing:'0.05em' }}>Quick Test (charges ~$0.001)</span>
            </div>
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <input value={testInput} onChange={e=>setTestInput(e.target.value)} placeholder="Enter a test user prompt…" style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey)test();}}/>
              <button onClick={test} disabled={testing||!testInput.trim()} style={{ padding:'8px 16px', background:'rgba(201,168,76,0.08)', border:`1px solid ${BD}`, borderRadius:8, color:G, fontSize:12, cursor: testing||!testInput.trim()?'not-allowed':'pointer', fontFamily:F, opacity:testing?0.7:1 }}>
                {testing ? 'Running…' : 'Run'}
              </button>
            </div>
            {testResult && (
              <div style={{ padding:'12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, fontSize:12, color:TX, fontFamily:M, whiteSpace:'pre-wrap', maxHeight:200, overflowY:'auto', lineHeight:1.5 }}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/prompts');
      const d = await r.json() as { prompts:Prompt[] };
      if (d.prompts) setPrompts(d.prompts);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(()=>{ load(); }, [load]);

  async function handleSave(key:string, changes:Partial<Prompt>) {
    const r = await fetch('/api/admin/prompts', {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({key, ...changes}),
    });
    if (!r.ok) { const d = await r.json() as {error?:string}; throw new Error(d.error ?? 'Save failed'); }
    // Refresh local state
    const updated = await r.json() as { prompt:Prompt };
    setPrompts(ps => ps.map(p => p.key === key ? updated.prompt : p));
  }

  const modules = ['all', ...Array.from(new Set(prompts.map(p=>p.module))).sort()];
  const filtered = filter==='all' ? prompts : prompts.filter(p=>p.module===filter);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, fontFamily:F }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,0.9)', letterSpacing:'-0.02em', marginBottom:4 }}>Prompt Editor</h1>
          <p style={{ fontSize:12, color:MT, fontFamily:M }}>Edit AI system prompts live — changes take effect immediately</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:`1px solid ${BD}`, borderRadius:8, background:'none', color:MT, fontSize:12, cursor:'pointer', fontFamily:F }}>
          <RefreshCw style={{ width:13 }}/> Refresh
        </button>
      </div>

      {/* Warning */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
        <AlertTriangle style={{ width:14, color:'#f59e0b', flexShrink:0, marginTop:1 }}/>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.6 }}>
          Changes are live immediately. Prompts stored in the <code style={{ fontFamily:M, color:G, fontSize:11 }}>system_prompts</code> table. Bad prompts will break scans — test before saving. Disable a prompt with the toggle to fall back to hardcoded defaults.
        </div>
      </div>

      {/* Module filter tabs */}
      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
        {modules.map(m=>(
          <button key={m} onClick={()=>setFilter(m)} style={{
            padding:'7px 14px', border:`1px solid ${filter===m?(MODULE_COLOR[m]??G)+'60':BD}`,
            borderRadius:8, background: filter===m ? `${MODULE_COLOR[m]??G}10` : 'none',
            color: filter===m ? (MODULE_COLOR[m]??G) : MT,
            fontSize:12, cursor:'pointer', fontFamily:M, textTransform:'uppercase', letterSpacing:'0.04em',
          }}>{m} {m!=='all'&&`(${prompts.filter(p=>p.module===m).length})`}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}>
          <div style={{ width:24, height:24, border:`2px solid ${G}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 0', color:MT, fontSize:13 }}>
          No prompts found. Run migration 014 in Supabase SQL editor first.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(p => <PromptCard key={p.key} p={p} onSave={handleSave}/>)}
        </div>
      )}
    </div>
  );
}
