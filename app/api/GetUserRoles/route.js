import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { cookies } from 'next/headers';

export async function GET(request) {
  const debugLog = {
    step: 'init',
    adminIdFromDb: null,
    permitError: null,
  };

  try {
    // 1. Get the session token from the HttpOnly cookie
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('access_token')?.value;

    if (!tokenFromCookie) {
      // No token, user is a guest
      return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 401 });
    }

    // 2. Validate the session token against the database
    debugLog.step = 'validating_token_in_db';
    const sql = neon(process.env.DATA_BASE_URL);
    const userInDb = await sql`
      SELECT admin_id, email 
      FROM admin_system 
      WHERE access_token = ${tokenFromCookie} AND is_deleted = false 
      LIMIT 1
    `;

    if (userInDb.length === 0) {
      // Token is invalid or expired
      return NextResponse.json({ roles: ['guest'], isValid: false, message: 'Invalid session' }, { status: 401 });
    }

    const userData = userInDb[0];
    debugLog.adminIdFromDb = userData.admin_id;

    // 3. Fetch user roles from Permit.io using the correct endpoint
    debugLog.step = 'fetching_roles_from_permit';
    let userRoles = ['guest']; // Default role

    const permitRes = await fetch(
      // This is the standard endpoint to get a user and their roles.
      // It automatically uses the environment associated with your API key.
      `https://api.permit.io/v2/users/${userData.admin_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PERMIT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (permitRes.ok) {
      const permitUser = await permitRes.json();
      debugLog.permitUserFound = true;
      
      // ตรวจสอบโครงสร้าง roles ที่เป็น Array ของ Object ตามผลลัพธ์ cURL
      if (permitUser.roles && permitUser.roles.length > 0) {
        // ดึงเฉพาะค่าจาก key "role" ออกมา (เช่น "admin")
        userRoles = permitUser.roles.map(r => r.role);

      } else {
        // ถ้าใน Permit ไม่มี Role เลย ให้เป็น guest
        userRoles = ['guest'];
      }
    }

    // 4. Return the final user data and roles
    return NextResponse.json({
      roles: userRoles,
      isValid: true,
      email: userData.email,
    }, { status: 200 });

  } catch (error) {
    console.error("API Critical Error in GetUserRoles:", error.message);
    return NextResponse.json({
      roles: ['guest'],
      isValid: false,
      error: 'An internal server error occurred.',
      debug: debugLog,
    }, { status: 500 });
  }
}