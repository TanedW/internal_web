// app/manage/page.jsx

'use client'; // จำเป็นต้องใส่เพราะมีการใช้ Hooks (useState, useEffect)

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

// ⚠️ จุดสำคัญ: การ import ไฟล์ config
// เนื่องจากไฟล์ firebaseConfig.js อยู่ที่ root (นอกสุด) แต่ไฟล์นี้อยู่ลึกเข้ามา 2 ชั้น (app/manage)
// เราจึงใช้ @/ เพื่ออ้างอิงถึง root folder โดยตรง (วิธีนี้ชัวร์ที่สุด)
import { auth } from "../../firebaseConfig"; 
// หรือถ้า @ ใช้ไม่ได้ ให้ใช้: import { auth } from "../../firebaseConfig";

export default function Manage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังก์ชันตรวจสอบสถานะ Login แบบ Real-time
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // ถ้ามีคน Login อยู่ -> เก็บข้อมูลลง state และปิดหน้าโหลด
        setUser(currentUser);
        setLoading(false);
      } else {
        // ถ้าไม่มีคน Login -> ดีดกลับไปหน้าแรกทันที
        router.push("/");
      }
    });

    // คืนค่าฟังก์ชัน Cleanup (ทำงานเมื่อเปลี่ยนหน้า)
    return () => unsubscribe();
  }, [router]);

  // ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); // กลับไปหน้า Login
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 1. ส่วนแสดงผลตอนกำลังโหลด (Loading State)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // 2. ส่วนแสดงผลหลัก (Main Content) - จะโชว์เมื่อ Login แล้วเท่านั้น
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center font-sans p-4">
      
      {/* Script สำหรับ Tailwind/DaisyUI (ถ้า setup ใน layout.js แล้ว ลบส่วนนี้ออกได้) */}
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      <div className="card w-full max-w-lg bg-base-100 shadow-2xl rounded-3xl overflow-hidden border border-white/60">
        
        {/* Header สีสวยๆ ด้านบน */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="avatar">
                    <div className="w-24 rounded-full ring ring-white ring-offset-base-100 ring-offset-2 shadow-lg bg-gray-200">
                        {/* ถ้ามีรูปโปรไฟล์ให้โชว์ ถ้าไม่มีให้โชว์รูป placeholder */}
                        <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" />
                    </div>
                </div>
            </div>
        </div>

        <div className="card-body pt-12 text-center">
          <h2 className="text-3xl font-black text-gray-800 mt-2">
            Hey, {user?.displayName || "วัยรุ่น"}! 👋
          </h2>
          <p className="text-gray-500 font-medium">
            {user?.email}
          </p>

          <div className="divider my-6">ข้อมูลส่วนตัว</div>

          <div className="space-y-4">
            <div className="stats shadow w-full bg-indigo-50">
                <div className="stat place-items-center">
                    <div className="stat-title text-indigo-500">สถานะสมาชิก</div>
                    <div className="stat-value text-indigo-600 text-xl">Active</div>
                    <div className="stat-desc">Login ผ่าน Google</div>
                </div>
            </div>
          </div>

          <div className="card-actions justify-center mt-8">
            <button 
                onClick={handleLogout} 
                className="btn btn-error text-white w-full rounded-xl text-lg font-bold shadow-md hover:shadow-lg transition-all"
            >
              ออกจากระบบ (Sign Out)
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}