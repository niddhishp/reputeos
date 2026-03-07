'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Activity, FileText,
  Settings, Shield, LogOut, ChevronRight,
  CreditCard, Terminal, BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const GOLD    = '#C9A84C';
const BG      = '#080C14';
const SIDEBAR = '#0a0f1a';
const BORDER  = 'rgba(201,168,76,0.1)';
const MUTED   = 'rgba(255,255,255,0.3)';

const NAV = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/users',         icon: Users,           label: 'Users' },
  { href: '/admin/subscriptions', icon: CreditCard,      label: 'Subscriptions' },
  { href: '/admin/api-usage',     icon: Activity,        label: 'API Usage' },
  { href: '/admin/prompts',       icon: Terminal,        label: 'Prompt Editor' },
  { href: '/admin/logs',          icon: FileText,        label: 'Scan Logs' },
  { href: '/admin/settings',      icon: Settings,        label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [email, setEmail]   = useState('');
  const [authed, setAuthed] = useState(false);
  const [ready,  setReady]  = useState(false);
  const font = "'Plus Jakarta Sans', system-ui, sans-serif";

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const role = user.user_metadata?.role as string;
      if (!['admin','superadmin'].includes(role)) { router.replace('/dashboard/clients'); return; }
      setEmail(user.email ?? '');
      setAuthed(true);
      setReady(true);
    }
    check();
  }, [router]);

  if (!ready) return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:24, height:24, border:`2px solid ${GOLD}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!authed) return null;

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:font, display:'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:4px}
        .nav-link:hover{background:rgba(255,255,255,0.04)!important;color:rgba(255,255,255,0.8)!important}
        .nav-active{background:rgba(201,168,76,0.08)!important;color:${GOLD}!important}
        .adm-btn:hover{background:rgba(255,255,255,0.06)!important}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width:220, background:SIDEBAR, borderRight:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:40 }}>
        <div style={{ padding:'20px 18px 16px', borderBottom:`1px solid ${BORDER}` }}>
          <Link href="/admin/dashboard" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'rgba(201,168,76,0.1)', border:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Shield style={{ width:16, color:GOLD }} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'white', letterSpacing:'-0.01em' }}>ReputeOS</div>
              <div style={{ fontSize:10, color:GOLD, fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em' }}>ADMIN PANEL</div>
            </div>
          </Link>
        </div>

        <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href+'/');
            return (
              <Link key={href} href={href} className={`nav-link${active?' nav-active':''}`} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:500,
                color: active ? GOLD : MUTED, transition:'all 150ms',
              }}>
                <Icon style={{ width:15, flexShrink:0 }} />{label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding:'14px 12px', borderTop:`1px solid ${BORDER}` }}>
          <div style={{ fontSize:11, color:MUTED, fontFamily:"'DM Mono',monospace", marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingLeft:2 }}>{email}</div>
          <div style={{ display:'flex', gap:6 }}>
            <Link href="/dashboard/clients" className="adm-btn" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'7px', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:7, fontSize:11, color:MUTED, textDecoration:'none', transition:'all 150ms' }}>
              <BarChart3 style={{ width:12 }} /> App
            </Link>
            <button onClick={async()=>{ await supabase.auth.signOut(); router.push('/login'); }} className="adm-btn" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'7px', border:`1px solid rgba(255,255,255,0.07)`, borderRadius:7, fontSize:11, color:MUTED, background:'none', cursor:'pointer', fontFamily:font, transition:'all 150ms' }}>
              <LogOut style={{ width:12 }} /> Out
            </button>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft:220, flex:1, minHeight:'100vh', padding:'32px 36px', maxWidth:'calc(100vw - 220px)', overflowX:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28, fontSize:12, color:MUTED }}>
          <span style={{ color:GOLD, fontFamily:"'DM Mono',monospace", fontSize:11 }}>ADMIN</span>
          <ChevronRight style={{ width:12 }} />
          <span>{NAV.find(n=>pathname===n.href||pathname.startsWith(n.href+'/'))?.label??'Panel'}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
