// ============================================================
// UNIFIED RICH MENU API ROUTE
// รวมทุก endpoint เข้าเป็นไฟล์เดียว - โครงสร้างเดิมทุกอย่าง
// ============================================================
// Endpoints ที่รวมอยู่ในไฟล์นี้:
//
//  POST /api/richmenu              → add_bot (เพิ่มบอทใหม่)
//  GET  /api/richmenu              → list_bots (ดูบอททั้งหมด)
//  POST /api/richmenu/verify-token → ตรวจสอบ LINE Token
//  GET  /api/richmenu/current      → ดู Rich Menu ปัจจุบัน
//  GET  /api/richmenu/list         → ดูรายการ Rich Menu ของบอท (sync อัตโนมัติ)
//  POST /api/richmenu/sync         → Sync Rich Menu จาก LINE → DB
//  POST /api/richmenu/upload       → สร้าง Rich Menu + อัปโหลดรูป
//  GET  /api/richmenu/switch       → เปลี่ยน/เซต Default Rich Menu (type=batch)
//  GET  /api/richmenu/details      → ดูรายละเอียด Rich Menu
//  DELETE /api/richmenu/delete     → ลบ Rich Menu
//  GET  /api/richmenu-image/[id]   → Proxy รูปภาพจาก LINE
//
// ใช้ query param ?action=... เพื่อแยก endpoint ในกรณีที่ method ซ้ำกัน
// ============================================================
///

import { NextResponse } from "next/server";
import { Pool } from "pg";

// ========================================
// DATABASE POOL
// ========================================
const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ========================================
// HELPER: ดึง channel_access_token จาก line_bots ตาม bot_key
// ========================================
async function getTokenFromDB(botKey) {
  const result = await pool.query(
    "SELECT channel_token FROM line_bots WHERE bot_key = $1",
    [botKey],
  );
  return result.rows[0]?.channel_token || null;
}

// ========================================
// HELPER: ดึง bot row จาก line_bots ตาม bot_key
// ========================================
async function getLineBotByKey(botKey) {
  const result = await pool.query(
    "SELECT id, bot_key, channel_token, bot_name FROM line_bots WHERE bot_key = $1",
    [botKey],
  );
  return result.rows[0] || null;
}

