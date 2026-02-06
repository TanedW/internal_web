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
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    console.log("-----------------------------------------");
  console.log(`🔍 API CALLED FOR: ${email} at ${new Date().toISOString()}`);
  console.log("-----------------------------------------");

    if (!email) return NextResponse.json({ roles: ['guest'] }, { status: 400 });

    const sql = neon(process.env.DATA_BASE_URL);

    // 1. เช็คแค่ว่า User ยังมีตัวตนและไม่ถูกลบ (Query นี้เร็วมากใน Neon)
    const userInDb = await sql`SELECT admin_id FROM admin_system WHERE email = ${email} AND is_deleted = false LIMIT 1`;

    if (userInDb.length === 0) {
      return NextResponse.json({ roles: ['guest'] }, { status: 200 });
    }

    const adminId = userInDb[0].admin_id;

    // 2. ดึง Roles จาก Permit.io
    const permitUser = await permit.api.getUser(adminId.toString());
    const userRoles = permitUser?.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];

    // 3. ส่งคำตอบพร้อมกำหนด Cache ในระดับ Edge Network (Vercel)
    return NextResponse.json(
      { roles: userRoles },
      {
        status: 200,
        headers: {
          /**
           * s-maxage=60: ให้ Edge Server จำค่านี้ไว้ 60 วินาที (เร็วมากสำหรับคนคลิกเปลี่ยนเมนูไปมา)
           * stale-while-revalidate=30: ถ้าเกิน 60 วินาที ให้ใช้ค่าเดิมไปก่อน แต่หลังบ้านจะแอบไปดึงค่าใหม่มาอัปเดต
           */
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ roles: ['guest'] }, { status: 500 });
  }
}