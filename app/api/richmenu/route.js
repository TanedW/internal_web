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
//  GET  /api/richmenu?action=image  → Proxy รูปภาพจาก LINE (รวมอยู่ในไฟล์นี้)
//
// ใช้ query param ?action=... เพื่อแยก endpoint ในกรณีที่ method ซ้ำกัน
// ============================================================

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
  // รองรับทั้ง bot_key = "1","2" (id) และ "@xxx"
  const result = await pool.query(
    "SELECT channel_token FROM line_bots WHERE bot_key = $1 OR id::text = $1 LIMIT 1",
    [String(botKey)],
  );
  if (result.rows[0]?.channel_token) {
    console.log(`  🔑 พบ token ด้วย bot_key/id: "${botKey}"`);
    return result.rows[0].channel_token;
  }
  console.error(`  ❌ ไม่พบ token สำหรับ botKey: "${botKey}"`);
  return null;
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
// HELPER: แปลง payload → LINE flex message object
// รองรับ bubble, carousel
// ========================================
function buildFlexMessage(rawPayload) {
  let contents;
  try {
    contents = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  } catch {
    return null;
  }
  const type = contents?.type;
  if (type === "carousel" || type === "bubble") {
    return {
      type: "flex",
      altText: type === "carousel" ? "เมนู" : "ข้อความ",
      contents,
    };
  }
  // ไม่มี type → wrap เป็น bubble อัตโนมัติ
  if (contents && typeof contents === "object") {
    return { type: "flex", altText: "ข้อความ", contents: { type: "bubble", ...contents } };
  }
  return null;
}

// ========================================
// HELPER: สร้าง quickReply object จาก payload JSON
// payload format:
// {
//   "text": "เลือกเมนูที่ต้องการ",
//   "items": [
//     { "label": "ข่าวสารแจ้งเตือน", "text": "ข่าวสารแจ้งเตือน" },
//     { "label": "สำรวจขึ้นทะเบียน", "text": "สำรวจขึ้นทะเบียน" }
//   ]
// }
// ========================================
function buildQuickReplyMessage(rawPayload) {
  let cfg;
  try {
    cfg = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  } catch {
    return null;
  }
  if (!cfg?.items?.length) return null;

  return {
    type: "text",
    text: cfg.text || "เลือกเมนูที่ต้องการ",
    quickReply: {
      items: cfg.items.slice(0, 13).map((item) => ({
        type: "action",
        action: item.action ?? {
          type: "message",
          label: item.label,
          text: item.text ?? item.label,
        },
      })),
    },
  };
}

