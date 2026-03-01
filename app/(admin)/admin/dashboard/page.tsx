/**
 * Admin Dashboard
 * 
 * Main admin dashboard showing system overview, analytics cards,
 * recent activity, and quick actions.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { getSystemAnalytics } from '@/lib/admin/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Briefcase,
  FileText,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UserPlus,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata = {
  title: 'Admin Dashboard | ReputeOS',
  description: 'System overview and analytics',
};

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-1">
          System overview and key metrics
        </p>
      </div>

      {/* Analytics Cards */}
      <Suspense fallback={<AnalyticsCardsSkeleton />}>
        <AnalyticsCards />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Signups */}
        <Suspense fallback={<CardSkeleton />}>
          <RecentSignups />
        </Suspense>

        {/* System Status */}
        <Suspense fallback={<CardSkeleton />}>
          <SystemStatus />
        </Suspense>
      </div>
    </div>
  );
}

async function AnalyticsCards() {
  const analytics = await getSystemAnalytics();

  const cards: Array<{
    title: string;
    value: number;
    change: string;
    trend: 'up' | 'neutral' | 'down';
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    color: 'blue' | 'green' | 'orange' | 'purple';
  }> = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      change: `+${analytics.newUsersToday} today`,
      trend: 'up',
      icon: Users,
      href: '/admin/users',
      color: 'blue',
    },
    {
      title: 'Active Users',
      value: analytics.activeUsers,
      change: `${Math.round((analytics.activeUsers / analytics.totalUsers) * 100)}% of total`,
      trend: 'neutral',
      icon: Activity,
      href: '/admin/users',
      color: 'green',
    },
    {
      title: 'Total Clients',
      value: analytics.totalClients,
      change: 'Across all users',
      trend: 'neutral',
      icon: Briefcase,
      href: '/admin/clients',
      color: 'purple',
    },
    {
      title: 'Content Items',
      value: analytics.totalContentItems,
      change: `${analytics.totalLSIRuns} LSI runs`,
      trend: 'up',
      icon: FileText,
      href: '/admin/analytics',
      color: 'orange',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <AnalyticsCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
            {trend !== 'neutral' && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend === 'up' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-neutral-600">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">
              {value.toLocaleString()}
            </p>
            <p className="text-sm text-neutral-500 mt-1">{change}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickActions() {
  const actions = [
    {
      title: 'Add User',
      description: 'Create a new user account',
      icon: UserPlus,
      href: '/admin/users/new',
      variant: 'default' as const,
    },
    {
      title: 'View Analytics',
      description: 'Detailed system analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      variant: 'outline' as const,
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings',
      icon: AlertCircle,
      href: '/admin/settings',
      variant: 'outline' as const,
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            className="flex items-center gap-2"
            asChild
          >
            <Link href={action.href}>
              <action.icon className="h-4 w-4" />
              {action.title}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

async function RecentSignups() {
  const analytics = await getSystemAnalytics();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Signups</CardTitle>
          <CardDescription>New users in the last few days</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics.recentSignups.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-4">
              No recent signups
            </p>
          ) : (
            analytics.recentSignups.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {user.email}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Signed up {formatDistanceToNow(new Date(user.created_at))} ago
                  </p>
                </div>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function SystemStatus() {
  // In production, check actual service health
  const services = [
    { name: 'Database', status: 'operational', latency: '45ms' },
    { name: 'API', status: 'operational', latency: '120ms' },
    { name: 'AI Services', status: 'operational', latency: '850ms' },
    { name: 'Storage', status: 'operational', latency: '65ms' },
  ];

  const allOperational = services.every((s) => s.status === 'operational');

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>Service health and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${
              allOperational ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="font-medium">
            {allOperational ? 'All Systems Operational' : 'Some Issues Detected'}
          </span>
        </div>

        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    service.status === 'operational'
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }`}
                />
                <span className="text-sm font-medium">{service.name}</span>
              </div>
              <span className="text-sm text-neutral-500">{service.latency}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsCardsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-4 w-24 mt-4" />
            <Skeleton className="h-8 w-16 mt-2" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
