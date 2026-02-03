import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // 1. ดึงข้อมูลจาก Header เพื่อตรวจสอบ Origin
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // 2. ป้องกันการยิง API /api/CheckSession โดยตรงจากโปรแกรมภายนอก (Postman/Curl)
  if (pathname.startsWith('/api/CheckSession')) {
    // ใน Production ควรเช็คว่า origin ตรงกับ domain หลักของคุณหรือไม่
    // หากไม่มี origin (ยิงตรงผ่าน browser/tool) ให้ block
    if (!origin && process.env.NODE_ENV === 'production') {
       return new Response(JSON.stringify({ message: 'Direct access not allowed' }), {
         status: 403,
         headers: { 'Content-Type': 'application/json' },
       });
    }
  }

  // 3. ตัวอย่างการเช็ค Cookie (ถ้าคุณเปลี่ยนจาก LocalStorage มาใช้ Cookie จะปลอดภัยมาก)
  // เพราะ Middleware สามารถอ่าน Cookie ได้โดยตรงก่อน Render หน้าจอ
  const token = request.cookies.get('access_token')?.value;

  if (pathname.startsWith('/manage')) {
    if (!token) {
      // ถ้าไม่มี Token ให้ส่งกลับไปหน้า Login ทันที
      // return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// 4. กำหนดว่าให้ Middleware ทำงานที่ Path ไหนบ้าง
export const config = {
  matcher: [
    '/manage/:path*',      // ทุกหน้าที่ขึ้นต้นด้วย /manage
    '/api/CheckSession',   // เฉพาะ API ตัวนี้
  ],
};