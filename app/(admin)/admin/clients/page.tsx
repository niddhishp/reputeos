/**
 * Admin Clients Management
 * 
 * Page for viewing and managing all clients across all users.
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Briefcase,
  MoreHorizontal,
  ExternalLink,
  User,
  BarChart3,
  FileText,
} from 'lucide-react';
import { formatDate } from 'date-fns';

export const metadata = {
  title: 'Clients | Admin | ReputeOS',
  description: 'Manage all clients',
};

interface ClientsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search;
  const status = params.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Clients</h1>
        <p className="text-neutral-600 mt-1">
          View and manage all clients across the platform
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
                placeholder="Search by name, company, or email..."
                defaultValue={search}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="status"
                defaultValue={status || ''}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="paused">Paused</option>
              </select>
              <Button type="submit" variant="secondary">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsTable page={page} search={search} status={status} />
      </Suspense>
    </div>
  );
}

async function ClientsTable({
  page,
  search,
  status,
}: {
  page: number;
  search?: string;
  status?: string;
}) {
  await requireAdmin();

  const supabase = await createClient();
  const pageSize = 20;

  // Build query
  let query = supabase
    .from('clients')
    .select(
      `
      *,
      user: user_id (email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: clients, error, count } = await query;

  if (error) {
    console.error('Failed to fetch clients:', error);
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-red-600">Failed to load clients. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Briefcase className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900">No clients found</h3>
          <p className="text-neutral-600 mt-1">
            {search ? 'Try adjusting your search filters' : 'No clients in the system yet'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = count || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Clients</CardTitle>
        <CardDescription>
          {total} total client{total !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client: any) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {client.name?.slice(0, 2).toUpperCase() || 'CL'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{client.name}</p>
                      <p className="text-xs text-neutral-500">
                        {client.company || 'No company'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600">
                      {(client.user as any)?.email || 'Unknown'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={client.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">
                    {formatDate(new Date(client.created_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <ClientActions clientId={client.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
                href={`/admin/clients?page=${page - 1}${
                  search ? `&search=${search}` : ''
                }${status ? `&status=${status}` : ''}`}
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
                href={`/admin/clients?page=${page + 1}${
                  search ? `&search=${search}` : ''
                }${status ? `&status=${status}` : ''}`}
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

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { className: string; label: string }> = {
    active: {
      className: 'bg-green-100 text-green-700 border-green-200',
      label: 'Active',
    },
    archived: {
      className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      label: 'Archived',
    },
    paused: {
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      label: 'Paused',
    },
  };

  const config = configs[status] || configs.active;

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function ClientActions({ clientId }: { clientId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/clients/${clientId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/clients/${clientId}/analytics`}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/clients/${clientId}/content`}>
            <FileText className="h-4 w-4 mr-2" />
            Content
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClientsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
