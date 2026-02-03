// app/api/richmenu/bots/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET() {
  try {
    // Query ข้อมูลบอททั้งหมด เรียงตามเวลาที่สร้างล่าสุด
    const result = await pool.query('SELECT * FROM line_bots ORDER BY created_at DESC');
    
    // ปรับชื่อ field ให้ตรงกับที่ Frontend รอรับ (ถ้าจำเป็น)
    const bots = result.rows.map(row => ({
      id: row.id,
      name: row.bot_name,
      key: row.bot_key,
      pictureUrl: row.picture_url,
      creator_id: row.creator_id
    }));

    return NextResponse.json(bots);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}