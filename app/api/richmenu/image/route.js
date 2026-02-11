import { callLineAPI } from "@/lib/lineApi";
import { getBotToken } from "@/lib/botConfig";

/**
 * GET /api/richmenu-image/[richMenuId]?botKey=xxx
 * 
 * Proxy endpoint เพื่อดึงรูปภาพ Rich Menu จาก LINE API
 * เพราะ browser ไม่สามารถเรียก LINE API โดยตรงได้ (ต้องใช้ Authorization header)
 */
export async function GET(request, { params }) {
  try {
    const { richMenuId } = params;
    const { searchParams } = new URL(request.url);
    let botKey = searchParams.get("botKey");

    // ตรวจสอบ parameters
    if (!richMenuId) {
      return new Response("Rich Menu ID is required", { status: 400 });
    }

    if (!botKey) {
      return new Response("Bot key is required", { status: 400 });
    }

    // Decode URL-encoded botKey
    botKey = decodeURIComponent(botKey);

    // ดึง token
    const token = await getBotToken(botKey);
    if (!token) {
      console.error("Token not found for botKey:", botKey);
      return new Response("Invalid bot key", { status: 400 });
    }

    // เรียก LINE API เพื่อดึงรูปภาพ
    const response = await callLineAPI(
      `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
      "GET",
      null,
      token,
      true // isImage flag
    );

    if (response.code !== 200) {
      console.error("Failed to fetch image from LINE:", response);
      return new Response("Failed to fetch image", { status: response.code });
    }

    // ✅ ส่งรูปภาพกลับไปให้ browser
    // response.response จะเป็น Buffer ของรูปภาพ
    return new Response(response.response, {
      status: 200,
      headers: {
        "Content-Type": "image/png", // หรือ image/jpeg ขึ้นอยู่กับรูปที่อัปโหลด
        "Cache-Control": "public, max-age=86400", // Cache 24 ชั่วโมง
      },
    });

  } catch (error) {
    console.error("Richmenu image proxy error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}