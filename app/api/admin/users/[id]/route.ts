/**
 * Admin User Detail API
 * 
 * GET /api/admin/users/[id] - Get user details
 * PATCH /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Delete user
 */

import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin, requireSuperAdmin, UserRole } from '@/lib/admin/auth';
import { strictRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit';

// GET - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { id } = await params;

    // Get user
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.getUserById(id);

    if (error) {
      console.error('Failed to fetch user:', error);
      return Response.json(
        { error: 'Database error', message: 'Failed to fetch user' },
        { status: 500 }
      );
    }

    if (!data.user) {
      return Response.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's clients
    const supabase = await createClient();
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, company, status, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    // Get user's activity
    const { data: activity } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return Response.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: (data.user.user_metadata?.role as UserRole) || 'user',
        created_at: data.user.created_at,
        last_sign_in_at: data.user.last_sign_in_at,
        email_confirmed_at: data.user.email_confirmed_at,
        is_active: !data.user.banned_at,
        phone: data.user.phone,
        app_metadata: data.user.app_metadata,
        user_metadata: data.user.user_metadata,
      },
      clients: clients || [],
      recentActivity: activity || [],
    });

  } catch (error) {
    console.error('Get user error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user
const UpdateUserSchema = z.object({
  role: z.enum(['user', 'admin', 'superadmin']).optional(),
  banned: z.boolean().optional(),
  emailConfirmed: z.boolean().optional(),
  userMetadata: z.record(z.any()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);

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

    const { role, banned, emailConfirmed, userMetadata } = parsed.data;

    // Require superadmin for role changes or banning
    if (role || banned !== undefined) {
      await requireSuperAdmin();
    } else {
      await requireAdmin();
    }

    // Build update object
    const updateData: any = {};

    if (role !== undefined) {
      updateData.user_metadata = { ...(userMetadata || {}), role };
    } else if (userMetadata) {
      updateData.user_metadata = userMetadata;
    }

    if (banned !== undefined) {
      updateData.ban_duration = banned ? '876000h' : 'none';
    }

    if (emailConfirmed !== undefined) {
      updateData.email_confirm = emailConfirmed;
    }

    // Update user
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.auth.admin.updateUserById(
      id,
      updateData
    );

    if (error) {
      console.error('Failed to update user:', error);
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
      action: 'user_updated',
      entity_type: 'user',
      entity_id: id,
      metadata: { updates: parsed.data },
    });

    return Response.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: (data.user.user_metadata?.role as UserRole) || 'user',
        updated_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    // Require superadmin for deletion
    await requireSuperAdmin();

    const { id } = await params;

    // Get current user to prevent self-deletion
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser?.id === id) {
      return Response.json(
        { error: 'Bad request', message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Failed to delete user:', error);
      return Response.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: currentUser?.id,
      action: 'user_deleted',
      entity_type: 'user',
      entity_id: id,
    });

    return Response.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
