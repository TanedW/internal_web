// app/api/richmenu/bots/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: { rejectUnauthorized: false }
});
// ในไฟล์ page.jsx
const fetchMenus = async () => {
  try {
    // ❌ ของเดิมที่คุณอาจจะเขียนผิด (พยายามใส่ botKey ต่อท้าย path)
    // const response = await fetch(`/api/richmenu/${botKey}`); 

    // ✅ แก้ไขเป็นเรียกไปที่ bots ตรงๆ ตามโครงสร้างไฟล์ของคุณ
    const response = await fetch('/api/richmenu?action=add_bot'); 
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    // ถ้าคุณต้องการกรองเฉพาะบอทตัวที่เลือก (vui7526q) 
    // คุณสามารถกรองข้อมูลที่ได้จาก Array มาพักไว้ใน state ได้ครับ
    const currentBot = data.find(bot => bot.key === botKey);
    setMenus(data); // หรือจัดการข้อมูลตาม logic ของคุณ
    
  } catch (err) {
    console.error("Fetch error:", err);
  }
};

export async function GET() {
  try {
    // Query ข้อมูลบอททั้งหมด เรียงตามเวลาที่สร้างล่าสุด
    const result = await pool.query('SELECT * FROM line_bots ORDER BY created_at DESC');
    
    // ปรับชื่อ field ให้ตรงกับที่ Frontend รอรับ (ถ้าจำเป็น)
    const bots = result.rows.map(row => ({
      id: row.id,
      name: row.bot_name,
      key: row.bot_key,
      pictureUrl: row.picture_url,
      creator_id: row.creator_id
    }));

    return NextResponse.json(bots);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}