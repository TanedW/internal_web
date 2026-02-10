export async function GET(request) {
  let debugLog = {
    step: 'init',
    hasTokenInCookie: false,
    dbCheckOk: false,
    emailFromDb: null,
    adminIdFromDb: null,
  };

  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('access_token')?.value; 
    debugLog.hasTokenInCookie = !!token;

    if (!token) {
      return NextResponse.json({ roles: ['guest'], isValid: false }, { status: 401 });
    }

    // 1. ตรวจสอบ Token กับ Database ของเราโดยตรง
    debugLog.step = 'verifying_with_db';
    const sql = neon(process.env.DATA_BASE_URL);
    
    // ค้นหา User ที่มี Token ตรงกับใน Cookie และยังไม่ถูกลบ
    // สมมติว่าคุณมีคอลัมน์ชื่อ access_token ในตาราง admin_system
    const userInDb = await sql`
      SELECT admin_id, email FROM admin_system 
      WHERE access_token = ${token} 
      AND is_deleted = false 
      LIMIT 1
    `;

    if (userInDb.length === 0) {
      debugLog.dbCheckOk = false;
      return NextResponse.json({ 
        roles: ['guest'], 
        isValid: false, 
        message: 'Invalid or Expired Session' 
      }, { status: 401 });
    }

    const userData = userInDb[0];
    debugLog.dbCheckOk = true;
    debugLog.emailFromDb = userData.email;
    debugLog.adminIdFromDb = userData.admin_id;

    // 2. ดึง Roles จาก Permit.io โดยใช้ admin_id ที่ยืนยันแล้วจาก DB
    debugLog.step = 'fetching_permit_roles';
    let userRoles = ['guest'];
    
    try {
      const permitUser = await permit.api.getUser(userData.admin_id.toString());
      if (permitUser) {
        userRoles = permitUser.roles?.map(r => typeof r === 'object' ? r.role : r) || ['guest'];
      }
    } catch (permitError) {
      console.error("Permit API Error:", permitError.message);
    }

    return NextResponse.json({ 
      roles: userRoles, 
      isValid: true, 
      email: userData.email,
      debug: debugLog 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ roles: ['guest'], isValid: false, error: error.message }, { status: 500 });
  }
}