/**
 * Admin Users Management
 * 
 * Page for managing all users in the system. Admins can view,
 * edit roles, ban/unban, and delete users.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAllUsers } from '@/lib/admin/auth';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Shield,
  User,
  Crown,
  Ban,
  Trash2,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow, formatDate } from 'date-fns';

export const metadata = {
  title: 'Users | Admin | ReputeOS',
  description: 'Manage system users',
};

interface UsersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    role?: string;
    status?: string;
  };
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const page = parseInt(searchParams.page || '1', 10);
  const search = searchParams.search;
  const role = searchParams.role as any;
  const status = searchParams.status as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Users</h1>
          <p className="text-neutral-600 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                name="search"
                placeholder="Search by email..."
                defaultValue={search}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                name="role"
                defaultValue={role || ''}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <select
                name="status"
                defaultValue={status || ''}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button type="submit" variant="secondary">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersTable page={page} search={search} role={role} status={status} />
      </Suspense>
    </div>
  );
}

async function UsersTable({
  page,
  search,
  role,
  status,
}: {
  page: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  const { users, total } = await getAllUsers({
    page,
    pageSize: 20,
    search,
    role: role as any,
    status: status as any,
  });

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900">No users found</h3>
          <p className="text-neutral-600 mt-1">
            {search
              ? 'Try adjusting your search filters'
              : 'Get started by adding a new user'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          {total} total user{total !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {user.email.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{user.email}</p>
                      <p className="text-xs text-neutral-500">{user.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <StatusBadge isActive={user.is_active} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">
                    {formatDate(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-neutral-600">
                    {user.last_sign_in_at
                      ? formatDistanceToNow(new Date(user.last_sign_in_at), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </span>
                </TableCell>
                <TableCell>
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          <p className="text-sm text-neutral-600">
            Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild
            >
              <Link
                href={`/admin/users?page=${page - 1}${
                  search ? `&search=${search}` : ''
                }${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}`}
              >
                Previous
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 20 >= total}
              asChild
            >
              <Link
                href={`/admin/users?page=${page + 1}${
                  search ? `&search=${search}` : ''
                }${role ? `&role=${role}` : ''}${status ? `&status=${status}` : ''}`}
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

function RoleBadge({ role }: { role: string }) {
  const configs = {
    superadmin: {
      icon: Crown,
      className: 'bg-purple-100 text-purple-700 border-purple-200',
      label: 'Superadmin',
    },
    admin: {
      icon: Shield,
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      label: 'Admin',
    },
    user: {
      icon: User,
      className: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      label: 'User',
    },
  };

  const config = configs[role as keyof typeof configs] || configs.user;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1 w-fit ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant={isActive ? 'default' : 'secondary'}
      className={isActive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
    >
      {isActive ? 'Active' : 'Banned'}
    </Badge>
  );
}

function UserActions({ user }: { user: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${user.id}`}>
            <User className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`mailto:${user.email}`}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/users/${user.id}/edit`}>
            <Shield className="h-4 w-4 mr-2" />
            Change Role
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={user.is_active ? 'text-red-600' : 'text-green-600'}
        >
          <Ban className="h-4 w-4 mr-2" />
          {user.is_active ? 'Ban User' : 'Unban User'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UsersTableSkeleton() {
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
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