// ========================================
// HELPER: process actions array → { replyMessages, sideEffects }
// ใช้ร่วมกันทั้ง postback และ message handler
// ========================================
async function processActions(actionRows, { token, userId }) {
  const replyMessages = [];

  for (const a of actionRows) {
    const type = a.actionType;
    console.log(`  ▶ action type: ${type}`);

    // ── calling ──
    if (type === "calling") {
      try {
        const cfg = JSON.parse(a.payload || "{}");
        const r = await fetch(cfg.url, {
          method: cfg.method || "POST",
          headers: { "Content-Type": "application/json", ...(cfg.headers || {}) },
          ...(cfg.body ? { body: JSON.stringify(cfg.body) } : {}),
        });
        console.log(`  ⚙️  calling → ${cfg.url} (${r.status})`);
      } catch (e) { console.warn(`  ⚠️  calling error: ${e.message}`); }
      continue;
    }

    // ── switch ──
    if (type === "switch") {
      try {
        const cfg = JSON.parse(a.payload || "{}");
        if (cfg.richMenuId && token) {
          const r = await fetch(
            `https://api.line.me/v2/bot/user/${userId}/richmenu/${cfg.richMenuId}`,
            { method: "POST", headers: { Authorization: `Bearer ${token}` } },
          );
          console.log(`  🔀 switch menu → ${cfg.richMenuId} (${r.status})`);
        }
      } catch (e) { console.warn(`  ⚠️  switch error: ${e.message}`); }
      continue;
    }

    // ── rich-menu-unlink ──
    if (type === "rich-menu-unlink") {
      try {
        if (token) {
          const r = await fetch(
            `https://api.line.me/v2/bot/user/${userId}/richmenu`,
            { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
          );
          console.log(`  🙈 rich-menu-unlink (${r.status})`);
        }
      } catch (e) { console.warn(`  ⚠️  unlink error: ${e.message}`); }
      continue;
    }

    // ── quick-reply ──
    if (type === "quick-reply") {
      const msg = buildQuickReplyMessage(a.payload);
      if (msg) {
        console.log(`  💬 quick-reply → ${msg.quickReply.items.length} items`);
        replyMessages.push(msg);
      } else {
        console.warn(`  ⚠️  quick-reply payload ไม่ถูกต้อง`);
      }
      continue;
    }

    // ── flex / bubble / carousel ──
    if (type === "flex" || type === "bubble") {
      const src = a.flexPayload || a.payload;
      const msg = buildFlexMessage(src);
      if (msg) {
        let parsedType = "unknown";
        try { parsedType = JSON.parse(src)?.type; } catch {}
        console.log(`  🃏 flex → contents.type: ${parsedType}`);
        replyMessages.push(msg);
      } else {
        console.warn(`  ⚠️  buildFlexMessage ล้มเหลว → fallback text`);
        replyMessages.push({ type: "text", text: a.payload || "ข้อความ" });
      }
      continue;
    }

    // ── text ──
    replyMessages.push({ type: "text", text: a.payload || "ข้อความ" });
  }

  return replyMessages;
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
      const {
        bot_name,
        bot_key,
        channel_token,
        picture_url,
        creator_id,
        bot_user_id,
      } = body;

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

      // STEP 2: upsert ลง line_bots (รวม bot_user_id)
      const upsertResult = await pool.query(
        `INSERT INTO line_bots (
           bot_name, bot_key, channel_token, picture_url,
           creator_id, bot_user_id, status, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (bot_key) DO UPDATE SET
           bot_name      = EXCLUDED.bot_name,
           channel_token = EXCLUDED.channel_token,
           picture_url   = EXCLUDED.picture_url,
           bot_user_id   = EXCLUDED.bot_user_id,
           updated_at    = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          bot_name || "บอทใหม่",
          bot_key,
          channel_token,
          picture_url || null,
          creator_id,
          bot_user_id || null,
        ],
      );

      const lineBotId = upsertResult.rows[0].id;
      console.log("[add_bot] line_bots id:", lineBotId);

      // STEP 2.5: ดึง bot userId จาก LINE API
      let resolvedBotUserId = bot_user_id || null;
      if (!resolvedBotUserId) {
        try {
          const botInfoRes = await fetch("https://api.line.me/v2/bot/info", {
            headers: { Authorization: `Bearer ${channel_token}` },
          });
          const botInfo = await botInfoRes.json();
          resolvedBotUserId = botInfo.userId || null;
          console.log("[add_bot] botUserId from LINE:", resolvedBotUserId);

          // อัปเดต bot_user_id ลง DB ทันที
          if (resolvedBotUserId) {
            await pool.query(
              "UPDATE line_bots SET bot_user_id = $1 WHERE id = $2",
              [resolvedBotUserId, lineBotId],
            );
          }
        } catch (e) {
          console.warn("[add_bot] ดึง bot userId ไม่ได้:", e.message);
        }
      }

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
        botConfigId: botConfig.id,
        channel_access_token: token,
        botUserId: lineData.userId || null, // ✅ userId ของบอท เช่น Uc13042f6...
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
  // action=delete_bot → Soft Delete บอท (is_deleted = true)
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

      const botRes = await pool.query(
        "SELECT id FROM line_bots WHERE bot_key = $1 AND is_deleted = false",
        [bot_key],
      );

      if (botRes.rows.length === 0) {
        return NextResponse.json(
          { message: "ไม่พบบอทในระบบ" },
          { status: 404 },
        );
      }

      // Soft delete — mark is_deleted = true เท่านั้น ไม่ลบข้อมูลจริง
      await pool.query(
        "UPDATE line_bots SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE bot_key = $1",
        [bot_key],
      );

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
      const token = await getTokenFromDB(botKey);
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
        const botResult = await pool.query(
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
        const imageUrl = `/api/richmenu?action=image&botKey=${encodeURIComponent(botKey)}&menuId=${richMenuId}`;
        const creatorId = formData.get("creatorId") || "system";

        const insertResult = await pool.query(
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

  // --------------------------------------------------
  // action=save_flow → บันทึก Flow (state + action-list) ลง DB
  // เรียกหลัง upload rich menu สำเร็จ
  // --------------------------------------------------
  if (action === "save_flow") {
    try {
      const body = await req.json();
      const { botKey, botName, flowSteps } = body;

      if (!botKey || !flowSteps || flowSteps.length === 0) {
        return NextResponse.json(
          { error: "botKey and flowSteps are required" },
          { status: 400 },
        );
      }

      // ดึง bot_user_id จาก line_bots เพื่อใช้เป็น botID ใน state table
      const botRow = await pool.query(
        "SELECT bot_user_id, bot_name FROM line_bots WHERE bot_key = $1 OR id::text = $1 LIMIT 1",
        [String(botKey)],
      );
      const botUserId = botRow.rows[0]?.bot_user_id;
      const resolvedBotName = botName || botRow.rows[0]?.bot_name || botKey;

      if (!botUserId) {
        console.warn("[save_flow] ไม่พบ bot_user_id สำหรับ botKey:", botKey);
        return NextResponse.json(
          { error: "ไม่พบ bot_user_id กรุณาเพิ่มบอทใหม่อีกครั้ง" },
          { status: 400 },
        );
      }

      console.log(
        "[save_flow] saving",
        flowSteps.length,
        "states | botUserId:",
        botUserId,
      );

      let savedCount = 0;
      for (const step of flowSteps) {
        const postbackData = step.postbackData || step.stateName;

        // ลองหา state เดิมก่อน
        const existingState = await pool.query(
          `SELECT "stateID" FROM state WHERE "postbackData" = $1 AND "botID" = $2 LIMIT 1`,
          [postbackData, botUserId],
        );

        let stateID =
          existingState.rows[0]?.stateid ?? existingState.rows[0]?.stateID;

        if (stateID) {
          // อัปเดต state เดิม
          await pool.query(
            `UPDATE state SET
               "stateName" = $1, "nextStateName" = $2, "botName" = $3,
               "eventType" = $4, "eventMessageType" = $5
             WHERE "stateID" = $6`,
            [
              step.stateName,
              step.nextStateName || "",
              resolvedBotName,
              step.eventType || "postback",
              step.msgType || "text",
              stateID,
            ],
          );
          console.log(
            `[save_flow] UPDATE state "${step.stateName}" (ID:${stateID})`,
          );
        } else {
          // INSERT state ใหม่ — ใช้ epoch ms เป็น stateID (ไม่ต้องพึ่ง sequence)
          const maxIdRow = await pool.query(
            `SELECT COALESCE(MAX("stateID"), 0) + 1 AS next_id FROM state`,
          );
          const newStateID = Number(maxIdRow.rows[0].next_id);
          await pool.query(
            `INSERT INTO state
               ("stateID", "stateName", "nextStateName", "botID", "botName",
                "eventType", "eventMessageType", "postbackData")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              newStateID,
              step.stateName,
              step.nextStateName || "",
              botUserId,
              resolvedBotName,
              step.eventType || "postback",
              step.msgType || "text",
              postbackData,
            ],
          );
          stateID = newStateID;
          console.log(
            `[save_flow] INSERT state "${step.stateName}" (ID:${stateID})`,
          );
        }

        if (!stateID) {
          console.warn("[save_flow] ไม่สามารถบันทึก state:", step.stateName);
          continue;
        }

        // ลบ action-list เก่าของ state นี้แล้ว INSERT ใหม่
        await pool.query(`DELETE FROM action-list WHERE action = $1`, [
          stateID,
        ]);
        console.log(`[save_flow] DELETE old actions for stateID=${stateID}`);

        for (const act of step.actions || []) {
          await pool.query(
            `INSERT INTO action-list
               ("actionID", "order", "actionType", payload, action)
             VALUES ($1,$2,$3,$4,$5)`,
            [
              act.id || Date.now(),
              act.order || 1,
              act.type || "text",
              act.payload || "",
              stateID,
            ],
          );
        }

        savedCount++;
        console.log(
          `[save_flow] ✅ "${step.stateName}" (ID:${stateID}) — ${step.actions?.length || 0} actions saved`,
        );
      }

      return NextResponse.json({
        success: true,
        message: `บันทึก ${savedCount} states สำเร็จ`,
      });
    } catch (error) {
      console.error("save_flow error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // --------------------------------------------------
  // action=webhook → รับ Event จาก LINE (คนกดเมนู / ส่งข้อความ)
  // ตั้งค่า Webhook URL ใน LINE Developers Console เป็น:
  //   https://yourdomain.com/api/richmenu?action=webhook&botKey=@xxxxx
  // --------------------------------------------------
  if (action === "webhook") {
    try {
      const botKey = searchParams.get("botKey");
      const body = await req.json();
      const events = body.events || [];

      console.log("\n╔══════════════════════════════════════════════════════╗");
      console.log(`║  📨 LINE WEBHOOK — botKey: ${botKey}`);
      console.log(`║  📦 Events: ${events.length} รายการ`);
      console.log("╚══════════════════════════════════════════════════════╝");

      const token = botKey ? await getTokenFromDB(botKey) : null;
      console.log(`  🔑 token: ${token ? "✅ พบ" : "❌ ไม่พบ"}`);
      for (const event of events) {
        const userId = event.source?.userId || "unknown";
        const groupId = event.source?.groupId || null;
        const roomId = event.source?.roomId || null;
        const sourceId = groupId || roomId || userId;
        const ts = event.timestamp
          ? new Date(event.timestamp).toLocaleString("th-TH")
          : "-";

        // ─── POSTBACK (กดปุ่ม Rich Menu แบบ API) ───
        if (event.type === "postback") {
          const data = event.postback?.data || "";
          const displayText =
            event.postback?.displayText || "(ไม่มี displayText)";
          const replyToken = event.replyToken;

          let parsedData = data;
          try {
            parsedData = JSON.stringify(JSON.parse(data), null, 2);
          } catch {}

          console.log(
            "\n┌─ 🖱️  POSTBACK — คนกดปุ่มเมนู ────────────────────────",
          );
          console.log(`│  🕐 เวลา        : ${ts}`);
          console.log(`│  👤 userId      : ${userId}`);
          if (groupId) console.log(`│  👥 groupId     : ${groupId}`);
          console.log(`│  💬 displayText : ${displayText}`);
          console.log(`│  📋 data        :`);
          parsedData
            .split("\n")
            .forEach((line) => console.log(`│     ${line}`));
          console.log(
            "└──────────────────────────────────────────────────────",
          );

          // ─── parse data format {"para":"go-to","selected-value":{...}} ───
          let postbackData = data;
          let stateName = "standby";
          let eventType = "postback";
          try {
            const parsed = JSON.parse(data);
            if (parsed?.["para"] === "go-to" && parsed?.["selected-value"]) {
              const sv = parsed["selected-value"];
              postbackData = sv.postbackData || data;
              stateName = sv.stateName || "standby";
              eventType = sv.eventType || "postback";
            }
          } catch {}

          console.log(
            `  📌 postbackData: "${postbackData}" | stateName: "${stateName}"`,
          );

          // ─── POSTBACK: ดึง action list + อัปเดต user_state ───
          if (token && replyToken) {
            try {
              // สร้างตาราง user_state ถ้ายังไม่มี
              await pool.query(`
                CREATE TABLE IF NOT EXISTS user_state (
                  user_id    TEXT NOT NULL,
                  bot_id     TEXT NOT NULL,
                  state_name TEXT NOT NULL DEFAULT 'standby',
                  updated_at TIMESTAMP DEFAULT NOW(),
                  PRIMARY KEY (user_id, bot_id)
                )
              `);

              const botInfoRow = await pool.query(
                "SELECT bot_user_id FROM line_bots WHERE bot_key = $1 OR id::text = $1 LIMIT 1",
                [String(botKey)],
              );
              const botUserId = botInfoRow.rows[0]?.bot_user_id;

              // ─── อ่าน user_state ปัจจุบันของ user ───
              const userStateRow = await pool.query(
                `SELECT state_name FROM user_state WHERE user_id = $1 AND bot_id = $2`,
                [userId, botUserId],
              );
              const currentUserState =
                userStateRow.rows[0]?.state_name || "standby";
              console.log(`  👤 user_state ปัจจุบัน: "${currentUserState}"`);

              // ─── หา state ที่ตรงกับ postbackData AND stateName ตาม user_state ปัจจุบัน ───
              // ลอง match postbackData + currentUserState ก่อน (ภาพเดียว หลาย state)
              let stateRow = await pool.query(
                `SELECT "stateID", "stateName", "nextStateName"
                 FROM state
                 WHERE "postbackData" = $1 AND "botID" = $2 AND "stateName" = $3
                 LIMIT 1`,
                [postbackData, botUserId, currentUserState],
              );

              // ถ้าไม่เจอ → fallback หาจาก postbackData อย่างเดียว
              if (stateRow.rows.length === 0) {
                stateRow = await pool.query(
                  `SELECT "stateID", "stateName", "nextStateName"
                   FROM state
                   WHERE "postbackData" = $1 AND "botID" = $2
                   LIMIT 1`,
                  [postbackData, botUserId],
                );
              }

              console.log(
                `  🔍 ค้นหา state: postbackData="${postbackData}" | userState="${currentUserState}" | botUserId="${botUserId}"`,
              );

              if (stateRow.rows.length > 0) {
                const foundState = stateRow.rows[0];
                const foundStateID = foundState?.stateID ?? foundState?.stateid;
                const nextStateName =
                  foundState.nextStateName ??
                  foundState.nextstatename ??
                  "standby";
                console.log(
                  `  ✅ พบ state: "${foundState.stateName}" (ID:${foundStateID}) → next: "${nextStateName}"`,
                );

                // ─── ดึง actions โดยใช้ stateID ───
                const actionRows = await pool.query(
                  `SELECT al."actionType", al.payload, al."flexPayload"
                   FROM "action-list" al
                   WHERE al.action = $1
                   ORDER BY al."order" ASC`,
                  [foundStateID],
                );

                console.log(`  📋 พบ ${actionRows.rows.length} actions`);

                if (actionRows.rows.length > 0) {
                  const messages = (
                    await processActions(actionRows.rows, { token, userId })
                  ).slice(0, 5);

                  if (messages.length > 0) {
                    const replyRes = await fetch(
                      "https://api.line.me/v2/bot/message/reply",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ replyToken, messages }),
                      },
                    );
                    const replyData = await replyRes.json();
                    if (replyRes.ok) {
                      console.log(`  ✅ ตอบกลับสำเร็จ ${messages.length} ข้อความ`);
                      messages.forEach((m, i) =>
                        console.log(`     [${i + 1}] ${m.type}${m.type === "flex" ? ` (${m.contents?.type})` : m.quickReply ? " +quickReply" : `: ${m.text?.substring(0, 50)}`}`),
                      );
                    } else {
                      console.error("  ❌ ตอบกลับล้มเหลว:", JSON.stringify(replyData));
                    }
                  }

                  // อัปเดต user_state → nextStateName
                  await pool.query(
                    `INSERT INTO user_state (user_id, bot_id, state_name, updated_at)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (user_id, bot_id) DO UPDATE SET
                       state_name = EXCLUDED.state_name, updated_at = NOW()`,
                    [userId, botUserId, nextStateName],
                  );
                  console.log(`  📍 user_state อัปเดต → "${nextStateName}"`);
                } else {
                  console.log("  ⚠️  ไม่พบ actions สำหรับ state นี้");
                }
              } else {
                console.log(
                  `  ⚠️  ไม่พบ state: postbackData="${postbackData}" botUserId="${botUserId}"`,
                );
                console.log(`      💡 กรุณา save flow ใหม่อีกครั้ง`);
              }
            } catch (replyErr) {
              console.error("  ❌ Postback reply error:", replyErr.message);
            }
          }

          try {
            await pool.query(
              `INSERT INTO webhook_logs (bot_key, event_type, user_id, source_id, data, display_text, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
              [botKey, "postback", userId, sourceId, data, displayText],
            );
          } catch (dbErr) {
            console.warn(
              "  ⚠️  ไม่มีตาราง webhook_logs (ข้ามได้):",
              dbErr.message,
            );
          }
        }

        // ─── MESSAGE (ส่งข้อความ) ───
        else if (event.type === "message") {
          const msg = event.message || {};
          const msgType = msg.type || "unknown";
          const text = msg.text || `[${msgType}]`;
          const replyToken = event.replyToken;

          console.log(
            "\n┌─ 💬 MESSAGE — ผู้ใช้ส่งข้อความ ──────────────────────",
          );
          console.log(`│  🕐 เวลา      : ${ts}`);
          console.log(`│  👤 userId    : ${userId}`);
          if (groupId) console.log(`│  👥 groupId   : ${groupId}`);
          console.log(`│  📝 ประเภท    : ${msgType}`);
          console.log(`│  📩 ข้อความ   : ${text}`);
          console.log(
            "└──────────────────────────────────────────────────────",
          );

          if (token && replyToken) {
            try {
              // สร้างตาราง user_state ถ้ายังไม่มี
              await pool.query(`
                CREATE TABLE IF NOT EXISTS user_state (
                  user_id    TEXT NOT NULL,
                  bot_id     TEXT NOT NULL,
                  state_name TEXT NOT NULL DEFAULT 'standby',
                  updated_at TIMESTAMP DEFAULT NOW(),
                  PRIMARY KEY (user_id, bot_id)
                )
              `);

              const botInfoRow = await pool.query(
                "SELECT bot_user_id FROM line_bots WHERE bot_key = $1 OR id::text = $1 LIMIT 1",
                [String(botKey)],
              );
              const botUserId = botInfoRow.rows[0]?.bot_user_id;

              // ✅ ดึง user_state ปัจจุบันของ user คนนี้
              const userStateRow = await pool.query(
                `SELECT state_name FROM user_state WHERE user_id = $1 AND bot_id = $2`,
                [userId, botUserId],
              );
              const currentStateName =
                userStateRow.rows[0]?.state_name || "standby";
              console.log(`  📍 user_state ปัจจุบัน: "${currentStateName}"`);

              // ✅ ค้นหา state ที่ stateName = currentStateName AND eventType = message
              const stateRow = await pool.query(
                `SELECT "stateID", "stateName", "nextStateName"
   FROM state
   WHERE "stateName" = $1
     AND "eventType" = 'message'
     AND "eventMessageType" = $2
     AND "botID" = $3
   LIMIT 1`,
                [currentStateName, msgType, botUserId],
              );

              console.log(
                `  🔍 ค้นหา state: stateName="${currentStateName}" eventType=message msgType="${msgType}"`,
              );

              if (stateRow.rows.length > 0) {
                const foundState = stateRow.rows[0];
                const nextStateName = foundState.nextStateName || "standby";
                console.log(
                  `  ✅ พบ state: "${foundState.stateName}" → next: "${nextStateName}"`,
                );

                // ✅ ดึง actions จาก stateID
                const foundStateID = foundState.stateID ?? foundState.stateid;
                const actionRows = await pool.query(
                  `SELECT al."actionType", al.payload, al."flexPayload"
                   FROM "action-list" al
                   WHERE al.action = $1
                   ORDER BY al."order" ASC`,
                  [foundStateID],
                );

                console.log(`  📋 พบ ${actionRows.rows.length} actions`);

                if (actionRows.rows.length > 0) {
                  const messages = (
                    await processActions(actionRows.rows, { token, userId })
                  ).slice(0, 5);

                  if (messages.length > 0) {
                    const replyRes = await fetch(
                      "https://api.line.me/v2/bot/message/reply",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ replyToken, messages }),
                      },
                    );
                    const replyData = await replyRes.json();
                    if (replyRes.ok) {
                      console.log(`  ✅ ตอบกลับ message สำเร็จ ${messages.length} ข้อความ`);
                      messages.forEach((m, i) =>
                        console.log(`     [${i + 1}] ${m.type}${m.type === "flex" ? ` (${m.contents?.type})` : m.quickReply ? " +quickReply" : `: ${m.text?.substring(0, 50)}`}`),
                      );
                    } else {
                      console.error("  ❌ ตอบกลับล้มเหลว:", JSON.stringify(replyData));
                    }
                  }

                  // อัปเดต user_state → nextStateName
                  await pool.query(
                    `INSERT INTO user_state (user_id, bot_id, state_name, updated_at)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (user_id, bot_id) DO UPDATE SET
                       state_name = EXCLUDED.state_name, updated_at = NOW()`,
                    [userId, botUserId, nextStateName],
                  );
                  console.log(`  📍 user_state อัปเดต → "${nextStateName}"`);
                } else {
                  console.log(`  ⚠️  ไม่พบ actions สำหรับ state "${currentStateName}"`);
                }
              } else {
                console.log(
                  `  ⚠️  ไม่พบ state สำหรับ stateName="${currentStateName}" + eventType=message`,
                );
                console.log(
                  `      (user อยู่ใน state "${currentStateName}" แต่ไม่มี message handler — ข้ามได้)`,
                );
              }
            } catch (msgErr) {
              console.error("  ❌ Message reply error:", msgErr.message);
            }
          }
        }

        // ─── FOLLOW (เพิ่มเพื่อน) ───
        else if (event.type === "follow") {
          console.log(
            "\n┌─ ➕ FOLLOW — ผู้ใช้ใหม่เพิ่มบอท ──────────────────────",
          );
          console.log(`│  🕐 เวลา    : ${ts}`);
          console.log(`│  👤 userId  : ${userId}`);
          console.log(
            "└──────────────────────────────────────────────────────",
          );
        }

        // ─── UNFOLLOW ───
        else if (event.type === "unfollow") {
          console.log(
            "\n┌─ ➖ UNFOLLOW — ผู้ใช้ลบบอท ───────────────────────────",
          );
          console.log(`│  🕐 เวลา    : ${ts}`);
          console.log(`│  👤 userId  : ${userId}`);
          console.log(
            "└──────────────────────────────────────────────────────",
          );
        }

        // ─── EVENT อื่นๆ ───
        else {
          console.log(`\n┌─ ❓ EVENT: ${event.type}`);
          console.log(`│  userId: ${userId} | เวลา: ${ts}`);
          console.log(
            "└──────────────────────────────────────────────────────",
          );
        }
      }

      // LINE ต้องการ 200 กลับเสมอ ไม่งั้นจะ retry
      return NextResponse.json({ status: "ok" }, { status: 200 });
    } catch (error) {
      console.error("[WEBHOOK ERROR]", error);
      return NextResponse.json({ status: "ok" }, { status: 200 });
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
  // action=list_bots → ดึงบอททั้งหมดที่ยังไม่ถูกลบ (is_deleted = false)
  // --------------------------------------------------
  if (action === "list_bots") {
    try {
      const result = await pool.query(
        "SELECT * FROM line_bots WHERE is_deleted = false ORDER BY created_at DESC",
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