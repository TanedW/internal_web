'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebaseConfig";

export default function Login() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(""); 
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login Success:", result.user);

      const user = result._tokenResponse;

      const userData = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        access_token: user.oauthAccessToken,
      };

      console.log("User Data:", userData);

      try {
        const DB_API = process.env.NEXT_PUBLIC_DB_LOGIN_API_URL; 
        const response = await fetch(DB_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log("API Response:", responseData);
          
          router.push("/manage"); 
        } else {
          // อ่านข้อความ Error จาก Backend
          const errorData = await response.json(); 
          console.log("API Error:", response.status, errorData.message);
          
          // แสดงข้อความภาษาไทย
          if (response.status === 403) {
             setErrorMsg("อีเมลนี้ไม่มีสิทธิ์เข้าใช้งานระบบ (Not Authorized)");
          } else {
             setErrorMsg("API Error: " + (errorData.message || response.statusText));
          }
        }
      } catch (apiError) {
        console.error("API Call Error:", apiError);
        setErrorMsg("An error occurred while calling the API.");
      }
      
      // 🗑️ ลบส่วนที่เคยอยู่ตรงนี้ออก (if response.ok ...) เพราะ response อยู่นอก scope

    } catch (error) {
      console.error("Login Error:", error);
      setErrorMsg("เข้าสู่ระบบไม่สำเร็จ: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-0 md:p-6 lg:p-12 font-sans selection:bg-amber-200 overflow-x-hidden">
      {/* Google Font: Kanit */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@200;300;400;500;600;700&display=swap');
        body { font-family: 'Kanit', sans-serif; }
      `}</style>

      {/* --- Main Responsive Container --- */}
      <div 
        className={`
          relative w-full max-w-6xl bg-white 
          min-h-screen md:min-h-[550px] 
          md:rounded-[3.5rem] md:shadow-[0_30px_100px_rgba(15,23,42,0.12)] 
          overflow-hidden flex flex-col md:flex-row 
          transition-all duration-1000 ease-out transform
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 md:translate-y-16'}
        `}
      >
        
        {/* --- LEFT SIDE: Desktop Only (PC) --- */}
        <div className="hidden md:flex relative w-[45%] bg-[#0F172A] flex-col justify-between p-16 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl text-[12px] font-semibold tracking-[0.25em] text-amber-400 uppercase mb-14">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Internal Web
            </div>
            
            <h1 className="text-6xl lg:text-7xl font-bold text-white leading-[0.9] tracking-tighter mb-10">
              TRAFFY<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-[#C4A484] to-amber-100">
                FONDUE
              </span>
            </h1>
            
            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-xs border-l-[4px] border-slate-700 pl-6">
              ระบบบริหารจัดการข้อมูลภายใน<br/>
              สำหรับเจ้าหน้าที่และผู้ดูแลระบบ
            </p>
          </div>
        </div>

        {/* ========================================= */}
        {/* === MOBILE HEADER: ดีไซน์ใหม่ (โค้งมน) === */}
        {/* ========================================= */}
        <div className="md:hidden w-full h-[45vh] bg-[#0F172A] relative flex flex-col items-center justify-center px-6 overflow-hidden shrink-0 rounded-b-[3rem] shadow-xl z-10">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1E293B] to-[#0F172A]"></div>
            
            {/* Spotlight Effect (แสงส่องจากมุมขวาบน) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.07]" 
                 style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>
            
            <div className="relative z-10 flex flex-col items-center pb-8">
                
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase drop-shadow-2xl">
                    Login
                </h1><br></br>
                <div className="inline-block px-4 py-1.5 mb-3 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm">
                <span className="text-[11px] text-amber-400 tracking-[0.2em] uppercase font-bold">
                  Internal Web
                </span>
              </div>
            </div>
        </div>

        {/* --- RIGHT SIDE / LOGIN AREA --- */}
        <div className="relative w-full md:w-[55%] bg-white flex flex-col items-center flex-grow">
          
          {/* Logo Container (Floating with Shadow) */}
          <div className="relative md:mt-16 -mt-16 z-20">
              <div className="w-28 h-28 md:w-36 md:h-36 bg-[#724829] rounded-[2rem] md:rounded-[2.5rem] p-1 shadow-[0_20px_50px_rgba(116,68,40,0.25)] border-[6px] md:border-[8px] border-white flex items-center justify-center transform hover:rotate-2 transition-transform duration-500 ring-1 ring-slate-100">
                  <div className="w-full h-full bg-[#724829] rounded-[1.5rem] flex items-center justify-center p-0 border border-white/10">
                      <img 
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQy1-fxSLVOtHD1tWWgQ9B27x90x3p_ZO06cg&s" 
                      alt="Traffy Fondue Logo" 
                      className="w-full h-full object-contain "
                      />
                  </div>
              </div>
          </div>

          {/* Content Container */}
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center px-8 mt-2 md:mt-8 pb-32 md:pb-0 justify-center">
            
            {/* Greeting Header */}
            <div className="text-center mb-8 md:mb-10 w-full flex flex-col items-center">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">Welcome Back</h2>
              
              {/* --- Secure Badge (Unified) --- */}
              <div className="flex flex-col items-center gap-3 mt-1">
               
                <p className="text-slate-500 text-sm font-light">
                    ระบบบริหารจัดการข้อมูลสำหรับเจ้าหน้าที่
                </p>
              </div>
            </div>

            {/* Google Login Action */}
            <div className="w-full space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-500 text-xs py-3 px-4 rounded-xl border border-red-100 flex items-center gap-2 animate-bounce">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {errorMsg}
                </div>
              )}

              <button 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="bg-white text-slate-700 border border-slate-200 w-full flex items-center justify-center gap-3 py-3.5 rounded-xl hover:bg-slate-50 hover:border-[#8B5E3C]/30 transition-all font-medium shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md h-12 md:h-14 active:scale-95 group relative overflow-hidden"
              >
                {isLoading ? (
                   <div className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-slate-300 border-t-[#8B5E3C] rounded-full animate-spin"></span>
                      <span className="text-slate-500 text-sm">กำลังเชื่อมต่อ...</span>
                   </div>
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                    <span className="text-sm md:text-base font-medium text-slate-600 group-hover:text-[#8B5E3C] transition-colors">Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}