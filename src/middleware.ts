import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/legal'];

// Routes that additionally require admin role (checked in AdminGuard component)
// Middleware just ensures any logged-in user can reach /admin to see the guard
const AUTH_ONLY_ROUTES = ['/admin'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow webhooks and static assets to pass through without any auth
    if (
        pathname.startsWith('/api/mux/webhooks') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/icon') ||
        pathname === '/robots.txt'
    ) {
        return NextResponse.next();
    }

    // Check if this is a public route — no auth required
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired — critical for Server Components
    const { data: { user } } = await supabase.auth.getUser();

    // Not authenticated + trying to access a protected route → redirect to login
    if (!user && !isPublicRoute) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated + trying to access login/register → redirect to home
    if (user && isPublicRoute) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = '/';
        return NextResponse.redirect(homeUrl);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
