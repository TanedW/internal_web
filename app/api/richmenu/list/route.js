import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const botKey = searchParams.get("botKey");

  if (!botKey) {
    return NextResponse.json({ error: "botKey is required" }, { status: 400 });
  }

  try {
    // 1. ดึงข้อมูลบอท
    const botRes = await pool.query(
      "SELECT id, channel_token FROM line_bots WHERE bot_key = $1",
      [botKey]
    );
    const bot = botRes.rows[0];
    if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

    // 2. ดึงรายการเมนูจาก LINE API (เพื่อให้แน่ใจว่าข้อมูลหน้าเว็บตรงกับใน LINE)
    const lineRes = await fetch("https://api.line.me/v2/bot/richmenu/list", {
      headers: { Authorization: `Bearer ${bot.channel_token}` },
    });
    const lineData = await lineRes.json();
    const lineMenus = lineData.richmenus || [];

    // 3. ดึง ID ที่มีอยู่ใน Database มาเช็ค
    const dbRes = await pool.query(
      "SELECT rich_menu_id FROM bot_rich_menus WHERE bot_id = $1",
      [bot.id]
    );
    const dbMenuIds = dbRes.rows.map((row) => row.rich_menu_id);

    // 4. SYNC: ถ้ามีใน LINE แต่ไม่มีใน DB ให้เพิ่มเข้าไป (กันข้อมูลตกหล่น)
    for (const menu of lineMenus) {
      if (!dbMenuIds.includes(menu.richMenuId)) {
        await pool.query(
          `INSERT INTO bot_rich_menus (bot_id, rich_menu_id, menu_name, creator_id) 
           VALUES ($1, $2, $3, $4)`,
          [bot.id, menu.richMenuId, menu.name || "Legacy Menu", "system"]
        );
      }
    }

    // 5. ดึงข้อมูลรวม (จุดสำคัญ: ดึง image_url ออกมาด้วย)
    const finalResult = await pool.query(
      `SELECT 
          rich_menu_id as "richMenuId", 
          menu_name as "name", 
          image_url as "image_url", 
          is_active,
          created_at
       FROM bot_rich_menus 
       WHERE bot_id = $1 
       ORDER BY created_at DESC`,
      [bot.id]
    );

    // ส่งออกไปในรูปแบบที่ Frontend รอรับ
    return NextResponse.json({ richmenus: finalResult.rows }); 
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}