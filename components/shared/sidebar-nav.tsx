// components/shared/sidebar-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  Search,
  BarChart2,
  Target,
  PenLine,
  CheckSquare,
  Shield,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

const modules = [
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Discover', hrefPattern: '/discover', icon: Search },
  { label: 'Diagnose', hrefPattern: '/diagnose', icon: BarChart2 },
  { label: 'Position', hrefPattern: '/position', icon: Target },
  { label: 'Express', hrefPattern: '/express', icon: PenLine },
  { label: 'Validate', hrefPattern: '/validate', icon: CheckSquare },
  { label: 'Shield', hrefPattern: '/shield', icon: Shield },
];

interface SidebarNavProps {
  user: User;
}

export function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName =
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-neutral-200 transition-all duration-200 min-h-screen',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600 shrink-0" />
            <span className="font-bold text-neutral-900">ReputeOS</span>
          </div>
        )}
        {collapsed && <Shield className="h-6 w-6 text-blue-600 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {modules.map((item) => {
          const isActive = item.href
            ? pathname.startsWith(item.href)
            : item.hrefPattern
            ? pathname.includes(item.hrefPattern)
            : false;

          const href = item.href ?? '#';

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-neutral-100 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors',
            pathname.startsWith('/settings') && 'bg-blue-50 text-blue-700'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2',
            collapsed ? 'justify-center' : ''
          )}
        >
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-900 truncate">{displayName}</p>
              <p className="text-xs text-neutral-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
