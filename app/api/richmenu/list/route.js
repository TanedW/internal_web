import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const botKey = searchParams.get('botKey');

  try {
    // 1. ดึง Token จาก Database
    const botRes = await pool.query('SELECT id, channel_token FROM line_bots WHERE bot_key = $1', [botKey]);
    const bot = botRes.rows[0];
    if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

    // 2. ดึงรายการเมนูจาก LINE API (ข้อมูลสด)
    const lineRes = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      headers: { 'Authorization': `Bearer ${bot.channel_token}` }
    });
    const lineData = await lineRes.json();
    const lineMenus = lineData.richmenus || [];

    // 3. ดึงข้อมูลจาก Database ของเราเอง
    const dbRes = await pool.query('SELECT rich_menu_id FROM bot_rich_menus WHERE bot_id = $1', [bot.id]);
    const dbMenuIds = dbRes.rows.map(row => row.rich_menu_id);

    // 4. ตรวจสอบและ Sync (ถ้าใน LINE มี แต่ใน DB ไม่มี ให้ INSERT เพิ่ม)
    for (const menu of lineMenus) {
      if (!dbMenuIds.includes(menu.richMenuId)) {
        await pool.query(
          `INSERT INTO bot_rich_menus (bot_id, rich_menu_id, menu_name, creator_id) 
           VALUES ($1, $2, $3, $4)`,
          [bot.id, menu.richMenuId, menu.name || 'Legacy Menu', 'system']
        );
      }
    }

    // 5. ดึงข้อมูลประวัติทั้งหมดที่รวมร่างกันแล้วส่งกลับไป
    const finalResult = await pool.query(
      'SELECT rich_menu_id AS "richMenuId", menu_name AS "name", created_at FROM bot_rich_menus WHERE bot_id = $1 ORDER BY created_at DESC',
      [bot.id]
    );

    return NextResponse.json(finalResult.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}