import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// 1. เชื่อมต่อฐานข้อมูล Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

// แก้ไขไฟล์ route.js ของคุณเพื่อให้รองรับการดึงภาพ
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const botKey = searchParams.get('botKey');
  const menuId = searchParams.get('menuId');

  // ตรวจสอบค่าที่จำเป็น
  if (!botKey || !menuId) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  try {
    // 1. ดึง Channel Token ของบอทตัวนี้จากตาราง line_bots
    const dbResult = await pool.query(
      'SELECT channel_token FROM line_bots WHERE bot_key = $1',
      [botKey]
    );
    const token = dbResult.rows[0]?.channel_token;

    if (!token) return new NextResponse('Token not found', { status: 404 });

    // 2. ดึงข้อมูลภาพจาก LINE API โดยใช้ menuId
    const lineRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${menuId}/content`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!lineRes.ok) return new NextResponse('Image not found in LINE', { status: 404 });

    const imageBuffer = await lineRes.arrayBuffer();
    
    // 3. ส่งกลับเป็นไฟล์ภาพพร้อมตั้งค่า Header
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': 'image/png', // หรือดึงจาก lineRes.headers
        'Cache-Control': 'public, max-age=31536000, immutable', // แนะนำให้ทำ Caching ไว้เพื่อความเร็ว
      },
    });
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}