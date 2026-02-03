import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// 1. เชื่อมต่อฐานข้อมูล Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const botKey = searchParams.get('botKey');
  const menuId = searchParams.get('menuId');

  if (!botKey || !menuId) {
    return new NextResponse('Missing botKey or menuId', { status: 400 });
  }

  try {
    // 2. ดึง Token ของบอทตัวนั้นๆ จากฐานข้อมูลโดยตรง
    const dbResult = await pool.query(
      'SELECT channel_token FROM line_bots WHERE bot_key = $1',
      [botKey]
    );
    
    const token = dbResult.rows[0]?.channel_token;

    if (!token) {
      return new NextResponse('Bot token not found in database', { status: 404 });
    }

    // 3. เรียกไปที่ LINE API Data เพื่อดึง Binary ของรูปภาพ
    const lineRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${menuId}/content`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!lineRes.ok) {
      return new NextResponse('Failed to fetch image from LINE', { status: lineRes.status });
    }

    // 4. ส่งข้อมูลรูปภาพ (Buffer) กลับไปแสดงผลที่หน้าจอ
    const imageBuffer = await lineRes.arrayBuffer();
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': lineRes.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=3600', // ทำ Cache ไว้ 1 ชม. เพื่อลด Load
      },
    });

  } catch (error) {
    console.error('API Image Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}