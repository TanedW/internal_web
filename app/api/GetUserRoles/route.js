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
    foundInDb: false,
    adminIdFromDb: null,
    emailFromToken: null,
    permitUserFound: false,
    permitError: null
  };

  try {
    // 1. ดึง Token จาก Cookie (Next.js 15 ต้องใช้ await)
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
    // เพื่อความปลอดภัยและรองรับการย้ายระบบในอนาคต (Vendor Agnostic)
    debugLog.step = 'querying_db_by_token';
    const sql = neon(process.env.DATA_BASE_URL);
    
    // ค้นหา user จาก access_token ที่เก็บไว้ในตาราง admin_system
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
    debugLog.adminIdFromDb = userData.admin_id; // UUID: 5e6c5a43-c89b-4500-91b4-d163e254a8c6
    debugLog.emailFromToken = userData.email;

    // 3. ดึง Roles จาก Permit.io 
    debugLog.step = 'fetching_permit_roles';
    let userRoles = ['guest'];
    
    try {
      // ดึงข้อมูล User โดยใช้ admin_id จาก Database
      const permitUser = await permit.api.getUser(userData.admin_id);
      
      if (permitUser) {
        debugLog.permitUserFound = true;
        // จัดการรูปแบบ Role ทั้งแบบ String และ Object
        userRoles = permitUser.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];
      }
    } catch (permitError) {
      // หากเกิด Error เรื่อง Scope (เช่น API Key ไม่ครอบคลุม) จะบันทึกไว้และ fallback เป็น guest
      console.error("Permit API Error:", permitError.message);
      debugLog.permitError = permitError.message;
      userRoles = ['guest'];
    }

    debugLog.step = 'success';
    return NextResponse.json(
      { 
        roles: userRoles, 
        isValid: true, 
        email: userData.email,
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