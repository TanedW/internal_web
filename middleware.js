import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // 1. ดึงข้อมูลจาก Header และ Cookies
  const origin = request.headers.get('origin');
  const token = request.cookies.get('access_token')?.value;
  const email = request.cookies.get('user_email')?.value;
  
  // 2. ป้องกันการยิง API ตรงๆ (Security Check)
  if (pathname.startsWith('/api/CheckSession')) {
    if (!origin && process.env.NODE_ENV === 'production') {
       return new Response(JSON.stringify({ message: 'Direct access not allowed' }), {
         status: 403,
         headers: { 'Content-Type': 'application/json' },
       });
    }
  }

  // 3. กำหนดรายการหน้าที่ต้องการป้องกัน (Array)
  const protectedRoutes = [
    '/manage',
    '/manage-case',
    '/manage-org',
    '/manage-flex-message',
    '/manage-rich-menu',
    '/search-org',
  ];

  // ตรวจสอบว่า pathname ปัจจุบันอยู่ในรายการที่ต้องป้องกันหรือไม่
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // ถ้าเป็นหน้าที่มีการป้องกัน แต่ไม่มีกุญแจ (Token หรือ Email) ให้ Redirect ทันที
    if (!token || !email) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// 4. Matcher ต้องครอบคลุมทุก Path ใน Array ด้านบน
export const config = {
  matcher: [
    '/manage/:path*',
    '/manage-case/:path*',
    '/manage-org/:path*',
    '/manage-flex-message/:path*',
    '/manage-rich-menu/:path*',
    '/search-org/:path*',
    '/api/CheckSession',
  ],
};