// ========================================
// POST /api/richmenu
// action=add_bot  → เพิ่มบอทใหม่
// action=verify_token → ตรวจสอบ LINE Token
// action=sync     → Sync Rich Menu จาก LINE → DB
// action=upload   → สร้าง Rich Menu + อัปโหลดรูป
// action=delete   → ลบ Rich Menu
// ========================================
export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // DEBUG: log ทุก request เพื่อหาต้นตอ error
  console.log("[API] POST action:", action);
  console.log("[API] DATA_BASE_URL exists:", !!process.env.DATA_BASE_URL);

  // --------------------------------------------------
  // action=add_bot
  // Flow:
  //   1. รับ bot_key, channel_token, bot_name, picture_url, creator_id
  //   2. บันทึก/อัปเดต line_bots
  //   3. ดึง rich menu ทั้งหมดจาก LINE → sync ลง bot_rich_menus
  // --------------------------------------------------
  if (action === "add_bot") {
    try {
      const body = await req.json();
      const { bot_name, bot_key, channel_token, picture_url, creator_id } =
        body;

      if (!bot_key || !channel_token || !creator_id) {
        return NextResponse.json(
          { message: "ข้อมูลไม่ครบ (bot_key, channel_token, creator_id)" },
          { status: 400 },
        );
      }

      // STEP 1: ตรวจสอบว่า bot_key นี้มีใน bot_config จริง (double-check)
      const configCheck = await pool.query(
        "SELECT id FROM bot_config WHERE channel_access_token = $1 LIMIT 1",
        [channel_token],
      );

      if (configCheck.rows.length === 0) {
        return NextResponse.json(
          { message: "ไม่พบ Token นี้ในระบบ bot_config กรุณาติดต่อผู้ดูแล" },
          { status: 403 },
        );
      }

      // STEP 2: upsert ลง line_bots
      const upsertResult = await pool.query(
        `INSERT INTO line_bots (
           bot_name, bot_key, channel_token, picture_url,
           creator_id, status, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (bot_key) DO UPDATE SET
           bot_name      = EXCLUDED.bot_name,
           channel_token = EXCLUDED.channel_token,
           picture_url   = EXCLUDED.picture_url,
           updated_at    = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          bot_name || "บอทใหม่",
          bot_key,
          channel_token,
          picture_url || null,
          creator_id,
        ],
      );

      const lineBotId = upsertResult.rows[0].id;
      console.log("[add_bot] line_bots id:", lineBotId);

      // STEP 3: ดึง rich menu ทั้งหมดจาก LINE แล้ว sync ลง bot_rich_menus
      const lineRes = await fetch("https://api.line.me/v2/bot/richmenu/list", {
        headers: { Authorization: `Bearer ${channel_token}` },
      });
      const lineData = await lineRes.json();
      const menus = lineData.richmenus || [];
      let syncCount = 0;

      for (const menu of menus) {
        await pool.query(
          `INSERT INTO bot_rich_menus (bot_id, rich_menu_id, menu_name, creator_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (rich_menu_id) DO NOTHING`,
          [
            lineBotId,
            menu.richMenuId,
            menu.name || "Imported Menu",
            creator_id,
          ],
        );
        syncCount++;
      }

      console.log(`[add_bot] synced ${syncCount} rich menus`);

      return NextResponse.json(
        {
          success: true,
          message: `เพิ่มบอทสำเร็จ และ sync เมนู ${syncCount} รายการ`,
          data: { id: lineBotId, bot_name, synced: syncCount },
        },
        { status: 201 },
      );
    } catch (error) {
      console.error("add_bot error:", error);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาดที่ฐานข้อมูล: " + error.message },
        { status: 500 },
      );
    }
  }

  // --------------------------------------------------
  // action=verify_token → เช็ค token ใน bot_config แล้วดึงข้อมูลบอท
  // --------------------------------------------------
  if (action === "verify_token") {
    try {
      const { token } = await req.json();

      if (!token) {
        return NextResponse.json(
          { message: "กรุณาใส่ Token" },
          { status: 400 },
        );
      }

      // 1. เช็คใน bot_config ว่ามี channel_access_token ตรงกันไหม
      const configRes = await pool.query(
        "SELECT * FROM bot_config WHERE channel_access_token = $1 LIMIT 1",
        [token],
      );

      if (configRes.rows.length === 0) {
        return NextResponse.json(
          { message: "ไม่พบ Token นี้ในระบบ กรุณาติดต่อผู้ดูแล" },
          { status: 404 },
        );
      }

      const botConfig = configRes.rows[0];

      // 2. ดึงข้อมูลบอทจาก LINE API เพื่อให้ได้ชื่อ/รูป
      const lineRes = await fetch("https://api.line.me/v2/bot/info", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const lineData = await lineRes.json();

      if (!lineRes.ok) {
        return NextResponse.json(
          { message: lineData.message || "Token ไม่ถูกต้องหรือหมดอายุ" },
          { status: 400 },
        );
      }

      // 3. ส่งข้อมูลรวมกลับไป
      return NextResponse.json({
        name: lineData.displayName || botConfig.nickname,
        key: botConfig.bot_id, // @xxx จาก bot_config → ใช้เป็น bot_key ใน line_bots
        pictureUrl: lineData.pictureUrl,
        botConfigId: botConfig.id, // id จาก bot_config (ส่งไปให้ add_bot ใช้ต่อ)
        channel_access_token: token,
      });
    } catch (error) {
      console.error("verify_token error:", error);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message },
        { status: 500 },
      );
    }
  }

  // --------------------------------------------------
  // action=delete_bot → ลบบอทออกจาก line_bots
  // --------------------------------------------------
  if (action === "delete_bot") {
    try {
      const { bot_key } = await req.json();

      if (!bot_key) {
        return NextResponse.json(
          { message: "bot_key is required" },
          { status: 400 },
        );
      }

      // ลบ rich menus ที่เกี่ยวข้องก่อน (foreign key)
      const botRes = await pool.query(
        "SELECT id FROM line_bots WHERE bot_key = $1",
        [bot_key],
      );

      if (botRes.rows.length === 0) {
        return NextResponse.json(
          { message: "ไม่พบบอทในระบบ" },
          { status: 404 },
        );
      }

      const botId = botRes.rows[0].id;

      // ลบ rich menus ที่ผูกกับบอทนี้
      await pool.query("DELETE FROM bot_rich_menus WHERE bot_id = $1", [botId]);

      // ลบบอท
      await pool.query("DELETE FROM line_bots WHERE id = $1", [botId]);

      return NextResponse.json({ success: true, message: "ลบบอทสำเร็จ" });
    } catch (error) {
      console.error("delete_bot error:", error);
      return NextResponse.json(
        { message: "เกิดข้อผิดพลาด: " + error.message },
        { status: 500 },
      );
    }
  }

  // --------------------------------------------------
  // action=sync → Sync Rich Menu จาก LINE → DB
  // --------------------------------------------------
  if (action === "sync") {
    try {
      const { botKey, creatorId } = await req.json();

      const botRes = await pool.query(
        "SELECT id, channel_token FROM line_bots WHERE bot_key = $1",
        [botKey],
      );

      if (botRes.rows.length === 0) {
        return NextResponse.json(
          { error: "ไม่พบข้อมูลบอทในระบบ" },
          { status: 404 },
        );
      }

      const { id: botId, channel_token: token } = botRes.rows[0];

      const lineRes = await fetch("https://api.line.me/v2/bot/richmenu/list", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await lineRes.json();
      if (!lineRes.ok)
        throw new Error(data.message || "ดึงข้อมูลจาก LINE ล้มเหลว");

      const menus = data.richmenus || [];
      let savedCount = 0;

      for (const menu of menus) {
        await pool.query(
          `INSERT INTO bot_rich_menus (bot_id, rich_menu_id, menu_name, creator_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (rich_menu_id) DO NOTHING`,
          [botId, menu.richMenuId, menu.name, creatorId],
        );
        savedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Sync สำเร็จ! พบเมนู ${menus.length} รายการ, บันทึกใหม่ ${savedCount} รายการ`,
      });
    } catch (error) {
      console.error("Sync Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // --------------------------------------------------
  // action=upload → สร้าง Rich Menu + อัปโหลดรูปภาพ
  // --------------------------------------------------
  if (action === "upload") {
    try {
      const { callLineAPI } = await import("@/lib/lineApi");
      const { getBotToken } = await import("@/lib/botConfig");
      const { pool: sharedPool } = await import("@/lib/db");
      const formData = await req.formData();
      let botKey = formData.get("botKey");
      const menuName = formData.get("menuName");
      const chatBarText = formData.get("chatBarText") || "เมนูหลัก";
      const menuImage = formData.get("menuImage");

      console.log("=== API ROUTE DEBUG ===");
      console.log("📌 Received botKey:", botKey);
      console.log("📌 Received menuName:", menuName);
      console.log("📌 Received chatBarText:", chatBarText);
      console.log("📌 Received menuImage:", menuImage ? "Yes" : "No");

      if (!botKey) {
        console.error("❌ botKey is missing or empty");
        return Response.json(
          {
            error: "Bot key is required",
            details: "botKey parameter is missing from the request",
          },
          { status: 400 },
        );
      }

      botKey = decodeURIComponent(botKey);
      console.log("📌 Decoded botKey:", botKey);

      const areasString = formData.get("areas");
      const sizeString = formData.get("size");
      const areas = JSON.parse(areasString);
      const size = sizeString
        ? JSON.parse(sizeString)
        : { width: 2500, height: 843 };

      console.log("🔑 Attempting to get token for botKey:", botKey);
      const token = await getBotToken(botKey);
      console.log("🔑 Token retrieved:", token ? "✅ Yes" : "❌ No");

      if (!token) {
        console.error("❌ Token not found for botKey:", botKey);
        return Response.json(
          {
            error: "Bot token not found",
            details: `Invalid botKey "${botKey}" or token not configured`,
          },
          { status: 400 },
        );
      }

      if (!menuImage) {
        return Response.json(
          { error: "Menu image is required" },
          { status: 400 },
        );
      }

      if (!areas || areas.length === 0) {
        return Response.json(
          { error: "Menu areas are required" },
          { status: 400 },
        );
      }

      const richMenuData = {
        size,
        selected: true,
        name: menuName || `Menu_${Date.now()}`,
        chatBarText,
        areas,
      };

      console.log(
        "Creating Rich Menu with data:",
        JSON.stringify(richMenuData, null, 2),
      );

      // STEP 1: สร้างโครงสร้าง Rich Menu
      console.log("🚀 STEP 1: Creating Rich Menu structure...");
      const step1 = await callLineAPI(
        "https://api.line.me/v2/bot/richmenu",
        "POST",
        richMenuData,
        token,
      );

      console.log("Step 1 Response:", JSON.stringify(step1, null, 2));

      if (step1.code !== 200 || !step1.response?.richMenuId) {
        console.error("❌ STEP 1 FAILED");
        return Response.json(
          {
            error: "Failed to create menu structure",
            details: step1.response?.message || step1.raw || "Unknown error",
            statusCode: step1.code,
            fullResponse: step1,
          },
          { status: 400 },
        );
      }

      const richMenuId = step1.response.richMenuId;
      console.log("✅ STEP 1 SUCCESS - Rich Menu ID:", richMenuId);

      // STEP 2: อัปโหลดรูปภาพ
      console.log("🚀 STEP 2: Uploading image...");
      const imageBuffer = Buffer.from(await menuImage.arrayBuffer());
      console.log("📸 Image buffer size:", imageBuffer.length, "bytes");

      const step2 = await callLineAPI(
        `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
        "POST",
        imageBuffer,
        token,
        true,
      );

      console.log("Step 2 Response:", JSON.stringify(step2, null, 2));

      if (step2.code !== 200) {
        console.error("❌ STEP 2 FAILED - Deleting Rich Menu...");
        await callLineAPI(
          `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
          "DELETE",
          null,
          token,
        );
        return Response.json(
          {
            error: "Failed to upload image",
            details:
              step2.response?.message || step2.raw || "Image upload failed",
            statusCode: step2.code,
            fullResponse: step2,
          },
          { status: 400 },
        );
      }

      console.log("✅ STEP 2 SUCCESS - Image uploaded");

      // STEP 3: บันทึกลงฐานข้อมูล
      console.log("🚀 STEP 3: Saving to database...");
      try {
        const botResult = await sharedPool.query(
          "SELECT id FROM line_bots WHERE bot_key = $1",
          [botKey],
        );

        if (botResult.rows.length === 0) {
          console.error("❌ Bot not found in database for botKey:", botKey);
          await callLineAPI(
            `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
            "DELETE",
            null,
            token,
          );
          return Response.json(
            { error: "Bot not found in database" },
            { status: 400 },
          );
        }

        const botId = botResult.rows[0].id;
        const imageUrl = `/api/richmenu-image/${richMenuId}?botKey=${encodeURIComponent(botKey)}`;
        const creatorId = formData.get("creatorId") || "system";

        const insertResult = await sharedPool.query(
          `INSERT INTO bot_rich_menus 
           (bot_id, rich_menu_id, menu_name, image_url, is_active, creator_id) 
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            botId,
            richMenuId,
            menuName || `Menu_${Date.now()}`,
            imageUrl,
            false,
            creatorId,
          ],
        );

        console.log(
          "✅ STEP 3 SUCCESS - Saved to database with ID:",
          insertResult.rows[0].id,
        );
      } catch (dbError) {
        console.error("❌ Database error:", dbError);
        await callLineAPI(
          `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
          "DELETE",
          null,
          token,
        );
        return Response.json(
          { error: "Failed to save to database", details: dbError.message },
          { status: 500 },
        );
      }

      console.log("✅ Menu saved and ready to be activated from dashboard");

      return Response.json({
        success: true,
        richMenuId,
        message: `Menu "${menuName}" created successfully. Go to "เปลี่ยน Rich Menu" to activate it.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return Response.json(
        {
          error: "Internal server error",
          details: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        { status: 500 },
      );
    }
  }

  // --------------------------------------------------
  // action=delete → ลบ Rich Menu จาก LINE และ DB
  // --------------------------------------------------
  if (action === "delete") {
    try {
      const { callLineAPI } = await import("@/lib/lineApi");
      const { pool: sharedPool } = await import("@/lib/db");
      const { botKey: rawBotKey, menuId } = await req.json();

      if (!rawBotKey || !menuId) {
        return Response.json(
          { error: "botKey and menuId are required" },
          { status: 400 },
        );
      }

      const decodedBotKey = decodeURIComponent(rawBotKey);
      console.log("Delete request:", {
        originalBotKey: rawBotKey,
        decodedBotKey,
        menuId,
      });

      const botResult = await sharedPool.query(
        "SELECT channel_token FROM line_bots WHERE bot_key = $1",
        [decodedBotKey],
      );

      if (botResult.rows.length === 0) {
        console.error("Token not found in DB for botKey:", decodedBotKey);
        return Response.json({ error: "Invalid bot key" }, { status: 400 });
      }

      const token = botResult.rows[0].channel_token;

      const result = await callLineAPI(
        `https://api.line.me/v2/bot/richmenu/${menuId}`,
        "DELETE",
        null,
        token,
      );

      console.log("LINE API delete result:", result);

      if (result.code === 200) {
        await sharedPool.query(
          "DELETE FROM bot_rich_menus WHERE rich_menu_id = $1",
          [menuId],
        );
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

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// ========================================
// GET /api/richmenu
// action=list_bots → ดูบอททั้งหมด
// action=current   → ดู Rich Menu ปัจจุบัน (?botKey=...)
// action=list      → ดูรายการ Rich Menu ของบอท + sync (?botKey=...)
// action=switch    → เปลี่ยน Default Rich Menu (?botKey=...&menuId=...&type=batch)
// action=details   → ดูรายละเอียด Rich Menu (?botKey=...&menuId=...)
// action=image     → Proxy รูปภาพจาก LINE (?richMenuId=...&botKey=...)
// ========================================
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // DEBUG: log ทุก request เพื่อหาต้นตอ error
  console.log("[API] GET action:", action);
  console.log("[API] DATA_BASE_URL exists:", !!process.env.DATA_BASE_URL);

  // --------------------------------------------------
  // action=audit_logs → ดึง Audit Log ของบอทตัวนั้น (กรองด้วย bot_key)
  // --------------------------------------------------
  if (action === "audit_logs") {
    try {
      const botKey = searchParams.get("botKey");
      if (!botKey) {
        return NextResponse.json(
          { error: "botKey is required" },
          { status: 400 },
        );
      }

      // JOIN กับ admin_system เพื่อได้ชื่อ admin จริง
      const result = await pool.query(
        `SELECT
           al.id,
           al.admin_id,
           COALESCE(a.first_name || ' ' || a.last_name, a.email, al.admin_id) AS admin_name,
           a.profile_url AS admin_avatar,
           al.action,
           al.bot_key,
           al.bot_name,
           al.menu_id_from,
           al.menu_id_to,
           al.menu_name,
           al.detail,
           al.created_at
         FROM audit_logs al
         LEFT JOIN admin_system a ON a.admin_id::text = al.admin_id
         WHERE al.bot_key = $1
         ORDER BY al.created_at DESC
         LIMIT 200`,
        [decodeURIComponent(botKey)],
      );

      return NextResponse.json({ logs: result.rows });
    } catch (error) {
      console.error("audit_logs error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // --------------------------------------------------
  // action=list_bots → ดึงเฉพาะบอทที่ user คนนี้เพิ่มไว้ (กรองด้วย creator_id)
  // --------------------------------------------------
  if (action === "list_bots") {
    try {
      const creatorId = searchParams.get("creatorId");

      if (!creatorId) {
        return NextResponse.json(
          { error: "creatorId is required" },
          { status: 400 },
        );
      }

      const result = await pool.query(
        "SELECT * FROM line_bots WHERE creator_id = $1 ORDER BY created_at DESC",
        [creatorId],
      );

      const bots = result.rows.map((row) => ({
        id: row.id,
        name: row.bot_name,
        key: row.bot_key,
        pictureUrl: row.picture_url,
        creator_id: row.creator_id,
      }));

      return NextResponse.json(bots);
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // --------------------------------------------------
  // action=current → ดู Rich Menu ที่เซตเป็น Default ของบอท
  // --------------------------------------------------
  if (action === "current") {
    try {
      const botKey = searchParams.get("botKey");

      if (!botKey) {
        return Response.json({ error: "botKey is required" }, { status: 400 });
      }

      // ดึง bot_id และ token จาก DB
      const botRes = await pool.query(
        "SELECT id, channel_token FROM line_bots WHERE bot_key = $1",
        [botKey],
      );

      if (botRes.rows.length === 0) {
        return Response.json({ error: "Bot not found" }, { status: 404 });
      }

      const { id: botId, channel_token: token } = botRes.rows[0];

      // ดึง currentMenuId จาก LINE API
      const lineRes = await fetch(
        "https://api.line.me/v2/bot/user/all/richmenu",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await lineRes.json();
      const currentMenuId = lineRes.ok ? data.richMenuId || null : null;

      // ถ้าได้ menuId ให้สร้าง imageUrl สำหรับ proxy ดึงรูปจาก LINE โดยตรง
      let imageUrl = null;
      if (currentMenuId) {
        // ลองหาจาก DB ก่อน (กรณี upload ผ่านระบบ)
        const menuRes = await pool.query(
          "SELECT image_url FROM bot_rich_menus WHERE rich_menu_id = $1 AND bot_id = $2",
          [currentMenuId, botId],
        );
        const dbImageUrl = menuRes.rows[0]?.image_url;

        if (dbImageUrl) {
          imageUrl = dbImageUrl;
        } else {
          // fallback: ดึงรูปจาก LINE โดยตรงผ่าน proxy
          imageUrl = `/api/richmenu?action=image&botKey=${encodeURIComponent(botKey)}&menuId=${currentMenuId}`;
        }
      }

      return Response.json({ currentMenuId, imageUrl });
    } catch (error) {
      console.error("Error in current action:", error);
      return Response.json(
        { error: "Failed to fetch current menu", details: error.message },
        { status: 500 },
      );
    }
  }

  // --------------------------------------------------
  // action=list → ดูรายการ Rich Menu ของบอท + auto sync
  // --------------------------------------------------
  if (action === "list") {
    const botKey = searchParams.get("botKey");

    if (!botKey) {
      return NextResponse.json(
        { error: "botKey is required" },
        { status: 400 },
      );
    }

    try {
      const botRes = await pool.query(
        "SELECT id, channel_token FROM line_bots WHERE bot_key = $1",
        [botKey],
      );
      const bot = botRes.rows[0];
      if (!bot) {
        return NextResponse.json({ error: "Bot not found" }, { status: 404 });
      }

      // ดึงรายการจาก LINE API
      const lineRes = await fetch("https://api.line.me/v2/bot/richmenu/list", {
        headers: { Authorization: `Bearer ${bot.channel_token}` },
      });
      const lineData = await lineRes.json();
      const lineMenus = lineData.richmenus || [];

      // ดึง ID ที่มีใน DB
      const dbRes = await pool.query(
        "SELECT rich_menu_id FROM bot_rich_menus WHERE bot_id = $1",
        [bot.id],
      );
      const dbMenuIds = dbRes.rows.map((row) => row.rich_menu_id);

      // SYNC: ถ้ามีใน LINE แต่ไม่มีใน DB ให้เพิ่ม
      for (const menu of lineMenus) {
        if (!dbMenuIds.includes(menu.richMenuId)) {
          await pool.query(
            `INSERT INTO bot_rich_menus (bot_id, rich_menu_id, menu_name, creator_id) 
             VALUES ($1, $2, $3, $4)`,
            [bot.id, menu.richMenuId, menu.name || "Legacy Menu", "system"],
          );
        }
      }

      // ดึงข้อมูลสุดท้ายจาก DB
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
        [bot.id],
      );

      return NextResponse.json({ richmenus: finalResult.rows });
    } catch (error) {
      console.error("Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // --------------------------------------------------
  // action=switch → เปลี่ยน Default Rich Menu (type=batch)
  // --------------------------------------------------
  if (action === "switch") {
    const client = await pool.connect();
    try {
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
        const lineRes = await fetch(
          `https://api.line.me/v2/bot/user/all/richmenu/${menuId}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
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
      }

      return new NextResponse(
        JSON.stringify({ error: "Unsupported switch type" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Switch Rich Menu Error:", error);
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      client.release();
    }
  }

  // --------------------------------------------------
  // action=details → ดูรายละเอียด Rich Menu จาก LINE API
  // --------------------------------------------------
  if (action === "details") {
    try {
      const botKey = searchParams.get("botKey");
      const menuId = searchParams.get("menuId");

      if (!botKey || !menuId) {
        return NextResponse.json(
          { error: "Missing botKey or menuId" },
          { status: 400 },
        );
      }

      const dbResult = await pool.query(
        "SELECT channel_token FROM line_bots WHERE bot_key = $1",
        [botKey],
      );
      const token = dbResult.rows[0]?.channel_token;

      if (!token) {
        return NextResponse.json(
          { error: "Token not found in database" },
          { status: 404 },
        );
      }

      const lineRes = await fetch(
        `https://api.line.me/v2/bot/richmenu/${menuId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await lineRes.json();

      if (!lineRes.ok) {
        return NextResponse.json(
          { error: data.message || "LINE API Error" },
          { status: lineRes.status },
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("API Details Error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  // --------------------------------------------------
  // action=image → Proxy รูปภาพ Rich Menu จาก LINE โดยตรง
  // --------------------------------------------------
  if (action === "image") {
    try {
      let botKey = searchParams.get("botKey");
      const richMenuId =
        searchParams.get("richMenuId") || searchParams.get("menuId");

      if (!richMenuId) {
        return new Response("Rich Menu ID is required", { status: 400 });
      }
      if (!botKey) {
        return new Response("Bot key is required", { status: 400 });
      }

      botKey = decodeURIComponent(botKey);

      // ดึง token จาก DB
      const token = await getTokenFromDB(botKey);
      if (!token) {
        console.error("Token not found in DB for botKey:", botKey);
        return new Response("Invalid bot key", { status: 400 });
      }

      console.log("[image] richMenuId:", richMenuId);
      console.log("[image] botKey:", botKey);
      console.log("[image] token exists:", !!token);

      // เรียก LINE API โดยตรง ไม่ผ่าน lib
      const lineRes = await fetch(
        `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("[image] LINE response status:", lineRes.status);

      if (!lineRes.ok) {
        const errText = await lineRes.text();
        console.error("[image] LINE error body:", errText);
        return new Response(`LINE API error: ${lineRes.status} - ${errText}`, {
          status: lineRes.status,
        });
      }

      // Stream รูปภาพกลับไปให้ browser โดยตรง
      const imageBuffer = await lineRes.arrayBuffer();

      return new Response(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": lineRes.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (error) {
      console.error("Richmenu image proxy error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}