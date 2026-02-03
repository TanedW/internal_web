// app/api/richmenu/verify-token/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { token } = await req.json();

    // ดึงข้อมูลพื้นฐานของบอทจาก LINE API
    const response = await fetch('https://api.line.me/v2/bot/info', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Token ไม่ถูกต้อง" }, { status: 400 });
    }

    // ส่งข้อมูลที่จำเป็นกลับไปให้ Frontend
    return NextResponse.json({
      name: data.displayName,
      key: data.basicId, // เช่น @traffyfondue
      pictureUrl: data.pictureUrl
    });
  } catch (error) {
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE" }, { status: 500 });
  }
}