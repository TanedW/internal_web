import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(request) {
  const client = await pool.connect(); // Use a single client for transaction
  try {
    const { searchParams } = new URL(request.url);
    const botKey = searchParams.get("botKey");
    const menuId = searchParams.get("menuId");
    const type = searchParams.get("type");

    if (!botKey || !menuId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing botKey or menuId" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const botRes = await client.query(
      "SELECT id, channel_token FROM line_bots WHERE bot_key = $1",
      [botKey],
    );
    const bot = botRes.rows[0];

    if (!bot || !bot.channel_token) {
      return new NextResponse(
        JSON.stringify({ error: "Bot token not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    const token = bot.channel_token;

    if (type === "batch") {
      // ✅ ใช้ Endpoint นี้เพื่อเปลี่ยนเมนูให้ "ทุกคน" (Set Default Rich Menu)
      const lineRes = await fetch(
        `https://api.line.me/v2/bot/user/all/richmenu/${menuId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // ไม่ต้องใส่ Content-Type json เพราะไม่ต้องส่ง Body
          },
          // ไม่ต้องมี body
        },
      );

      if (!lineRes.ok) {
        const errorData = await lineRes.json();
        console.error("LINE API ERROR:", errorData);
        return new NextResponse(
          JSON.stringify({
            error: errorData.message || "Failed to switch menu on LINE API",
          }),
          {
            status: lineRes.status,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await client.query("BEGIN");
      await client.query(
        "UPDATE bot_rich_menus SET is_active = FALSE WHERE bot_id = $1",
        [bot.id],
      );
      await client.query(
        "UPDATE bot_rich_menus SET is_active = TRUE WHERE rich_menu_id = $1 AND bot_id = $2",
        [menuId, bot.id],
      );
      await client.query("COMMIT");

      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      return new NextResponse(
        JSON.stringify({ error: "Unsupported switch type" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback on any error
    console.error("Switch Rich Menu Error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    client.release(); // Release the client back to the pool
  }
}
