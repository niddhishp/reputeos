/**
 * Admin Analytics API
 * 
 * GET /api/admin/analytics - Get system-wide analytics
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { strictRateLimiter, getClientIP, createRateLimitResponse } from '@/lib/ratelimit';

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

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Parse date range
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user stats
    const { data: usersData } = await adminSupabase.auth.admin.listUsers({
      perPage: 1000,
    });

    const totalUsers = usersData?.total || 0;
    const activeUsers = usersData?.users.filter((u) => !u.banned_at).length || 0;
    const adminUsers =
      usersData?.users.filter(
        (u) => u.user_metadata?.role === 'admin' || u.user_metadata?.role === 'superadmin'
      ).length || 0;

    // New users in date range
    const newUsersInRange =
      usersData?.users.filter((u) => new Date(u.created_at) >= startDate).length || 0;

    // Get database stats
    const [
      { count: totalClients },
      { count: totalContentItems },
      { count: totalLSIRuns },
      { count: totalDiscoverRuns },
      { count: totalAlerts },
    ] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('content_items').select('*', { count: 'exact', head: true }),
      supabase.from('lsi_runs').select('*', { count: 'exact', head: true }),
      supabase.from('discover_runs').select('*', { count: 'exact', head: true }),
      supabase.from('alerts').select('*', { count: 'exact', head: true }),
    ]);

    // Get recent activity in date range
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate activity by type
    const activityByType: Record<string, number> = {};
    recentActivity?.forEach((activity) => {
      activityByType[activity.action] = (activityByType[activity.action] || 0) + 1;
    });

    // Get content stats
    const { data: contentByPlatform } = await supabase
      .from('content_items')
      .select('platform, count')
      .group('platform');

    const { data: contentByStatus } = await supabase
      .from('content_items')
      .select('status, count')
      .group('status');

    // Get daily signups for the date range
    const dailySignups: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailySignups[dateStr] = 0;
    }

    usersData?.users.forEach((user) => {
      const dateStr = user.created_at.split('T')[0];
      if (dailySignups[dateStr] !== undefined) {
        dailySignups[dateStr]++;
      }
    });

    // Get top users by activity
    const userActivity: Record<string, { email: string; count: number }> = {};
    recentActivity?.forEach((activity) => {
      if (activity.user_id) {
        if (!userActivity[activity.user_id]) {
          const user = usersData?.users.find((u) => u.id === activity.user_id);
          userActivity[activity.user_id] = {
            email: user?.email || 'Unknown',
            count: 0,
          };
        }
        userActivity[activity.user_id].count++;
      }
    });

    const topUsers = Object.entries(userActivity)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    return Response.json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          adminUsers,
          newUsersInRange,
          totalClients: totalClients || 0,
          totalContentItems: totalContentItems || 0,
          totalLSIRuns: totalLSIRuns || 0,
          totalDiscoverRuns: totalDiscoverRuns || 0,
          totalAlerts: totalAlerts || 0,
        },
        content: {
          byPlatform: contentByPlatform || [],
          byStatus: contentByStatus || [],
        },
        activity: {
          totalInRange: recentActivity?.length || 0,
          byType: activityByType,
          dailySignups: Object.entries(dailySignups)
            .sort()
            .map(([date, count]) => ({ date, count })),
        },
        topUsers,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days,
        },
      },
    });

  } catch (error) {
    console.error('Get analytics error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    return Response.json(
      { error: 'Internal server error', message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
