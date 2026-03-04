'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  Search, BarChart2, Target, PenLine, CheckSquare,
  Shield, Users, UserCircle, Settings, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SidebarNavProps { user: User; role?: string; }

const GOLD = '#C9A84C';
const BG   = '#080C14';

// Extract clientId from pathname like /dashboard/clients/[uuid]/...
function getClientIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/dashboard\/clients\/([0-9a-f-]{36})/i);
  return m ? m[1] : null;
}

export function SidebarNav({ user, role = 'consultant' }: SidebarNavProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isIndividual = role === 'individual';
  const clientId     = getClientIdFromPath(pathname);

  const topLinks = [
    {
      label: isIndividual ? 'My Profile' : 'Clients',
      href: '/dashboard/clients',
      icon: isIndividual ? UserCircle : Users,
    },
  ];

  const moduleLinks = clientId
    ? [
        { label: 'Discover', href: `/dashboard/clients/${clientId}/discover`,  icon: Search },
        { label: 'Diagnose', href: `/dashboard/clients/${clientId}/diagnose`,  icon: BarChart2 },
        { label: 'Position', href: `/dashboard/clients/${clientId}/position`,  icon: Target },
        { label: 'Express',  href: `/dashboard/clients/${clientId}/express`,   icon: PenLine },
        { label: 'Validate', href: `/dashboard/clients/${clientId}/validate`,  icon: CheckSquare },
        { label: 'Shield',   href: `/dashboard/clients/${clientId}/shield`,    icon: Shield },
      ]
    : [];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }) {
    const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard/clients');
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '9px 0' : '9px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 500,
          textDecoration: 'none', transition: 'all 150ms',
          backgroundColor: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
          color: isActive ? GOLD : 'rgba(255,255,255,0.4)',
          border: `1px solid ${isActive ? 'rgba(201,168,76,0.18)' : 'transparent'}`,
        }}
        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; } }}
        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; } }}
      >
        <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  }

  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', backgroundColor: BG,
      borderRight: '1px solid rgba(255,255,255,0.06)', minHeight: '100vh',
      width: collapsed ? 64 : 220, transition: 'width 200ms ease', flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            backgroundColor: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield style={{ width: 15, height: 15, color: GOLD }} />
          </div>
          {!collapsed && <span style={{ fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.3px' }}>ReputeOS</span>}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ position: 'absolute', left: 52, background: BG, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '2px 3px', borderRadius: 4, display: 'flex', alignItems: 'center', zIndex: 10 }}>
            <ChevronRight style={{ width: 11, height: 11 }} />
          </button>
        )}
      </div>

      {/* Role pill */}
      {!collapsed && (
        <div style={{ padding: '7px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
            {isIndividual ? 'Personal' : 'Consultant'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {topLinks.map(l => <NavLink key={l.label} {...l} />)}

        {/* Module links — only shown when inside a client */}
        {moduleLinks.length > 0 && (
          <>
            {!collapsed && (
              <div style={{ padding: '10px 12px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginTop: 6 }}>
                Modules
              </div>
            )}
            {collapsed && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 4px' }} />}
            {moduleLinks.map(l => <NavLink key={l.label} {...l} />)}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <NavLink href="/dashboard/settings" label="Settings" icon={Settings} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '6px 0' : '8px 12px', justifyContent: collapsed ? 'center' : 'flex-start', marginTop: 4 }}>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{displayName}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
