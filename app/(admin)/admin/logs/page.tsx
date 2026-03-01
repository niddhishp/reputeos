/**
 * Admin System Logs
 * 
 * View and search system activity logs for auditing and debugging.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  FileText,
  User,
  Briefcase,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { formatDistanceToNow, formatDate } from 'date-fns';

export const metadata = {
  title: 'System Logs | Admin | ReputeOS',
  description: 'View system activity logs',
};

interface LogsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    action?: string;
  }>;
}

export default async function AdminLogsPage({ searchParams }: LogsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search;
  const action = params.action;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">System Logs</h1>
        <p className="text-neutral-600 mt-1">
          View and search system activity for auditing
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                name="search"
                placeholder="Search logs..."
                defaultValue={search}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="action"
                defaultValue={action || ''}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Actions</option>
                <option value="user_created">User Created</option>
                <option value="user_updated">User Updated</option>
                <option value="user_deleted">User Deleted</option>
                <option value="client_created">Client Created</option>
                <option value="content_generated">Content Generated</option>
                <option value="lsi_calculated">LSI Calculated</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
              <Button type="submit" variant="secondary">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Suspense fallback={<LogsTableSkeleton />}>
        <LogsTable page={page} search={search} action={action} />
      </Suspense>
    </div>
  );
}

async function LogsTable({
  page,
  search,
  action,
}: {
  page: number;
  search?: string;
  action?: string;
}) {
  await requireAdmin();

  const supabase = await createClient();
  const pageSize = 50;

  // Build query
  let query = supabase
    .from('activity_log')
    .select(
      `
      *,
      user: user_id (email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (action) {
    query = query.eq('action', action);
  }

  const { data: logs, error, count } = await query;

  if (error) {
    console.error('Failed to fetch logs:', error);
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-600">Failed to load logs. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900">No logs found</h3>
          <p className="text-neutral-600 mt-1">
            {action ? 'Try adjusting your filters' : 'No activity logged yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>
          {total} total log entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {formatDate(new Date(log.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600">
                        {(log.user as any)?.email || 'System'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.entity_type && (
                      <div className="flex items-center gap-2">
                        <EntityIcon type={log.entity_type} />
                        <span className="text-sm text-neutral-600 capitalize">
                          {log.entity_type}
                        </span>
                        {log.entity_id && (
                          <span className="text-xs text-neutral-400">
                            {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-neutral-50 rounded text-xs overflow-auto max-w-xs">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-sm text-neutral-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          <p className="text-sm text-neutral-600">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild
            >
              <Link
                href={`/admin/logs?page=${page - 1}${
                  search ? `&search=${search}` : ''
                }${action ? `&action=${action}` : ''}`}
              >
                Previous
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= total}
              asChild
            >
              <Link
                href={`/admin/logs?page=${page + 1}${
                  search ? `&search=${search}` : ''
                }${action ? `&action=${action}` : ''}`}
              >
                Next
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionBadge({ action }: { action: string }) {
  const configs: Record<string, { className: string; icon: React.ComponentType<{ className?: string }> }> = {
    user_created: { className: 'bg-green-100 text-green-700 border-green-200', icon: User },
    user_updated: { className: 'bg-blue-100 text-blue-700 border-blue-200', icon: User },
    user_deleted: { className: 'bg-red-100 text-red-700 border-red-200', icon: User },
    client_created: { className: 'bg-green-100 text-green-700 border-green-200', icon: Briefcase },
    content_generated: { className: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileText },
    lsi_calculated: { className: 'bg-orange-100 text-orange-700 border-orange-200', icon: Activity },
    login: { className: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: CheckCircle },
    logout: { className: 'bg-neutral-100 text-neutral-700 border-neutral-200', icon: Info },
  };

  const config = configs[action] || { className: 'bg-neutral-100 text-neutral-700', icon: Info };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{action.replace(/_/g, ' ')}</span>
    </Badge>
  );
}

function EntityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    user: User,
    client: Briefcase,
    content: FileText,
    lsi: Activity,
  };

  const Icon = icons[type] || AlertCircle;
  return <Icon className="h-4 w-4 text-neutral-400" />;
}

function LogsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
