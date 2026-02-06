import { NextResponse } from 'next/server';

// กำหนดสิทธิ์การเข้าถึง (Single Source of Truth)
const ROLE_PERMISSIONS = {
  '/manage-case': ["admin", "editor", "editor_manage_case"],
  '/manage-org': ["admin", "editor", "editor_manage_org_info", "editor_manage_org"],
  '/manage-flex-message': ["admin", "editor", "editor_manage_flex"],
  '/manage-rich-menu': ["admin", "editor", "editor_manage_menu"],
  '/search-org': ["admin", "editor", "editor_search_org"],
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // 1. ดึงข้อมูลพื้นฐานจาก Cookies
  const token = request.cookies.get('access_token')?.value;
  const email = request.cookies.get('user_email')?.value;

  // 2. ตรวจสอบว่าหน้าปัจจุบันต้องเช็คสิทธิ์หรือไม่
  const matchedPath = Object.keys(ROLE_PERMISSIONS).find(path => pathname.startsWith(path));

  if (matchedPath) {
    // กฎข้อที่ 1: ต้อง Login ก่อน
    if (!token || !email) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      /**
       * กลยุทธ์: ดึง Role สดๆ จากแหล่งข้อมูล
       * ในที่นี้แนะนำให้เรียก API ภายในของคุณที่ไปเช็คกับ Permit.io หรือ DB 
       * หรือใช้ fetch ไปที่ Endpoint ที่คืนค่า Role ของ User นั้นๆ
       */
      const adminIdRaw = request.cookies.get('admin_id')?.value; // คุณอาจต้องเซ็ต cookie นี้ตอน login
      
      // ตัวอย่าง: เรียก API ภายในเพื่อเอา Role (ต้องเป็น Absolute URL)
      const roleResponse = await fetch(`${request.nextUrl.origin}/api/GetUserRoles?email=${email}`, {
        // headers: { Authorization: `Bearer ${token}` }
        method: 'GET',
        credentials: 'omit',
      });
      
      const { roles } = await roleResponse.json(); 
      // console.log("Middleware fetched roles:", roles);
      const currentRoles = Array.isArray(roles) ? roles : [];

      // กฎข้อที่ 2: Authorization (เช็คสิทธิ์สดๆ)
      const allowedRoles = ROLE_PERMISSIONS[matchedPath];
      const hasAccess = currentRoles.some(role => allowedRoles.includes(role));

      if (!hasAccess) {
        // ถ้าไม่มีสิทธิ์ ดีดไปหน้า /manage (หน้าแรกของ Admin)
        return NextResponse.redirect(new URL('/manage', request.url)); 
      }

    } catch (error) {
      console.error("Middleware Auth Error:", error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/manage-case/:path*',
    '/manage-org/:path*',
    '/manage-flex-message/:path*',
    '/manage-rich-menu/:path*',
    '/search-org/:path*',
  ],
};