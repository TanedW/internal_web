// app/api/CheckSession/route.js
import { neon } from '@neondatabase/serverless';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { email, access_token } = await req.json();
    
    // เชื่อมต่อ DB เดียวกับที่ Backend ใช้
    const sql = neon(process.env.NEXT_PUBLIC_DATA_BASE_URL);

    // ดึงข้อมูลมาเทียบ (Logic เดียวกับ Backend เพื่อความปลอดภัย)
    const users = await sql`
      SELECT admin_id, access_token, is_deleted 
      FROM admin_system 
      WHERE email = ${email} 
      LIMIT 1
    `;

    if (users.length === 0) {
      return new Response(JSON.stringify({ authenticated: false, message: 'User not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    // 1. เช็คว่า User ยังมีสิทธิ์ใช้งานอยู่ไหม
    if (user.is_deleted) {
      return new Response(JSON.stringify({ authenticated: false, message: 'Account deactivated' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. เช็คว่า Token ใน LocalStorage ตรงกับใน DB หรือไม่
    // ถ้าไม่ตรงกัน แสดงว่ามีการ Login ใหม่ที่เครื่องอื่น หรือ Token หมดอายุ
    if (user.access_token !== access_token) {
      return new Response(JSON.stringify({ authenticated: false, message: 'Session mismatch' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ authenticated: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ authenticated: false, error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}