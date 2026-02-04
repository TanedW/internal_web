import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// ป้องกันการสร้าง Connection ใหม่ทุกครั้ง (สำคัญมากสำหรับ Serverless)
let pool;
if (!global.pgPool) {
  global.pgPool = new Pool({
    connectionString: process.env.DATA_BASE_URL,
    ssl: { rejectUnauthorized: false } // ต้องมีสำหรับ Neon
  });
}
pool = global.pgPool;

export async function POST(req) {
  try {
    const body = await req.json();
    const { bot_name, bot_key, channel_token, picture_url, creator_id } = body;

    // ตรวจสอบข้อมูลบังคับ
    if (!bot_key || !channel_token || !creator_id) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบ (bot_key, token, creator_id)" }, { status: 400 });
    }

    const query = `
      INSERT INTO line_bots (
        bot_name, 
        bot_key, 
        channel_token, 
        picture_url, 
        creator_id, 
        status, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, created_at;
    `;
    
    const values = [
      bot_name || "บอทใหม่", 
      bot_key, 
      channel_token, 
      picture_url || null, 
      creator_id // เก็บ UID จาก Firebase เพื่อดู Log
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({ 
    success: true, 
    message: "เพิ่มบอทสำเร็จ",
    data: {               // หุ้มด้วย data object
        id: result.rows[0].id,
        bot_name: bot_name
    } 
    }, { status: 201 });

  } catch (error) {
    console.error("Database Error:", error);
    
    // จัดการกรณี Bot Key ซ้ำ
    if (error.code === '23505') {
      return NextResponse.json({ message: "LINE ID นี้ถูกใช้ไปแล้ว" }, { status: 409 });
    }

    return NextResponse.json({ message: "เกิดข้อผิดพลาดที่ฐานข้อมูล: " + error.message }, { status: 500 });
  }
}