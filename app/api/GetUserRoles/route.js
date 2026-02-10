import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { Permit } from "permitio";
import { cookies } from 'next/headers';

// แนะนำให้ใช้ Node.js runtime สำหรับ Permit.io และการต่อ Database
// export const runtime = 'edge'; 

const permit = new Permit({
  pdp: "https://cloudpdp.api.permit.io",
  token: process.env.PERMIT_API_KEY,
});

export async function GET(request) {
  let debugLog = {
    step: 'init',
    hasTokenInCookie: false,
    firebaseVerifyOk: false,
    emailFromToken: null,
    foundInDb: false,
    adminIdFromDb: null,
    permitUserFound: false,
    permitRawRoles: null
  };

  try {
    // 1. ดึง Token จาก Cookie (Next.js 15)
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

    // 2. ตรวจสอบ Token กับ Firebase Identity Toolkit
    debugLog.step = 'verifying_firebase_token';
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    // ใช้ endpoint สำหรับการยืนยัน ID Token ผ่าน REST API
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      }
    );

    debugLog.firebaseVerifyOk = verifyRes.ok;
    
    if (!verifyRes.ok) {
      const errorData = await verifyRes.json();
      debugLog.verifyError = errorData;
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        debug: debugLog 
      }, { status: 401 });
    }

    const tokenData = await verifyRes.json();
    // ดึง email จากผลลัพธ์ของ Firebase users array
    const emailFromToken = tokenData.users?.[0]?.email; 
    debugLog.emailFromToken = emailFromToken;

    if (!emailFromToken) {
        return NextResponse.json({ 
          roles: ['guest'], 
          isValid: false, 
          message: 'Email not found in token',
          debug: debugLog 
        }, { status: 401 });
    }

    // 3. ตรวจสอบใน Database (Neon Postgres)
    debugLog.step = 'querying_db';
    const sql = neon(process.env.DATA_BASE_URL);
    
    // ป้องกัน Case Sensitive ของ Email ด้วย LOWER()
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
        email: emailFromToken,
        debug: debugLog 
      }, { status: 200 });
    }

    const adminId = userInDb[0].admin_id;
    debugLog.adminIdFromDb = adminId;
    
    // 4. ดึง Roles จาก Permit.io
    debugLog.step = 'fetching_permit_roles';
    let userRoles = ['guest'];
    
    try {
      // ตรวจสอบว่ามี User ใน Permit หรือไม่ โดยใช้ admin_id เป็น User Key
      const permitUser = await permit.api.getUser(adminId.toString());
      if (permitUser) {
        debugLog.permitUserFound = true;
        debugLog.permitRawRoles = permitUser.roles;
        
        // จัดการ Format ของ Roles (เผื่อกรณี Permit คืนค่ามาเป็น Object หรือ String)
        userRoles = permitUser.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];
      }
    } catch (permitError) {
      console.error("Permit API Error:", permitError.message);
      debugLog.permitError = permitError.message;
      // ถ้าไม่พบ User ใน Permit จะปล่อยให้เป็น guest ตามค่าเริ่มต้น
    }

    debugLog.step = 'success';
    return NextResponse.json(
      { 
        roles: userRoles, 
        isValid: true, 
        email: emailFromToken,
        adminId: adminId,
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