import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get('access_token')?.value;
  const email = request.cookies.get('user_email')?.value;
  const roleRaw = request.cookies.get('user_role')?.value || "";
  
  // แปลงค่าจาก Cookie กลับเป็น Array (รองรับกรณีมีหลาย Role)
  const currentRoles = roleRaw.split(',');

  // 1. นิยามสิทธิ์การเข้าถึง (ให้ตรงกับ Logic ใน sidebar.jsx)
  const rolePermissions = {
    '/manage-case': ["admin", "editor", "editor_manage_case"],
    '/manage-org': ["admin", "editor", "editor_manage_org_info", "editor_manage_org"],
    '/manage-flex-message': ["admin", "editor", "editor_manage_flex"],
    '/manage-richmenu': ["admin", "editor", "editor_manage_menu"],
    '/search-org': ["admin", "editor", "editor_search_org"],
    // '/manage': ["admin", "editor", "editor_manage_user"], // ตัวอย่าง: หน้าจัดการ Email/User
  };

  // 2. ตรวจสอบว่า pathname ปัจจุบันอยู่ในรายการที่ต้องป้องกันหรือไม่
  const matchedPath = Object.keys(rolePermissions).find(path => pathname.startsWith(path));

  if (matchedPath) {
    // กฎข้อที่ 1: ต้อง Login (มี Token และ Email)
    if (!token || !email) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // กฎข้อที่ 2: เช็คสิทธิ์ (Authorization)
    const allowedRoles = rolePermissions[matchedPath];
    const hasAccess = currentRoles.some(r => allowedRoles.includes(r));

    if (!hasAccess) {
      // ถ้าไม่มีสิทธิ์ ให้ดีดกลับไปหน้าหลัก หรือหน้าแจ้งเตือน
      // เราเพิ่ม query param เพื่อให้หน้า Login แสดง Error ได้
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
    '/manage-richmenu/:path*',
    '/search-org/:path*',
  ],
};