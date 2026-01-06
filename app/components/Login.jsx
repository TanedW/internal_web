'use client';

import { signIn } from "next-auth/react";

export default function Login() {
  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/manage" });
  };

  return (
    // --- ปรับปรุงส่วนพื้นหลัง ---
    // ใช้ bg-gradient-to-br เพื่อสร้างสีพื้นหลังแบบไล่ระดับ ดูมีมิติ ไม่โล่ง
    <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      {/* หมายเหตุ: ในโปรเจกต์จริง ควรย้าย link/script เหล่านี้ไปที่ไฟล์ layout.js หรือติดตั้งผ่าน npm */}
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

    
      <div className="card bg-base-100 w-full max-w-md shadow-2xl rounded-3xl border border-white/50 relative overflow-hidden">
        
        {/* (Optional) เพิ่มแสงฟุ้งๆ ด้านบนการ์ด */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600 opacity-80"></div>

        <div className="card-body px-8 py-10">
          
          <div className="text-center mb-10">
            {/* (Optional) เพิ่มไอคอนเล็กๆ ด้านบน */}
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>

            {/* --- ปรับปรุงหัวข้อ --- */}
            {/* ใช้ text-transparent bg-clip-text bg-gradient-to-r เพื่อทำตัวหนังสือไล่สี */}
            <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              ยินดีต้อนรับ
            </h2>
            <p className="text-base text-base-content/70 mt-3 font-medium">
              กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ
            </p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="btn bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm w-full h-12 text-base font-bold normal-case rounded-xl flex gap-3 transition-all"
          >
            <svg aria-label="Google logo" width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
            <span className="flex-1">Sign in with Google</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}