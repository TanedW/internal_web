'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebaseConfig";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login Success:", result.user);
      router.push("/manage");
    } catch (error) {
      console.error("Login Error:", error);
      alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
      setIsLoading(false);
    }
  };
return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F2ECE4] p-6 font-sans overflow-hidden">
      
      {/* โหลดฟอนต์ Kanit */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Kanit', sans-serif; }
      `}</style>

      {/* กรอบ Card หลัก */}
      <div 
        className={`
          relative bg-white w-full max-w-[380px] 
          rounded-[50px] shadow-[0_20px_50px_rgba(141,110,99,0.1)] overflow-hidden 
          flex flex-col items-center justify-between
          p-8 py-10 min-h-[600px]
          transition-all duration-700 ease-out transform
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}
      >
        
        {/* ส่วนหัวข้อ */}
        <div className="text-center w-full mt-2">
          <h1 className="text-[40px] font-bold text-[#5D4037] leading-tight mb-1">Traffy.</h1>
          <p className="text-[12px] text-gray-400 font-normal tracking-[0.2em] uppercase">Fondue Manager</p>
        </div>

        {/* ส่วนมาสคอตและกล่องโลโก้ */}
        <div className="relative w-full flex flex-col justify-center items-center my-6">
            {/* คำพูด "Hi!" */}
            <div className="absolute left-6 top-0 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="bg-white px-5 py-2 rounded-[22px] rounded-bl-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#5D4037]">Hi!</span>
                </div>
            </div>

            {/* กล่องโลโก้สีน้ำตาล */}
            <div className="w-[200px] h-[200px] bg-[#8D6E63] rounded-[45px] flex items-center justify-center p-3 shadow-lg transform rotate-[-2deg]">
                <div className="w-full h-full bg-white rounded-[35px] overflow-hidden relative flex items-center justify-center">
                    <img 
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTg5mWorU_ZKKPHFx4qjilfCcbjduxdDfJSuw&s" 
                      alt="Traffy Fondue Logo" 
                      className="w-3/4 h-3/4 object-contain"
                    />
                </div>
            </div>
        </div>

        {/* ส่วนปุ่มดำเนินการ */}
        <div className="w-full flex flex-col items-center gap-6 mb-2">
            
            {/* ปุ่มเข้าสู่ระบบแบบใหม่ตามที่คุณระบุ */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="bg-white text-black border-[#e5e5e5] border w-full flex items-center justify-center gap-3 py-3 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm h-12 md:h-14 active:scale-95"
            >
              {isLoading ? (
                 <div className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                    <span className="text-slate-600 text-sm md:text-base">กำลังเชื่อมต่อ...</span>
                 </div>
              ) : (
                <>
                  <svg aria-label="Google logo" width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <g>
                      <path d="m0 0H512V512H0" fill="#fff"></path>
                      <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
                      <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
                      <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
                      <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
                    </g>
                  </svg>
                  <span className="text-sm md:text-base font-medium">Sign in with Google</span>
                </>
              )}
            </button>

            {/* จุดบอกสถานะ */}
            <div className="flex gap-2">
                <div className="w-7 h-2 bg-[#8D6E63] rounded-full"></div>
                <div className="w-2 h-2 bg-[#E0D5C8] rounded-full"></div>
                <div className="w-2 h-2 bg-[#E0D5C8] rounded-full"></div>
            </div>
        </div>

      </div>
    </div>
  );
}