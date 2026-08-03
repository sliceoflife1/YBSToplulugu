import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Herkese açık (public) route'lar.
 * Bu listedeki path'ler oturum gerektirmez.
 * Diğer TÜM route'lar oturum gerektirir.
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/kvkk',
  '/cookies',
  '/contact',
];

/**
 * Public path prefix'leri.
 * Bu prefix ile başlayan tüm route'lar oturum gerektirmez.
 */
const PUBLIC_PATH_PREFIXES = [
  '/api/',
  '/_next/',
];

/**
 * Giriş yapmış kullanıcıların erişmemesi gereken route'lar.
 * Bu sayfalara gelen authenticated kullanıcılar /dashboard'a yönlendirilir.
 */
const AUTH_ONLY_PATHS = ['/login', '/register'];

/**
 * Admin 2FA doğrulaması beklenirken erişime izin verilen route'lar.
 */
const ALLOWED_DURING_2FA_PENDING = [
  '/auth/2fa-challenge',
  '/api/',
  '/login',
  '/',
];

function isPublicPath(pathname: string): boolean {
  // Exact match
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  // Prefix match for prefixes
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Register alt route'ları (student, faculty, organization)
  if (pathname.startsWith('/register')) {
    return true;
  }

  return false;
}

function isAllowedDuring2FAPending(pathname: string): boolean {
  return ALLOWED_DURING_2FA_PENDING.some((allowed) => {
    if (allowed.endsWith('/')) {
      return pathname.startsWith(allowed);
    }
    return pathname === allowed || pathname.startsWith(allowed + '/');
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // 1. Public route'lara herkesi geçir (session yenileme hariç)
  if (isPublicPath(path)) {
    // Session'ı yenile ve kullanıcıyı kontrol et
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && (AUTH_ONLY_PATHS.includes(path) || path.startsWith('/register'))) {
      // Admin 2FA pending ise login'den 2FA sayfasına yönlendir
      const has2FAPending = request.cookies.get('admin_2fa_pending')?.value === 'true';
      if (has2FAPending) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/2fa-challenge';
        return NextResponse.redirect(url);
      }

      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // 2. Protected route'lar için session kontrolü
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Oturum yoksa login'e yönlendir
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // 4. Admin 2FA pending kontrolü
  const has2FAPending = request.cookies.get('admin_2fa_pending')?.value === 'true';

  if (has2FAPending && !isAllowedDuring2FAPending(path)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/2fa-challenge';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
