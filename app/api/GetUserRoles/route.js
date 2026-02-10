import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

export async function GET(request) {
  let debugLog = {
    step: 'init',
    hasTokenInCookie: false,
    foundInDb: false,
    adminIdFromDb: null,
    permitUserFound: false,
    permitError: null
  };

  try {
    const cookieStore = await cookies(); 
    const tokenFromCookie = cookieStore.get('access_token')?.value; 
    debugLog.hasTokenInCookie = !!tokenFromCookie;

    if (!tokenFromCookie) {
      return NextResponse.json({ roles: ['guest'], isValid: false, debug: debugLog }, { status: 401 });
    }

    // 1. ตรวจสอบใน Database
    const sql = neon(process.env.DATA_BASE_URL);
    const userInDb = await sql`
      SELECT admin_id, email FROM admin_system 
      WHERE access_token = ${tokenFromCookie} 
      AND is_deleted = false 
      LIMIT 1
    `;

    if (userInDb.length === 0) {
      return NextResponse.json({ roles: ['guest'], isValid: false, debug: debugLog }, { status: 401 });
    }

    const userData = userInDb[0];
    debugLog.foundInDb = true;
    debugLog.adminIdFromDb = userData.admin_id;

    // 2. ดึง Roles จาก Permit.io ผ่าน Native Fetch API
    // วิธีนี้จะแก้ปัญหา "could not fetch the api key scope" เพราะเราไม่ผ่านการตั้งค่า Context ของ SDK
    debugLog.step = 'fetching_permit_roles_via_fetch';
    let userRoles = ['guest'];

    try {
      const permitRes = await fetch(
        `https://api.permit.io/v2/facts/default/development/users/${userData.admin_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERMIT_API_KEY}`
          }
        }
      );

      if (permitRes.ok) {
        const permitUser = await permitRes.json();
        debugLog.permitUserFound = true;
        // ดึง roles ออกมา (Permit คืนค่ามาเป็น list ของ role strings)
        userRoles = permitUser.roles || ['guest'];
      } else {
        const errData = await permitRes.json();
        debugLog.permitError = `API Status ${permitRes.status}: ${errData.message}`;
      }
    } catch (fetchError) {
      debugLog.permitError = fetchError.message;
    }

    return NextResponse.json({ 
      roles: userRoles, 
      isValid: true, 
      email: userData.email,
      debug: debugLog 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ roles: ['guest'], isValid: false, error: error.message, debug: debugLog }, { status: 500 });
  }
}