import { NextResponse } from "next/server";

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
