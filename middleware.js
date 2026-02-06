import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // 1. ดึงข้อมูล
  const origin = request.headers.get('origin');
  const token = request.cookies.get('access_token')?.value;
  const email = request.cookies.get('user_email')?.value;
  const roleRaw = request.cookies.get('user_role')?.value || "";
  const currentRoles = roleRaw.split(',').map(r => r.trim());

  // 2. Security Check สำหรับ API
  if (pathname.startsWith('/api/CheckSession')) {
    if (!origin && process.env.NODE_ENV === 'production') {
       return new Response(JSON.stringify({ message: 'Direct access not allowed' }), {
         status: 403,
         headers: { 'Content-Type': 'application/json' },
       });
    }
    return NextResponse.next();
  }

  // 3. กำหนดสิทธิ์การเข้าถึง (Single Source of Truth)
  const rolePermissions = {
    '/manage-case': ["admin", "editor", "editor_manage_case"],
    '/manage-org': ["admin", "editor", "editor_manage_org_info", "editor_manage_org"],
    '/manage-flex-message': ["admin", "editor", "editor_manage_flex"],
    '/manage-rich-menu': ["admin", "editor", "editor_manage_menu"], // แก้ไขตัวสะกดให้ตรงกับ matcher
    '/search-org': ["admin", "editor", "editor_search_org"],
    // '/manage': ["admin", "editor", "editor_manage_user"],
  };

  // 4. ตรวจสอบว่าหน้าปัจจุบันต้องเช็คสิทธิ์หรือไม่
  const matchedPath = Object.keys(rolePermissions).find(path => pathname.startsWith(path));

  // console.log('--- Debug Middleware ---');
  // console.log('Path:', pathname);
  // console.log('Roles from Cookie:', currentRoles);
  // console.log('Token exists:', !!token);
  // console.log('Email exists:', !!email);

  if (matchedPath) {
    // กฎข้อที่ 1: Authentication (ต้อง Login)
    if (!token || !email) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // กฎข้อที่ 2: Authorization (เช็คสิทธิ์)
    const allowedRoles = rolePermissions[matchedPath];
    const hasAccess = currentRoles.some(role => allowedRoles.includes(role));

    if (!hasAccess) {
      // ถ้าไม่มีสิทธิ์: ดีดไปหน้าอื่นที่เขาเข้าได้ หรือหน้าแรก
      // ระวัง: อย่าดีดกลับไปหน้าเดิมที่เขาไม่มีสิทธิ์ เพราะจะเกิด Infinite Redirect Loop
      return NextResponse.redirect(new URL('/manage', request.url)); 
    }
  }

  return NextResponse.next();
}

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