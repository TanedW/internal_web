// app/api/richmenu/current/route.js
import { Pool } from 'pg';

// ตั้งค่า Pool สำหรับเชื่อมต่อกับ Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const botKey = searchParams.get('botKey');

    if (!botKey) {
      return Response.json({ error: 'botKey is required' }, { status: 400 });
    }

    // --- ส่วนที่แก้ไข: ดึง Token จาก Database แทน getBotToken ---
    const dbResult = await pool.query(
      'SELECT channel_token FROM line_bots WHERE bot_key = $1',
      [botKey]
    );
    
    const token = dbResult.rows[0]?.channel_token;

    if (!token) {
      return Response.json(
        { error: `ไม่พบ Token สำหรับบอท: ${botKey} ในฐานข้อมูล` },
        { status: 400 }
      );
    }

    // --- เรียก LINE API ---
    const lineRes = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await lineRes.json();

    if (lineRes.ok) {
      return Response.json({
        currentMenuId: data.richMenuId || null,
      });
    }

    // กรณี LINE ตอบกลับมาว่าไม่มีเมนู
    return Response.json({ currentMenuId: null }, { status: 200 });

  } catch (error) {
    console.error('Error in current/route.js:', error);
    return Response.json(
      { error: 'Failed to fetch current menu', details: error.message },
      { status: 500 }
    );
  }
}