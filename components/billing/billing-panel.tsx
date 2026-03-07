'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Zap, RefreshCw, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
const GOLD='#C9A84C',CARD='#0d1117',BORDER='rgba(201,168,76,0.12)',font="'Plus Jakarta Sans',system-ui,sans-serif";
interface Ents{planId:string|null;addOns:string[];scanCredits:number;remainingScans:number;isTrial:boolean;trialEndsAt:string|null;subscriptionStatus:string|null}
const PLAN_LABELS:Record<string,string>={solo:'Solo',agency:'Agency',enterprise:'Enterprise'};
const PLAN_LIMITS:Record<string,number>={solo:30,agency:200,enterprise:-1};
const CREDITS=[{id:'scan_credits_20',label:'20 Scans',price:'₹999'},{id:'scan_credits_100',label:'100 Scans',price:'₹3,999'}];
const sColor=(s:string|null)=>s==='active'||s==='trialing'?'#10b981':s==='past_due'?'#f59e0b':s==='cancelled'?'#ef4444':'rgba(255,255,255,0.3)';
export function BillingPanel(){
  const[ents,setEnts]=useState<Ents|null>(null);
  const[loading,setLoading]=useState(true);
  const[portalLoading,setPL]=useState(false);
  const[creditLoading,setCL]=useState<string|null>(null);
  useEffect(()=>{fetch('/api/stripe/entitlements').then(r=>r.json()).then(d=>setEnts(d as Ents)).finally(()=>setLoading(false));},[]);
  async function openPortal(){setPL(true);const r=await fetch('/api/stripe/portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});const d=await r.json() as{url?:string};if(d.url)window.location.href=d.url;setPL(false);}
  async function buyCredits(id:string){setCL(id);const r=await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'addon',id})});const d=await r.json() as{url?:string};if(d.url)window.location.href=d.url;setCL(null);}
  if(loading)return<div style={{display:'flex',alignItems:'center',gap:10,padding:24,color:'rgba(255,255,255,0.4)',fontFamily:font}}><RefreshCw style={{width:15,animation:'spin 1s linear infinite'}}/>Loading…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  const planLabel=ents?.planId?PLAN_LABELS[ents.planId]??ents.planId:null;
  const monthlyLimit=ents?.planId?PLAN_LIMITS[ents.planId]??0:0;
  const isUnlimited=monthlyLimit===-1;
  const trialDaysLeft=ents?.trialEndsAt?Math.max(0,Math.ceil((new Date(ents.trialEndsAt).getTime()-Date.now())/86400000)):0;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:20,fontFamily:font}}>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'24px 28px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:8}}>Current Plan</div>
            {planLabel?<div style={{fontSize:26,fontWeight:800,color:'white'}}>{planLabel}</div>:<div style={{fontSize:18,color:'rgba(255,255,255,0.5)'}}>No active plan</div>}
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:sColor(ents?.subscriptionStatus??null)}}/>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.4)',textTransform:'capitalize'}}>{ents?.subscriptionStatus??'none'}</span>
              {ents?.isTrial&&trialDaysLeft>0&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'rgba(201,168,76,0.1)',color:GOLD,border:`1px solid ${BORDER}`}}>{trialDaysLeft}d trial left</span>}
            </div>
          </div>
          <div>
            {ents?.subscriptionStatus==='active'||ents?.subscriptionStatus==='trialing'?
              <button onClick={openPortal} disabled={portalLoading} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:9,background:'rgba(201,168,76,0.08)',border:`1px solid ${BORDER}`,color:GOLD,fontSize:13,fontWeight:600,fontFamily:font,cursor:'pointer'}}>
                <CreditCard style={{width:14}}/>{portalLoading?'Opening…':'Manage Billing'}<ExternalLink style={{width:12,opacity:0.6}}/>
              </button>:
              <a href="/pricing" style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:9,background:GOLD,color:'#000',fontSize:13,fontWeight:700,textDecoration:'none'}}>
                <Zap style={{width:14}}/>Upgrade Plan
              </a>}
          </div>
        </div>
        {ents?.subscriptionStatus==='past_due'&&<div style={{marginTop:16,padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8,display:'flex',gap:10,alignItems:'flex-start'}}>
          <AlertTriangle style={{width:15,color:'#f59e0b',flexShrink:0,marginTop:1}}/>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.5}}>Payment failed. <button onClick={openPortal} style={{background:'none',border:'none',color:'#f59e0b',cursor:'pointer',fontFamily:font,fontSize:12,fontWeight:600}}>Fix now →</button></span>
        </div>}
      </div>
      <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'24px 28px'}}>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:16}}>Scan Credits</div>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:20}}>
          <span style={{fontSize:36,fontWeight:800,color:'white'}}>{isUnlimited?'∞':ents?.remainingScans??0}</span>
          {!isUnlimited&&<span style={{fontSize:14,color:'rgba(255,255,255,0.3)'}}>/ {monthlyLimit} this month</span>}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {CREDITS.map(opt=><button key={opt.id} onClick={()=>buyCredits(opt.id)} disabled={creditLoading===opt.id} style={{padding:'8px 16px',borderRadius:8,cursor:'pointer',fontFamily:font,background:'rgba(201,168,76,0.08)',color:GOLD,border:`1px solid ${BORDER}`,fontSize:13,fontWeight:600,opacity:creditLoading===opt.id?0.5:1}}>{creditLoading===opt.id?'…':`Buy ${opt.label} — ${opt.price}`}</button>)}
        </div>
      </div>
      {(ents?.addOns??[]).length>0&&<div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:'24px 28px'}}>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:16}}>Active Add-ons</div>
        {(ents?.addOns??[]).map(a=><div key={a} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:8}}><CheckCircle style={{width:14,color:'#10b981'}}/>{a.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</div>)}
      </div>}
    </div>
  );
}
