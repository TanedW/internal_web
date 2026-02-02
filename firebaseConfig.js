// Import function ที่จำเป็น
import { initializeApp } from "firebase/app";
// เพิ่ม import auth และ provider สำหรับ Google
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // เพิ่ม import Firestore

// ดึงค่าจาก .env มาใช้ (Vercel จะเติมค่าให้เองตอน Build)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Setup Google Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email"); // ขอสิทธิ์เข้าถึง email

// 3. Setup Analytics (ใส่เงื่อนไขป้องกัน Error ตอนรันบน Server Side)
let analytics;
if (typeof window !== "undefined") {
  // เช็คว่ารันบน Browser ถึงจะเรียก Analytics
  // analytics = getAnalytics(app); 
  // หมายเหตุ: ถ้ายังไม่ได้เปิด Analytics ใน Console อาจจะ comment บรรทัดบนไว้ก่อนได้ครับ
}

// 4. Setup Firestore
const db = getFirestore(app); // สร้าง object Firestore

// 5. Export ออกไปใช้
export { auth, googleProvider, analytics, db }; // Export db เพิ่ม