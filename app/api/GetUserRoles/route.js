// import { NextResponse } from 'next/server';
// import { neon } from '@neondatabase/serverless';
// import { Permit } from "permitio";

// export const runtime = 'edge';

// const permit = new Permit({
//   pdp: "https://cloudpdp.api.permit.io",
//   token: process.env.PERMIT_API_KEY,
// });

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const email = searchParams.get('email');

//     console.log("-----------------------------------------");
//   console.log(`🔍 API CALLED FOR: ${email} at ${new Date().toISOString()}`);
//   console.log("-----------------------------------------");

//     if (!email) return NextResponse.json({ roles: ['guest'] }, { status: 400 });

//     const sql = neon(process.env.DATA_BASE_URL);

//     // 1. เช็คแค่ว่า User ยังมีตัวตนและไม่ถูกลบ (Query นี้เร็วมากใน Neon)
//     const userInDb = await sql`SELECT admin_id FROM admin_system WHERE email = ${email} AND is_deleted = false LIMIT 1`;

//     if (userInDb.length === 0) {
//       return NextResponse.json({ roles: ['guest'] }, { status: 200 });
//     }

//     const adminId = userInDb[0].admin_id;

//     // 2. ดึง Roles จาก Permit.io
//     const permitUser = await permit.api.getUser(adminId.toString());
//     const userRoles = permitUser?.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];

//     // 3. ส่งคำตอบพร้อมกำหนด Cache ในระดับ Edge Network (Vercel)
//     return NextResponse.json(
//       { roles: userRoles },
//       {
//         status: 200,
//         headers: {
//           /**
//            * s-maxage=60: ให้ Edge Server จำค่านี้ไว้ 60 วินาที (เร็วมากสำหรับคนคลิกเปลี่ยนเมนูไปมา)
//            * stale-while-revalidate=30: ถ้าเกิน 60 วินาที ให้ใช้ค่าเดิมไปก่อน แต่หลังบ้านจะแอบไปดึงค่าใหม่มาอัปเดต
//            */
//           'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
//         'Content-Type': 'application/json',
//         },
//       }
//     );
//   } catch (error) {
//     return NextResponse.json({ roles: ['guest'] }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Permit } from "permitio";

export const runtime = 'edge';

const permit = new Permit({
  pdp: "https://cloudpdp.api.permit.io",
  token: process.env.PERMIT_API_KEY,
});

export async function GET(request) {
  try {
    // 1. ดึง Token จาก Authorization Header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1]; // แยกคำว่า 'Bearer' ออก

    if (!token) {
      return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 401 });
    }

    /**
     * 2. Verify Token กับ Google/Firebase
     * ใน Edge Runtime เราสามารถใช้ fetch ยิงไปที่ Google Token Info API เพื่อตรวจสอบความถูกต้อง
     */
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    
    if (!verifyRes.ok) {
      return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 401 });
    }

    const tokenInfo = await verifyRes.json();
    const emailFromToken = tokenInfo.email; // นี่คือ Email จริงๆ ที่แกะมาจาก Token (ปลอมไม่ได้)

    const sql = neon(process.env.DATA_BASE_URL);

    // 3. ตรวจสอบใน Database โดยใช้ Email จาก Token
    const userInDb = await sql`
      SELECT admin_id 
      FROM admin_system 
      WHERE email = ${emailFromToken} AND is_deleted = false 
      LIMIT 1
    `;

    if (userInDb.length === 0) {
      return NextResponse.json({ roles: ['guest'], isValid: true }, { status: 200 });
    }

    const adminId = userInDb[0].admin_id;

    // 4. ดึง Roles จาก Permit.io
    const permitUser = await permit.api.getUser(adminId.toString());
    const userRoles = permitUser?.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];

    // 5. ส่งคำตอบกลับไปที่ Middleware
    return NextResponse.json(
      { 
        roles: userRoles, 
        isValid: true,
        email: emailFromToken // ส่งกลับไปเพื่อให้ Middleware รู้ว่าเป็นใครถ้าจำเป็น
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 500 });
  }
}