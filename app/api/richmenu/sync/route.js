// app/api/richmenu/sync/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function POST(req) {
  try {
    const { botKey, creatorId } = await req.json();

    // 1. ดึง Token ของบอทจากฐานข้อมูล
    const botRes = await pool.query(
      'SELECT id, channel_token FROM line_bots WHERE bot_key = $1',
      [botKey]
    );

    if (botRes.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลบอทในระบบ" }, { status: 404 });
    }

    const { id: botId, channel_token: token } = botRes.rows[0];

    // 2. เรียก LINE API เพื่อดึงรายการ Rich Menu ทั้งหมดที่บอทนี้มี
    const lineRes = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await lineRes.json(); // จะได้ { richmenus: [...] }

    if (!lineRes.ok) throw new Error(data.message || "ดึงข้อมูลจาก LINE ล้มเหลว");

    // 3. บันทึกข้อมูลลงฐานข้อมูล (ใช้ ON CONFLICT เพื่อไม่ให้บันทึกซ้ำ)
    const menus = data.richmenus || [];
    let savedCount = 0;

    for (const menu of menus) {
      await pool.query(
        `INSERT INTO bot_rich_menus (bot_id, rich_menu_id, menu_name, creator_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (rich_menu_id) DO NOTHING`, 
        [botId, menu.richMenuId, menu.name, creatorId]
      );
      savedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sync สำเร็จ! พบเมนู ${menus.length} รายการ, บันทึกใหม่ ${savedCount} รายการ` 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}