import { Pool } from 'pg';

// สร้าง connection pool โดยใช้ค่าจาก .env.local
export const pool = new Pool({
  connectionString: process.env.DATA_BASE_URL,
  ssl: {
    rejectUnauthorized: false // จำเป็นสำหรับ Neon DB หรือ Cloud DB ส่วนใหญ่
  }
});