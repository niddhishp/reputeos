/**
 * Admin Analytics
 * 
 * Comprehensive analytics dashboard for administrators.
 */

import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Briefcase,
  FileText,
  Activity,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export const metadata = {
  title: 'Analytics | Admin | ReputeOS',
  description: 'System analytics and insights',
};

export default async function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
        <p className="text-neutral-600 mt-1">
          Comprehensive system analytics and insights
        </p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {['7 days', '30 days', '90 days', '1 year'].map((range) => (
              <button
                key={range}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  range === '30 days'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Suspense fallback={<MetricsSkeleton />}>
        <KeyMetrics />
      </Suspense>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <UserGrowthChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ActivityChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ContentChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <PlatformChart />
        </Suspense>
      </div>
    </div>
  );
}

async function KeyMetrics() {
  // In production, fetch from API
  const metrics = [
    { label: 'Total Users', value: '1,234', change: '+12%', icon: Users },
    { label: 'Active Clients', value: '567', change: '+8%', icon: Briefcase },
    { label: 'Content Generated', value: '8,901', change: '+24%', icon: FileText },
    { label: 'Avg. Engagement', value: '4.5%', change: '+2%', icon: Activity },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <metric.icon className="h-5 w-5 text-neutral-400" />
              <span className="text-sm font-medium text-green-600">{metric.change}</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
              <p className="text-sm text-neutral-600">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UserGrowthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          User Growth
        </CardTitle>
        <CardDescription>New user signups over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between gap-2">
          {/* Placeholder bar chart */}
          {Array.from({ length: 30 }).map((_, i) => {
            const height = Math.random() * 80 + 20;
            return (
              <div
                key={i}
                className="flex-1 bg-primary-200 rounded-t"
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Activity Breakdown
        </CardTitle>
        <CardDescription>Actions by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { label: 'Content Generation', value: 45, color: 'bg-blue-500' },
            { label: 'LSI Calculations', value: 30, color: 'bg-green-500' },
            { label: 'Discovery Scans', value: 15, color: 'bg-purple-500' },
            { label: 'Other', value: 10, color: 'bg-neutral-400' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-700">{item.label}</span>
                <span className="text-neutral-500">{item.value}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Content by Platform
        </CardTitle>
        <CardDescription>Content distribution across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { platform: 'LinkedIn', count: 5234, percentage: 58 },
            { platform: 'Twitter', count: 2341, percentage: 26 },
            { platform: 'Medium', count: 890, percentage: 10 },
            { platform: 'Other', count: 436, percentage: 6 },
          ].map((item) => (
            <div key={item.platform} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-neutral-700">
                {item.platform}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
              <div className="w-20 text-right text-sm text-neutral-600">
                {item.count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>API response times and errors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { name: 'API Response Time', value: '120ms', status: 'good' },
            { name: 'Database Queries', value: '45ms', status: 'good' },
            { name: 'AI Generation', value: '850ms', status: 'warning' },
            { name: 'Error Rate', value: '0.2%', status: 'good' },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
            >
              <span className="text-sm font-medium text-neutral-700">{item.name}</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'good'
                      ? 'bg-green-500'
                      : item.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-neutral-600">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-8 w-20 mt-4" />
            <Skeleton className="h-4 w-24 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
