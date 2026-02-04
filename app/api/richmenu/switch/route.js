import { callLineAPI } from '@/lib/lineApi';
import { getBotToken } from '@/lib/botConfig';

// แก้ไขไฟล์ route.js ในส่วน POST สำหรับ switch เมนู
export async function POST(request) {
  try {
    const { botKey, menuId } = await request.json();

    // 1. ดึง Token ของบอทจากฐานข้อมูล
    const botRes = await pool.query(
      'SELECT channel_token FROM line_bots WHERE bot_key = $1',
      [botKey]
    );
    const token = botRes.rows[0]?.channel_token;

    if (!token) return Response.json({ error: 'Invalid bot key' }, { status: 400 });

    // 2. เรียกใช้ LINE API (Batch Link)
    // สำหรับการเปลี่ยนให้ทุกคนใช้เมนูเดียวกัน จะส่งเป็น Operation 'set'
    const lineRes = await fetch('https://api.line.me/v2/bot/richmenu/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operations: [
          {
            type: "link",
            richMenuId: menuId
          }
        ]
      })
    });

    if (lineRes.ok) {
      // 3. อัปเดตสถานะ is_active ในฐานข้อมูล (ย้ายตัวเก่าออก และตั้งตัวใหม่เป็น true)
      await pool.query('UPDATE bot_rich_menus SET is_active = FALSE WHERE bot_id = (SELECT id FROM line_bots WHERE bot_key = $1)', [botKey]);
      await pool.query('UPDATE bot_rich_menus SET is_active = TRUE WHERE rich_menu_id = $1', [menuId]);

      return Response.json({ success: true });
    } else {
      const error = await lineRes.json();
      return Response.json({ error: error.message || 'LINE API Error' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
