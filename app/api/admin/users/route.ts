/**
 * Admin Users API
 * 
 * GET /api/admin/users - List all users
 * POST /api/admin/users - Create new user
 */

import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin, requireSuperAdmin, UserRole } from '@/lib/admin/auth';
import { strictRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit';

interface SupabaseAdminUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  banned_at?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}

// GET - List all users
export async function GET(request: Request): Promise<Response> {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await strictRateLimiter.limit(clientIP);

    if (!rateLimitResult.success) {
      return createRateLimitResponse({
        success: false,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
    }

    // Check admin access
    await requireAdmin();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') as UserRole | undefined;
    const status = searchParams.get('status') as 'active' | 'inactive' | undefined;

    // Get users using admin client
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });

    if (error) {
      console.error('Failed to fetch users:', error);
      return Response.json(
        { error: 'Database error', message: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform and filter users
    interface MappedUser { id: string; email: string | undefined; role: string; created_at: string; last_sign_in_at: string | null | undefined; is_active: boolean; email_confirmed_at: string | null | undefined; }
    let users: MappedUser[] = data.users.map((user: SupabaseAdminUser) => ({
      id: user.id,
      email: user.email,
      role: (user.user_metadata?.role as UserRole) || 'user',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      is_active: !user.banned_at,
      email_confirmed_at: user.email_confirmed_at,
    }));

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u: MappedUser) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.id.toLowerCase().includes(searchLower)
      );
    }

    if (role) {
      users = users.filter((u: MappedUser) => u.role === role);
    }

    if (status) {
      users = users.filter((u: MappedUser) => (status === 'active' ? u.is_active : !u.is_active));
    }

    return Response.json({
      success: true,
      users,
      pagination: {
        page,
        pageSize,
        total: data.total,
        totalPages: Math.ceil(data.total / pageSize),
      },
    });

  } catch (error) {
    console.error('Get users error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin', 'superadmin']).default('user'),
  emailConfirmed: z.boolean().default(false),
});

export async function POST(request: Request): Promise<Response> {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await strictRateLimiter.limit(clientIP);

    if (!rateLimitResult.success) {
      return createRateLimitResponse({
        success: false,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      });
    }

    // Check superadmin access for creating admin users
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: 'Invalid input',
          message: 'Request body failed validation',
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, role, emailConfirmed } = parsed.data;

    // Require superadmin for creating admin/superadmin users
    if (role === 'admin' || role === 'superadmin') {
      await requireSuperAdmin();
    } else {
      await requireAdmin();
    }

    // Create user
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: emailConfirmed,
      user_metadata: { role },
    });

    if (error) {
      console.error('Failed to create user:', error);
      return Response.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Log activity
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    await supabase.from('activity_log').insert({
      user_id: currentUser?.id,
      action: 'user_created',
      entity_type: 'user',
      entity_id: data.user.id,
      metadata: { created_user_email: email, role },
    });

    return Response.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        created_at: data.user.created_at,
      },
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
