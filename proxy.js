import { NextResponse } from 'next/server';

// 1. กำหนดสิทธิ์การเข้าถึง (Single Source of Truth)
const ROLE_PERMISSIONS = {
  '/manage': ["admin", "editor", "editor__manage_user"],
  '/manage-case': ["admin", "editor", "editor_manage_case"],
  '/manage-org': ["admin", "editor", "editor_manage_org_info", "editor_manage_org"],
  '/manage-flex-message': ["admin", "editor", "editor_manage_flex"],
  '/manage-rich-menu': ["admin", "editor", "editor_manage_menu"],
  '/search-org': ["admin", "editor", "editor_search_duplicate_org"],
  '/manage-file-search': ["admin", "editor", "editor_file_search"],
  '/reset-otp': ["admin", "editor", "editor_reset_otp"],
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // 2. ดึง Token จาก Cookies (เนื่องจากเราเก็บแบบ HttpOnly Cookie)
  const token = request.cookies.get('access_token')?.value;

  // 3. ตรวจสอบว่าหน้าปัจจุบันต้องเช็คสิทธิ์หรือไม่
  const matchedPath = Object.keys(ROLE_PERMISSIONS).find(path => pathname.startsWith(path));

  if (matchedPath) {
    // กฎข้อที่ 1: ต้อง Login ก่อน (ต้องมี Token)
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      /**
       * 4. เรียก API ภายนอกเพื่อเอา Role ล่าสุด โดยใช้ URL จาก Environment Variable
       * ต้องส่ง Cookie ทั้งหมดที่มีใน Browser ต่อไปให้ API ด้วยเพื่อให้ API อ่าน access_token ได้
       */
      const externalApiUrl = process.env.NEXT_PUBLIC_GET_USER_ROLES_API_URL;
      
      if (!externalApiUrl) {
        console.error("Middleware Error: NEXT_PUBLIC_GET_USER_ROLES_API_URL is not defined");
        return NextResponse.redirect(new URL('/', request.url));
      }

      const roleResponse = await fetch(externalApiUrl, {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || '', // ส่ง Cookie ต่อไป
        },
        cache: 'no-store', // บังคับไม่ให้ใช้ Cache เพื่อเช็คสิทธิ์สดๆ
      });

      // ถ้า API ตายหรือตอบกลับไม่สำเร็จ (เช่น 401 หรือ 500)
      if (!roleResponse.ok) {
        console.error("Middleware: Role API responded with error status:", roleResponse.status);
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      const data = await roleResponse.json(); 
      const { roles, isValid } = data; // รับค่าจาก API ที่เราแก้ใหม่
      
      const currentRoles = Array.isArray(roles) ? roles : [];

      // กฎข้อที่ 2: Authorization (เช็คสิทธิ์สดๆ)
      const allowedRoles = ROLE_PERMISSIONS[matchedPath];
      
      // ต้องผ่านทั้งการ Verify (isValid) และมี Role ที่ได้รับอนุญาต
      const hasAccess = isValid && currentRoles.some(role => allowedRoles.includes(role));

      if (!hasAccess) {
        console.warn(`Access denied for ${pathname}. Roles: ${currentRoles}`);
        // ถ้าไม่มีสิทธิ์ ดีดไปหน้า /manage (หน้าแรกของ Admin)
        return NextResponse.redirect(new URL('/manage', request.url)); 
      }

    } catch (error) {
      console.error("Middleware Critical Error:", error);
      // หากเกิด Error ร้ายแรง ให้ดีดกลับหน้า Login เพื่อความปลอดภัย
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// 5. กำหนดหน้าที่ Middleware จะเข้าไปทำงาน
export const config = {
  matcher: [
    '/home/:path',
    '/manage-case/:path',
    '/manage-org/:path',
    '/manage-flex-message/:path',
    '/manage-rich-menu/:path',
    '/search-org/:path',
    '/manage-file-search/:path',
    '/reset-otp/:path',
  ],
};