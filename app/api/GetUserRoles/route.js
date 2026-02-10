import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

export async function GET(request) {
  let debugLog = {
    step: 'init',
    adminIdFromDb: null,
    permitUserFound: false,
    permitError: null
  };

  try {
    const cookieStore = await cookies(); 
    const tokenFromCookie = cookieStore.get('access_token')?.value; 

    if (!tokenFromCookie) {
      return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 401 });
    }

    // 1. ตรวจสอบใน Database (Neon)
    const sql = neon(process.env.DATA_BASE_URL);
    const userInDb = await sql`
      SELECT admin_id, email FROM admin_system 
      WHERE access_token = ${tokenFromCookie} 
      AND is_deleted = false LIMIT 1
    `;

    if (userInDb.length === 0) {
      return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 401 });
    }

    const userData = userInDb[0];
    debugLog.adminIdFromDb = userData.admin_id;

    // 2. ดึง Roles จาก Permit.io
    // ใช้ Endpoint /v2/users/{user_id} ซึ่งจะล็อคตาม Environment ของ API Key โดยอัตโนมัติ
    debugLog.step = 'fetching_permit_roles_direct';
    let userRoles = ['guest'];

    const permitRes = await fetch(
      `https://api.permit.io/v2/users/${userData.admin_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PERMIT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (permitRes.ok) {
      const permitUser = await permitRes.json();
      debugLog.permitUserFound = true;
      // ดึง Roles ออกมา (ถ้าไม่มีการ Assign ใน Dashboard จะได้ [] ซึ่งจะ fallback เป็น guest)
      userRoles = permitUser.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];
      if (userRoles.length === 0) userRoles = ['guest'];
    } else {
      const errData = await permitRes.json().catch(() => ({}));
      debugLog.permitError = `Status ${permitRes.status}: ${errData.message || 'User not assigned to roles'}`;
    }

    return NextResponse.json({ 
      roles: userRoles, 
      isValid: true, 
      email: userData.email,
      debug: debugLog 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ roles: ['guest'], error: error.message, debug: debugLog }, { status: 500 });
  }
}