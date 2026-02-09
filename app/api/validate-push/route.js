import { NextResponse } from "next/server";

export async function POST(req) {


  try {
    const flexContents = await req.json();

    const payload = {
      to: "U00000000000000000000000000000000", ///เพื่อไม่ส่งหาใครเลย
      messages: [
        {
          type: "flex",
          altText: "Preview",
          contents: flexContents,
        },
      ],
    };

    const lineRes = await fetch(
      "https://api.line.me/v2/bot/message/validate/push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,///ใส่CHANNEL_ACCESS_TOKENให้ถูก
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await lineRes.json();

    if (!lineRes.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}