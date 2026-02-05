import { NextResponse } from "next/server";
import { Pool } from "pg";

// 1. เชื่อมต่อฐานข้อมูล Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const botKey = searchParams.get("botKey");
  const menuId = searchParams.get("menuId");

  if (!botKey || !menuId) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  try {
    const dbResult = await pool.query(
      "SELECT channel_token FROM line_bots WHERE bot_key = $1",
      [botKey],
    );
    const token = dbResult.rows[0]?.channel_token;

    if (!token) return new NextResponse("Token not found", { status: 404 });

    const lineRes = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${menuId}/content`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!lineRes.ok)
      return new NextResponse("Image not found in LINE", { status: 404 });

    // ✅ ดึง Content-Type จริงจาก LINE API (เช่น image/jpeg หรือ image/png)
    const contentType = lineRes.headers.get("content-type") || "image/png";
    const imageBuffer = await lineRes.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // เก็บ cache ไว้ 1 วันพอ เผื่อมีการแก้ไข
      },
    });
  } catch (error) {
    console.error("Image Fetch Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
