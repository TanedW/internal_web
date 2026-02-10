import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Permit } from "permitio";
import { cookies } from 'next/headers';

// แนะนำให้เอา edge runtime ออกเพื่อให้ Library ทำงานได้เสถียรขึ้นบน Node.js
// export const runtime = 'edge'; 

const permit = new Permit({
  pdp: "https://cloudpdp.api.permit.io",
  token: process.env.PERMIT_API_KEY,
});

export async function GET(request) {
  let debugLog = {
    step: 'init',
    hasTokenInCookie: false,
    googleVerifyOk: false,
    emailFromToken: null,
    foundInDb: false,
    adminIdFromDb: null,
    permitUserFound: false,
    permitRawRoles: null
  };

  try {
    // 1. ดึง Token จาก Cookie (Next.js 15 ต้องใช้ await)
    const cookieStore = await cookies(); 
    const token = cookieStore.get('access_token')?.value; 
    debugLog.hasTokenInCookie = !!token;

    if (!token) {
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        debug: debugLog 
      }, { status: 401 });
    }

    // 2. ตรวจสอบ Token กับ Google
    debugLog.step = 'verifying_google_token';
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token}`);
    debugLog.googleVerifyOk = verifyRes.ok;
    
    if (!verifyRes.ok) {
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        debug: debugLog 
      }, { status: 401 });
    }

    const tokenInfo = await verifyRes.json();
    const emailFromToken = tokenInfo.email; 
    debugLog.emailFromToken = emailFromToken;

    // 3. ตรวจสอบใน Database
    debugLog.step = 'querying_db';
    const sql = neon(process.env.DATA_BASE_URL);
    
    // ใช้ LOWER() เพื่อป้องกันปัญหาเรื่องตัวพิมพ์เล็ก-ใหญ่ใน Email
    const userInDb = await sql`
      SELECT admin_id FROM admin_system 
      WHERE LOWER(email) = LOWER(${emailFromToken}) 
      AND is_deleted = false LIMIT 1
    `;

    debugLog.foundInDb = userInDb.length > 0;

    if (userInDb.length === 0) {
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: true, 
        debug: debugLog 
      }, { status: 200 });
    }

    const adminId = userInDb[0].admin_id;
    debugLog.adminIdFromDb = adminId;
    
    // 4. ดึง Roles จาก Permit.io
    debugLog.step = 'fetching_permit_roles';
    let userRoles = ['guest'];
    
    try {
      const permitUser = await permit.api.getUser(adminId.toString());
      if (permitUser) {
        debugLog.permitUserFound = true;
        debugLog.permitRawRoles = permitUser.roles;
        // จัดการรูปแบบ Role ทั้งแบบ String และ Object
        userRoles = permitUser.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];
      }
    } catch (permitError) {
      console.error("Permit API Error:", permitError.message);
      debugLog.permitError = permitError.message;
    }

    debugLog.step = 'success';
    return NextResponse.json(
      { 
        roles: userRoles, 
        isValid: true, 
        email: emailFromToken,
        debug: debugLog 
      },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
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