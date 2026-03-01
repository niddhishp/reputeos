/**
 * Supabase Server Client
 * 
 * This module provides a server-side Supabase client using the @supabase/ssr package.
 * It properly handles cookies for authentication in Next.js App Router.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase server client for use in Server Components,
 * Server Actions, and API Routes.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // This can be ignored if called from a Server Component
            // The middleware will handle session refresh
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role key.
 * WARNING: This bypasses RLS policies. Use with extreme caution.
 */
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get the current authenticated user from the server context.
 * Returns null if no user is authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current authenticated user or throw an error.
 * Use this when authentication is required.
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Check if the current user owns a specific client.
 * This is used for authorization checks in API routes.
 */
export async function verifyClientOwnership(clientId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Require that the current user owns a specific client.
 * Throws an error if not authorized.
 */
export async function requireClientOwnership(clientId: string): Promise<void> {
  const isOwner = await verifyClientOwnership(clientId);
  
  if (!isOwner) {
    throw new Error('Forbidden: You do not have access to this client');
  }
}
