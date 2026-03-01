// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/clients', '/settings'];
const AUTH_PATHS = ['/login', '/signup'];
// Always public — no auth check, no redirect
const PUBLIC_PATHS = ['/home', '/pricing', '/about', '/contact', '/privacy', '/terms'];

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const pathname = request.nextUrl.pathname;

  // Always public — short-circuit immediately
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return response;
  }

  // Root → decide based on auth state
  if (pathname === '/') {
    // Try to detect auth, but always fall back to /home if anything goes wrong
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) { return request.cookies.get(name)?.value; },
            set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options });
              response = NextResponse.next({ request: { headers: request.headers } });
              response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options });
              response = NextResponse.next({ request: { headers: request.headers } });
              response.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      return NextResponse.redirect(
        new URL(user ? '/dashboard/clients' : '/home', request.url)
      );
    } catch {
      // If Supabase is not configured (local dev without .env) → show marketing page
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // For all other routes, check auth
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

    // Unauthenticated → block app routes
    if (isProtectedPath && !user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Authenticated → skip auth pages, go to app
    if (isAuthPath && user) {
      const from = request.nextUrl.searchParams.get('from');
      const destination = from && from.startsWith('/') ? from : '/dashboard/clients';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  } catch {
    // If Supabase isn't configured, protect app routes conservatively
    const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    if (isProtectedPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (static assets)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opengraph-image|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
