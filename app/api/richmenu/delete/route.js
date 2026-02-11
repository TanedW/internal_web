import { callLineAPI } from "@/lib/lineApi";
import { pool } from "@/lib/db";

export async function POST(request) {
  try {
    const { botKey, menuId } = await request.json();

    if (!botKey || !menuId) {
      return Response.json(
        { error: "botKey and menuId are required" },
        { status: 400 },
      );
    }

    // Decode botKey ก่อน (กรณี URL encoded เช่น %40 -> @)
    const decodedBotKey = decodeURIComponent(botKey);

    console.log("Delete request:", {
      originalBotKey: botKey,
      decodedBotKey,
      menuId,
    });

    // Query bot token จากฐานข้อมูลโดยตรง
    const botResult = await pool.query(
      "SELECT channel_token FROM line_bots WHERE bot_key = $1",
      [decodedBotKey],
    );

    if (botResult.rows.length === 0) {
      console.error("Token not found in DB for botKey:", decodedBotKey);
      return Response.json({ error: "Invalid bot key" }, { status: 400 });
    }

    const token = botResult.rows[0].channel_token;

    // ลบจาก LINE API
    const result = await callLineAPI(
      `https://api.line.me/v2/bot/richmenu/${menuId}`,
      "DELETE",
      null,
      token,
    );

    console.log("LINE API delete result:", result);

    if (result.code === 200) {
      // ลบจากฐานข้อมูลด้วย
      await pool.query("DELETE FROM bot_rich_menus WHERE rich_menu_id = $1", [
        menuId,
      ]);

      return Response.json({
        success: true,
        message: "Menu deleted successfully",
      });
    }

    return Response.json(
      { error: result.response?.message || "Failed to delete menu" },
      { status: result.code || 400 },
    );
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
