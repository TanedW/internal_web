import { NextResponse } from "next/server";
import { Pool } from "pg";
import { callLineAPI } from "@/lib/lineApi";

const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = searchParams.get("limit") || 20;
    const threshold = searchParams.get("threshold") || 0.1;

    if (!search) {
      return NextResponse.json(
        { message: "กรุณาระบุคำค้นหา" },
        { status: 400 },
      );
    }

    const targetUrl = `https://kong.traffy.in.th/org-name-validator/organizations/search.php?search=${encodeURIComponent(search)}&limit=${limit}&threshold=${threshold}`;
    // ลองพิมพ์ URL ดูใน Terminal ว่าถูกต้องไหม
    console.log("Fetching from PHP:", targetUrl);

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // บางครั้ง Server ต้องการ User-Agent เพื่อป้องกัน Bot
        "User-Agent": "Mozilla/5.0 (Next.js Server)",
      },
      cache: "no-store", // ไม่เก็บ Cache เพื่อความสดใหม่
    });

    const text = await response.text(); // อ่านค่าเป็น Text ก่อนเพื่อเช็คว่า PHP ส่งอะไรมา

    try {
      const data = JSON.parse(text); // ค่อยแปลงเป็น JSON
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("PHP returned non-JSON:", text);
      return NextResponse.json(
        { message: "PHP ส่งข้อมูลกลับมาไม่ใช่ JSON", debug: text },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
export async function POST(req) {
  try {
    // ดักจับถ้าไม่ใช่ JSON
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    const body = await req.json();
    const { action, botKey } = body;
    
    // 3. ดึง Token
    const res = await pool.query("SELECT channel_token FROM line_bots WHERE bot_key = $1", [botKey]);
    const token = res.rows[0]?.channel_token;

    if (!token) return NextResponse.json({ error: "Token not found" }, { status: 404 });

    // 4. แยกการทำงานตาม Action (สร้าง, ลบ, ตั้งค่า)
    switch (action) {
      case "createStructure":
        const step1 = await callLineAPI('https://api.line.me/v2/bot/richmenu', 'POST', richMenuData, token);
        return NextResponse.json(step1.response);
      
      case "setActive":
        await callLineAPI(`https://api.line.me/v2/bot/user/all/richmenu/${menuId}`, 'POST', {}, token);
        return NextResponse.json({ success: true });

      case "delete":
        await callLineAPI(`https://api.line.me/v2/bot/richmenu/${menuId}`, 'DELETE', null, token);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (err) {
    // 5. ถ้าพังตรงไหน ให้คืนค่าเป็น JSON เสมอ หน้าบ้านจะได้ไม่เจอ SyntaxError <!DOCTYPE...
    console.error("API Error:", err);
    return NextResponse.json({ error: "Server Error: " + err.message }, { status: 500 });
  }
}