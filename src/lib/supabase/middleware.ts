import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyCookieValue, signCookieValue, CHECKED_MAX_AGE } from '@/lib/cookie-signature';

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
 * Sadece 2FA doğrulaması için gerekli endpoint'ler izinli — tüm /api/ değil.
 */
const ALLOWED_DURING_2FA_PENDING = [
  '/auth/2fa-challenge',
  '/api/auth/verify-2fa',
  '/api/auth/clear-2fa-pending',
  '/api/auth/log-login',
  '/api/auth/log-logout',
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
    return pathname === allowed || pathname.startsWith(allowed + '/');
  });
}

/**
 * Admin 2FA durumunu kontrol eder ve gerekli yönlendirmeleri yapar.
 *
 * Güvenlik mimarisi: POZİTİF SİNYAL (admin_2fa_verified cookie'si)
 * Eski yaklaşım negatif sinyale (admin_2fa_pending varlığı/yokluğu) dayanıyordu
 * ve cookie silinerek bypass edilebiliyordu.
 *
 * Yeni akış:
 * 1. admin_2fa_verified cookie geçerli mi? → GEÇIR
 * 2. _2fa_checked cache cookie geçerli mi? → GEÇIR (admin değil, DB sorgusu cache)
 * 3. admin_2fa_pending cookie var mı? → ENGELLE (2FA challenge'a yönlendir)
 * 4. Hiçbiri yok → DB'den profili kontrol et:
 *    - Admin + 2FA aktif → pending cookie set et, ENGELLE
 *    - Değilse → _2fa_checked cache set et, GEÇIR
 *
 * Returns: redirect response if 2FA is needed, null if access is allowed
 */
async function check2FAStatus(
  request: NextRequest,
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  defaultResponse: NextResponse
): Promise<NextResponse | null> {
  // 1. Pozitif sinyal: HMAC-imzalı admin_2fa_verified cookie
  const verifiedCookie = request.cookies.get('admin_2fa_verified')?.value;
  if (verifiedCookie) {
    const isValid = await verifyCookieValue(verifiedCookie, userId);
    if (isValid) return null; // 2FA doğrulanmış, erişime izin ver
  }

  // 2. Cache: _2fa_checked cookie (admin olmayan kullanıcı cache'i)
  const checkedCookie = request.cookies.get('_2fa_checked')?.value;
  if (checkedCookie) {
    const isValid = await verifyCookieValue(checkedCookie, userId, CHECKED_MAX_AGE);
    if (isValid) return null; // Admin değil veya 2FA yok, erişime izin ver
  }

  // 3. Negatif sinyal: admin_2fa_pending cookie
  const hasPending = request.cookies.get('admin_2fa_pending')?.value === 'true';
  if (hasPending) {
    // 2FA doğrulaması henüz tamamlanmamış, challenge sayfasına yönlendir
    const url = request.nextUrl.clone();
    url.pathname = '/auth/2fa-challenge';
    return NextResponse.redirect(url);
  }

  // 4. Hiçbir cookie yok — veritabanından kontrol et
  //    Bu durum şu senaryolarda oluşur:
  //    - Admin kullanıcı cookie'leri silmiş (bypass denemesi)
  //    - Normal kullanıcı (ilk istek)
  //    - Yeni oturum açılmış ama set-2fa-pending henüz çağrılmamış
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_2fa_enabled')
    .eq('id', userId)
    .single();

  if (profile?.role === 'admin' && profile?.is_2fa_enabled) {
    // Admin + 2FA aktif — pending cookie set et ve 2FA challenge'a yönlendir
    const url = request.nextUrl.clone();
    url.pathname = '/auth/2fa-challenge';
    const response = NextResponse.redirect(url);
    response.cookies.set('admin_2fa_pending', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  }

  // Admin değil veya 2FA aktif değil — sonucu cache'le
  try {
    const signedValue = await signCookieValue(userId);
    defaultResponse.cookies.set('_2fa_checked', signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  } catch {
    // Secret yapılandırılmamış, cache'siz devam et (güvenli fallback)
  }

  return null; // Erişime izin ver
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

  // 1. Session yenileme ve kullanıcıyı al
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. 2FA zorunluluğu kontrolü (ÖNCELİKLİ):
  //    Kullanıcı oturum açmışsa ve 2FA izni verilen rotalar dışında bir yere erişmeye çalışıyorsa,
  //    public rota (anasayfa / dahil) fark etmeksizin 2FA doğrulama durumunu zorla denetle.
  if (user && !isAllowedDuring2FAPending(path)) {
    const redirectResponse = await check2FAStatus(request, supabase, user.id, supabaseResponse);
    if (redirectResponse) {
      return redirectResponse;
    }
  }

  // 3. Public route'lara herkesi geçir (AUTH_ONLY rotalarda yönlendirme yap)
  if (isPublicPath(path)) {
    if (user && (AUTH_ONLY_PATHS.includes(path) || path.startsWith('/register'))) {
      // 2FA doğrulanmış kullanıcılarda login/register erişimini /dashboard'a yönlendir
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // 4. Protected route'lar için oturum yoksa login'e yönlendir
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
