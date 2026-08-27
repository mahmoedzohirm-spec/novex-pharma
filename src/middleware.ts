// ============================================
// ملف: src/middleware.ts
// ============================================
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// تخزين بسيط لـ Rate Limiting (في الذاكرة)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ─── Security Headers ───────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ─── Rate Limiting (فقط للمصادقة) ─────────────
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
    const key = `auth:${ip}`;
    const now = Date.now();
    const windowMs = 60_000; // 1 دقيقة
    const maxAttempts = 10;

    const current = rateLimit.get(key);
    if (current && now < current.resetAt) {
      if (current.count >= maxAttempts) {
        return NextResponse.json(
          { error: 'محاولات كثيرة، حاول بعد دقيقة' },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
      rateLimit.set(key, { count: current.count + 1, resetAt: current.resetAt });
    } else {
      rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};