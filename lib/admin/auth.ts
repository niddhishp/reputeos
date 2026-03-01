/**
 * Admin Authentication & Authorization
 * 
 * This module provides admin-specific authentication and authorization utilities.
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// Supabase Admin API user shape (superset of the public User type)
interface AdminApiUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  banned_at?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Check user metadata for role
  const role = user.user_metadata?.role as UserRole;
  return role === 'admin' || role === 'superadmin';
}

/**
 * Check if the current user is a superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const role = user.user_metadata?.role as UserRole;
  return role === 'superadmin';
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
}

/**
 * Require superadmin access - throws if not superadmin
 */
export async function requireSuperAdmin(): Promise<void> {
  const isUserSuperAdmin = await isSuperAdmin();
  
  if (!isUserSuperAdmin) {
    throw new Error('Forbidden: Superadmin access required');
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  status?: 'active' | 'inactive' | 'all';
} = {}): Promise<{ users: AdminUser[]; total: number }> {
  await requireAdmin();

  const { page = 1, pageSize = 20, search, role, status = 'all' } = options;

  const adminSupabase = createAdminClient();

  // Build query
  let query = adminSupabase.auth.admin.listUsers({
    page,
    perPage: pageSize,
  });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  let users = data.users.map((user: AdminApiUser): AdminUser => ({
    id: user.id,
    email: user.email || '',
    role: (user.user_metadata?.role as UserRole) || 'user',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    is_active: !user.banned_at,
  }));

  // Apply filters (client-side since Supabase Auth API has limited filtering)
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(
      (u: AdminUser) =>
        u.email.toLowerCase().includes(searchLower) ||
        u.id.toLowerCase().includes(searchLower)
    );
  }

  if (role) {
    users = users.filter((u: AdminUser) => u.role === role);
  }

  if (status !== 'all') {
    users = users.filter((u: AdminUser) =>
      status === 'active' ? u.is_active : !u.is_active
    );
  }

  return { users, total: data.total };
}

/**
 * Update user role (superadmin only)
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  await requireSuperAdmin();

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });

  if (error) {
    throw error;
  }
}

/**
 * Ban/unban user (admin only)
 */
export async function setUserBanned(
  userId: string,
  banned: boolean
): Promise<void> {
  await requireAdmin();

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    ban_duration: banned ? '876000h' : 'none', // 100 years or unban
  });

  if (error) {
    throw error;
  }
}

/**
 * Delete user (superadmin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  await requireSuperAdmin();

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }
}

/**
 * Get system analytics (admin only)
 */
export async function getSystemAnalytics(): Promise<{
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalClients: number;
  totalContentItems: number;
  totalLSIRuns: number;
  recentSignups: AdminUser[];
}> {
  await requireAdmin();

  const supabase = await createClient();

  // Get user stats
  const adminSupabase = createAdminClient();
  const { data: usersData } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000,
  });

  const totalUsers = usersData?.total || 0;
  const activeUsers =
    usersData?.users.filter((u: AdminApiUser) => !u.banned_at).length || 0;

  // New users today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newUsersToday =
    usersData?.users.filter((u: AdminApiUser) => new Date(u.created_at) >= today).length || 0;

  // Get database stats
  const [{ count: totalClients }, { count: totalContentItems }, { count: totalLSIRuns }] =
    await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('content_items').select('*', { count: 'exact', head: true }),
      supabase.from('lsi_runs').select('*', { count: 'exact', head: true }),
    ]);

  // Recent signups
  const recentSignups = (usersData?.users || [])
    .sort((a: AdminApiUser, b: AdminApiUser) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((user: AdminApiUser): AdminUser => ({
      id: user.id,
      email: user.email || '',
      role: (user.user_metadata?.role as UserRole) || 'user',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      is_active: !user.banned_at,
    }));

  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    totalClients: totalClients || 0,
    totalContentItems: totalContentItems || 0,
    totalLSIRuns: totalLSIRuns || 0,
    recentSignups,
  };
}
