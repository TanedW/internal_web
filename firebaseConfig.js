// Import function ที่จำเป็น
import { initializeApp, getApps, getApp } from "firebase/app"; // เพิ่ม getApps, getApp
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// ✅ 1. Initialize Firebase (แบบเช็คการซ้ำซ้อน)
// ถ้ามี App รันอยู่แล้วให้ใช้ getApp() ถ้าไม่มีให้สร้างใหม่ด้วย initializeApp()
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Setup Google Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");

// 4. Setup Firestore
const db = getFirestore(app);

// 5. Export ออกไปใช้
export { auth, googleProvider, db };
