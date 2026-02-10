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
    // 1. ดึง Token จาก Cookie
    const cookieStore = await cookies(); 
    const tokenFromCookie = cookieStore.get('access_token')?.value; 
    debugLog.hasTokenInCookie = !!tokenFromCookie;

    if (!tokenFromCookie) {
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        debug: debugLog 
      }, { status: 401 });
    }

    // 2. ตรวจสอบ Token กับ Database (Neon) โดยตรง
    debugLog.step = 'querying_db_by_token';
    const sql = neon(process.env.DATA_BASE_URL);
    
    const userInDb = await sql`
      SELECT admin_id, email FROM admin_system 
      WHERE access_token = ${tokenFromCookie} 
      AND is_deleted = false 
      LIMIT 1
    `;

    if (userInDb.length === 0) {
      debugLog.foundInDb = false;
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        message: 'Invalid session or token mismatch',
        debug: debugLog 
      }, { status: 401 });
    }

    const userData = userInDb[0];
    debugLog.foundInDb = true;
    debugLog.adminIdFromDb = userData.admin_id;

    // 3. ดึง Roles จาก Permit.io 
    // ใช้ Endpoint /v2/users/{user_id} ซึ่งจะล็อคตาม Environment ของ API Key โดยอัตโนมัติ
    debugLog.step = 'fetching_permit_roles_direct';
    let userRoles = ['guest'];
    
    try {
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
    } catch (permitError) {
      console.error("Permit API Error:", permitError.message);
      debugLog.permitError = permitError.message;
      userRoles = ['guest'];
    }

    return NextResponse.json(
      { 
        roles: userRoles, 
        isValid: true, 
        email: userData.email,
        debug: debugLog 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("API Critical Error:", error);
    return NextResponse.json({ 
      roles: ['guest'], 
      isValid: false, 
      error: error.message,
      debug: debugLog 
    }, { status: 500 });
  }
}