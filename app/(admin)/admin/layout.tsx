/**
 * Admin Layout
 * 
 * This layout provides the admin dashboard shell with navigation,
 * header, and content area. It protects all admin routes.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  BarChart3,
  FileText,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Clients',
    href: '/admin/clients',
    icon: Briefcase,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'System Logs',
    href: '/admin/logs',
    icon: FileText,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Check if user is admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect('/dashboard');
  }

  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userInitials = user?.email
    ?.split('@')[0]
    ?.slice(0, 2)
    ?.toUpperCase() || 'AD';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-600" />
          <span className="font-bold text-lg">Admin</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileNav userEmail={user?.email} userInitials={userInitials} />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-neutral-200 h-screen sticky top-0">
          {/* Logo */}
          <div className="p-6 border-b border-neutral-100">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-neutral-900">Admin</span>
                <span className="text-xs text-neutral-500 block">ReputeOS</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-auto">
            {adminNavItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-neutral-100">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary-100 text-primary-700 text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-neutral-500 capitalize">
                  {user?.user_metadata?.role || 'Admin'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  App
                </Link>
              </Button>
              <form action="/api/auth/signout" method="post" className="flex-1">
                <Button variant="outline" size="sm" className="w-full" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  title,
  href,
  icon: Icon,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      )}
    >
      <Icon className="h-5 w-5" />
      {title}
    </Link>
  );
}

function MobileNav({
  userEmail,
  userInitials,
}: {
  userEmail?: string;
  userInitials: string;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-neutral-100">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {adminNavItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-100 text-primary-700 text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {userEmail}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/dashboard">App</Link>
          </Button>
          <form action="/api/auth/signout" method="post" className="flex-1">
            <Button variant="outline" size="sm" className="w-full" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
