import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const botKey = searchParams.get("botKey");
    const menuId = searchParams.get("menuId");

    if (!botKey || !menuId) {
      return NextResponse.json({ error: "Missing botKey or menuId" }, { status: 400 });
    }

    // 1. ดึง Token จากฐานข้อมูล
    const dbResult = await pool.query(
      "SELECT channel_token FROM line_bots WHERE bot_key = $1",
      [botKey]
    );
    const token = dbResult.rows[0]?.channel_token;

    if (!token) {
      return NextResponse.json({ error: "Token not found in database" }, { status: 404 });
    }

    // 2. เรียกไปที่ LINE API
    const lineRes = await fetch(`https://api.line.me/v2/bot/richmenu/${menuId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await lineRes.json();

    if (!lineRes.ok) {
      return NextResponse.json({ error: data.message || "LINE API Error" }, { status: lineRes.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Details Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}