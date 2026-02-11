import { callLineAPI } from "@/lib/lineApi";
import { getBotToken } from "@/lib/botConfig";
import { pool } from "@/lib/db";
import { auth } from "@/firebaseConfig";

export async function POST(request) {
  try {
    const formData = await request.formData();
    let botKey = formData.get("botKey");
    const menuName = formData.get("menuName");
    const chatBarText = formData.get("chatBarText") || "เมนูหลัก";
    const menuImage = formData.get("menuImage");

    // ✅ เพิ่มส่วนนี้ใหม่ - Debug log
    console.log("=== API ROUTE DEBUG ===");
    console.log("📌 Received botKey:", botKey);
    console.log("📌 Received menuName:", menuName);
    console.log("📌 Received chatBarText:", chatBarText);
    console.log("📌 Received menuImage:", menuImage ? "Yes" : "No");

    // ✅ เพิ่มส่วนนี้ใหม่ - ตรวจสอบ botKey ก่อน
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

    // ✅ CRITICAL: Decode URL-encoded botKey (%40 → @)
    // ต้องทำก่อนเรียก getBotToken เพราะใน DB เก็บเป็น @vui7526q ไม่ใช่ %40vui7526q
    botKey = decodeURIComponent(botKey);
    console.log("📌 Decoded botKey:", botKey);

    // ✅ รับค่า JSON string ของ areas และ size ที่ส่งมาจากหน้าเว็บ
    const areasString = formData.get("areas");
    const sizeString = formData.get("size");

    const areas = JSON.parse(areasString);
    const size = sizeString
      ? JSON.parse(sizeString)
      : { width: 2500, height: 843 };

    // ✅ ดึง Channel Access Token จาก botKey
    console.log("🔑 Attempting to get token for botKey:", botKey); // ✅ เพิ่มบรรทัดนี้ใหม่
    const token = await getBotToken(botKey);

    console.log("🔑 Token retrieved:", token ? "✅ Yes" : "❌ No"); // ✅ เพิ่มบรรทัดนี้ใหม่

    if (!token) {
      console.error("❌ Token not found for botKey:", botKey); // ✅ เพิ่มบรรทัดนี้ใหม่
      return Response.json(
        {
          error: "Bot token not found",
          details: `Invalid botKey "${botKey}" or token not configured`, // ✅ แก้ไขบรรทัดนี้ - เพิ่ม botKey เข้าไป
        },
        { status: 400 },
      );
    }

    // ตรวจสอบข้อมูลที่จำเป็น
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

    // ✅ สร้าง Object โครงสร้างตาม Format ของ LINE
    const richMenuData = {
      size: size,
      selected: true,
      name: menuName || `Menu_${Date.now()}`,
      chatBarText: chatBarText,
      areas: areas,
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
      console.error("Status Code:", step1.code);
      console.error("Response:", step1.response);
      console.error("Raw Response:", step1.raw);

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
      true, // isImage flag
    );

    console.log("Step 2 Response:", JSON.stringify(step2, null, 2));

    if (step2.code !== 200) {
      console.error("❌ STEP 2 FAILED - Deleting Rich Menu...");
      // ถ้าอัปโหลดรูปล้มเหลว ให้ลบ Rich Menu ที่สร้างไว้
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

    // STEP 3: บันทึกข้อมูลลงฐานข้อมูล
    console.log("🚀 STEP 3: Saving to database...");
    
    try {
      // หา bot_id จาก botKey
      const botResult = await pool.query(
        "SELECT id FROM line_bots WHERE bot_key = $1",
        [botKey]
      );

      if (botResult.rows.length === 0) {
        console.error("❌ Bot not found in database for botKey:", botKey);
        // ลบ Rich Menu ที่สร้างไว้
        await callLineAPI(
          `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
          "DELETE",
          null,
          token
        );
        return Response.json(
          { error: "Bot not found in database" },
          { status: 400 }
        );
      }

      const botId = botResult.rows[0].id;

      // ✅ สร้าง URL สำหรับดึงรูปภาพจาก LINE API
      const imageUrl = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;

      // ✅ รับ creator_id จาก request headers (Firebase Auth)
      // ถ้าไม่มี ให้ใช้ "system" เป็น default
      const creatorId = formData.get("creatorId") || "system";

      // บันทึกลงตาราง bot_rich_menus
      const insertResult = await pool.query(
        `INSERT INTO bot_rich_menus 
         (bot_id, rich_menu_id, menu_name, image_url, is_active, creator_id) 
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          botId,
          richMenuId,
          menuName || `Menu_${Date.now()}`,
          imageUrl, // ✅ เพิ่ม image_url
          false, // ไม่ active อัตโนมัติ ให้ผู้ใช้เลือกเองในหน้า "เปลี่ยน Rich Menu"
          creatorId // ✅ ใช้ creatorId จริง
        ]
      );

      console.log("✅ STEP 3 SUCCESS - Saved to database with ID:", insertResult.rows[0].id);
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      // ถ้าบันทึกลง DB ล้มเหลว ให้ลบ Rich Menu ที่สร้างไว้
      await callLineAPI(
        `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
        "DELETE",
        null,
        token
      );
      return Response.json(
        {
          error: "Failed to save to database",
          details: dbError.message
        },
        { status: 500 }
      );
    }

    console.log("Rich Menu created successfully:", richMenuId);
    console.log("botKey:", botKey);
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
