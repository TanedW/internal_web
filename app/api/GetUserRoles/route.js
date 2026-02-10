import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Permit } from "permitio";
import { cookies } from 'next/headers';

const permit = new Permit({
  pdp: "https://cloudpdp.api.permit.io",
  token: process.env.PERMIT_API_KEY,
});

export async function GET(request) {
  let debugLog = {
    step: 'init',
    hasTokenInCookie: false,
    foundInDb: false,
    adminIdFromDb: null,
  };

  try {
    // 1. ดึง Token จาก Cookie
    const cookieStore = await cookies(); 
    const tokenFromCookie = cookieStore.get('access_token')?.value; 
    debugLog.hasTokenInCookie = !!tokenFromCookie;

    if (!tokenFromCookie) {
      return NextResponse.json({ roles: ['guest'], isValid: false, debug: debugLog }, { status: 401 });
    }

    // 2. ตรวจสอบตรงกับ Database (Neon)
    debugLog.step = 'querying_db_by_token';
    const sql = neon(process.env.DATA_BASE_URL);
    
    // ค้นหา user จาก access_token ที่ตรงกันเป๊ะๆ
    const userInDb = await sql`
      SELECT admin_id, email FROM admin_system 
      WHERE access_token = ${tokenFromCookie} 
      AND is_deleted = false 
      LIMIT 1
    `;

    if (userInDb.length === 0) {
      debugLog.step = 'token_not_found_or_invalid';
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        message: 'Unauthorized: Invalid session token',
        debug: debugLog 
      }, { status: 401 });
    }

    const userData = userInDb[0];
    debugLog.foundInDb = true;
    debugLog.adminIdFromDb = userData.admin_id;
    debugLog.emailFromToken = userData.email;

    // 3. ดึง Roles จาก Permit.io โดยใช้ admin_id (UUID)
    debugLog.step = 'fetching_permit_roles';
    let userRoles = ['guest'];
    
    try {
      // ใช้ userData.admin_id ที่ได้จาก DB โดยตรง
      const permitUser = await permit.api.getUser(userData.admin_id);
      if (permitUser) {
        userRoles = permitUser.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];
      }
    } catch (permitError) {
      console.error("Permit API Error:", permitError.message);
      debugLog.permitError = permitError.message;
    }

    return NextResponse.json({ 
      roles: userRoles, 
      isValid: true, 
      email: userData.email,
      debug: debugLog 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ 
      roles: ['guest'], 
      isValid: false, 
      error: error.message,
      debug: debugLog 
    }, { status: 500 });
  }
}