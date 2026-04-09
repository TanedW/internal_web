'use client';

import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Search,
  User,
  Lock,
  Mail,
  RefreshCw,
  AlertCircle
} from "lucide-react";

const SuccessModal = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-[90%] md:max-w-sm w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">ดำเนินการสำเร็จ</h3>
        <p className="text-slate-500 text-sm md:text-base font-medium mb-6">ปลดล็อกระบบ OTP เรียบร้อยแล้ว</p>
        <button 
          onClick={onClose}
          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-[0.98]"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
};

const getCookie = (name) => {
  if (typeof document === "undefined") return null; // ป้องกัน Error กรณี SSR
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export default function ResetOtpPage() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [error, setError] = useState("");

  // ดึง API URL จาก .env
    const SEARCH_API = process.env.NEXT_PUBLIC_SEARCH_OTP_STATUS_API_URL;
    const RESET_API = process.env.NEXT_PUBLIC_RESET_OTP_STATUS_API_URL;
  
    // --- 1. ดึง Admin ID จาก LocalStorage เมื่อหน้าเว็บโหลด ---
   useEffect(() => {
      // สมมติว่า cookie ชื่อ 'admin_id'
      const idFromCookie = getCookie('admin_id'); 
      
      if (idFromCookie) {
        setAdminId(idFromCookie);
        console.log("Admin ID loaded from cookie:", idFromCookie);
      } else {
        console.warn("No admin_id found in cookies");
      }
    }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setPhoneNumber(value);
  };

const handleCheckStatus = async (e) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;
    
    setIsChecking(true);
    setError("");
    
    try {
      const response = await fetch(`${SEARCH_API}?key=${phoneNumber}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setUserInfo({
          name: `${result.data.first_name} ${result.data.last_name}`,
          email: result.data.email,
          phone: result.data.phone,
          profileImage: result.data.document_url,
          isLocked: result.data.status === 'locked',
          counter_sent: result.data.counter_sent,
          counter_fail: result.data.counter_consecutive_fail
        });
      } else {
        setError(result.message || "ไม่พบข้อมูลผู้ใช้งานเบอร์นี้");
        setUserInfo(null);
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับ API ค้นหาได้");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResetOtp = async () => {
    if (!adminId) {
      alert("ไม่พบรหัสผู้ดูแลระบบ กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(RESET_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: phoneNumber,
          current_admin_id: adminId // ใช้ค่าจาก State ที่ดึงมาจาก LocalStorage
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowSuccessModal(true);
        // อัปเดตสถานะใน UI ทันทีโดยไม่ต้องโหลดใหม่ และไม่ล้างข้อมูลผู้ใช้ทิ้ง
        setUserInfo(prev => prev ? {
          ...prev,
          isLocked: false,
          counter_fail: 0
        } : null);
      } else {
        alert(result.message || "การรีเซ็ตล้มเหลว");
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อกับ API รีเซ็ตได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setUserInfo(null);
    setPhoneNumber("");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans overflow-x-hidden">
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      <main className={`transition-all duration-300 ${isDesktopSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'} min-h-screen flex flex-col items-center justify-center py-20 px-4 md:px-8 space-y-6`}>
        
        {!userInfo && (
          <div className="w-full max-w-lg bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.1)] border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 mb-2">Reset OTP Lock</h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium mb-8">กรอกเบอร์โทรศัพท์เพื่อค้นหาผู้ใช้งาน</p>
            
            <form onSubmit={handleCheckStatus} className="space-y-6 w-full flex flex-col items-center">
              <div className="w-full max-w-sm text-left">
                <label className="input validator w-full h-14 md:h-16 bg-slate-50 border-slate-200 rounded-xl md:rounded-2xl flex items-center px-4 gap-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-inner">
                  <svg className="h-[1.2em] md:h-[1.5em] opacity-50 text-slate-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <g fill="none">
                      <path d="M7.25 11.5C6.83579 11.5 6.5 11.8358 6.5 12.25C6.5 12.6642 6.83579 13 7.25 13H8.75C9.16421 13 9.5 12.6642 9.5 12.25C9.5 11.8358 9.16421 11.5 8.75 11.5H7.25Z" fill="currentColor"></path>
                      <path fillRule="evenodd" clipRule="evenodd" d="M6 1C4.61929 1 3.5 2.11929 3.5 3.5V12.5C3.5 13.8807 4.61929 15 6 15H10C11.3807 15 12.5 13.8807 12.5 12.5V3.5C12.5 2.11929 11.3807 1 10 1H6ZM10 2.5H9.5V3C9.5 3.27614 9.27614 3.5 9 3.5H7C6.72386 3.5 6.5 3.27614 6.5 3V2.5H6C5.44771 2.5 5 2.94772 5 3.5V12.5C5 13.0523 5.44772 13.5 6 13.5H10C10.5523 13.5 11 13.0523 11 12.5V3.5C11 2.94772 10.5523 2.5 10 2.5Z" fill="currentColor"></path>
                    </g>
                  </svg>
                  <input
                    type="tel"
                    className="tabular-nums grow text-lg md:text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none bg-transparent"
                    required
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    pattern="[0-9]*"
                    minLength={10}
                    maxLength={10}
                  />
                </label>
                <p className="validator-hint mt-2 text-[10px] md:text-xs font-medium text-slate-400 px-1 italic">Must be 10 digits</p>
                {error && (
                  <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} /> {error}
                  </p>
                )}
              </div>

              <button 
                type="submit"
                disabled={phoneNumber.length < 10 || isChecking}
                className="w-full max-w-sm h-12 md:h-14 bg-[#0F172A] text-white rounded-xl md:rounded-2xl font-bold text-base flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-20 shadow-lg"
              >
                {isChecking ? <Loader2 className="animate-spin" /> : <><Search size={20} /> ตรวจสอบข้อมูล</>}
              </button>
            </form>
          </div>
        )}

      {userInfo && (
          <div className="w-full max-w-md bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white ring-1 ring-slate-100 relative animate-in fade-in zoom-in-95 duration-300">
            {/* User Profile Header */}
           {/* ส่วนหัวของโปรไฟล์ผู้ใช้ */}
<div className="flex flex-col items-center mb-6 md:mb-8 text-center">
  <div className="relative mb-4">
    
    {/* 1. เพิ่ม overflow-hidden เพื่อตัดรูปที่เกินขอบวงกลมให้หายไป */}
    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
      
      {userInfo.profileImage ? (
        <img 
          src={userInfo.profileImage} 
          alt="Profile" 
          /* 2.ใช้ object-cover เพื่อให้รูปขยายเต็มวงกลมโดยที่สัดส่วนไม่เพี้ยน */
          className="w-full h-full object-cover" 
          onError={(e) => {
            // กรณีรูปโหลดไม่ได้ (เช่น URL หมดอายุ) ให้กลับไปใช้ไอคอนสำรอง
            e.target.style.display = 'none';
          }}
        />
      ) : (
        /* Fallback กรณีไม่มีรูปในฐานข้อมูล */
        <User size={40} className="text-indigo-400" />
      )}
    </div>

    {/* จุดแสดงสถานะ Locked/Normal */}
    <div className={`absolute bottom-1 right-1 w-4 h-4 md:w-5 md:h-5 ${userInfo.isLocked ? 'bg-red-500' : 'bg-emerald-500'} border-[2px] md:border-[3px] border-white rounded-full`}></div>
  </div>

  <h2 className="text-xl md:text-2xl font-black text-[#0F172A] mb-1 leading-tight">{userInfo.name}</h2>
  <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200">
    <ShieldCheck size={12} className="text-slate-500" />
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Traffy Fondue User</span>
  </div>
</div>

            {/* User Details */}
            <div className="space-y-3 md:space-y-4 mb-8 md:mb-10 text-left">
              <div className="flex items-center gap-4 p-4 md:p-5 bg-slate-50/80 rounded-xl md:rounded-[1.25rem] shadow-sm border border-white">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                  <RefreshCw size={18} className="text-slate-400" />
                </div>
                <span className="font-bold text-sm md:text-base text-[#1E293B] truncate">{userInfo.phone}</span>
              </div>

              <div className="flex items-center gap-4 p-4 md:p-5 bg-slate-50/80 rounded-xl md:rounded-[1.25rem] shadow-sm border border-white">
                <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <span className="font-bold text-[#1E293B] text-xs md:text-sm truncate">{userInfo.email}</span>
              </div>

              <div className="flex items-center justify-between p-4 md:p-5 bg-white rounded-xl md:rounded-[1.25rem] border border-dashed border-slate-200 shadow-sm gap-2">
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                  <div className={`p-2 md:p-2.5 ${userInfo.isLocked ? 'bg-red-50' : 'bg-emerald-50'} rounded-xl`}>
                    <Lock size={18} className={userInfo.isLocked ? 'text-red-500' : 'text-emerald-500'} />
                  </div>
                  <div>
                    <span className="font-bold text-[#1E293B] text-xs md:text-sm block">สถานะ OTP</span>
                    <span className="text-[10px] text-slate-400 font-medium">ผิดพลาด {userInfo.counter_fail} ครั้ง</span>
                  </div>
                </div>
                {userInfo.isLocked ? (
                  <span className="text-[9px] md:text-[10px] font-black bg-red-50 text-red-600 px-2.5 md:px-4 py-1.5 rounded-lg border border-red-100 uppercase whitespace-nowrap">LOCKED</span>
                ) : (
                  <span className="text-[9px] md:text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 md:px-4 py-1.5 rounded-lg border border-emerald-100 uppercase whitespace-nowrap">NORMAL</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button 
                onClick={handleResetOtp} 
                disabled={isLoading || !userInfo.isLocked}
                className="w-full h-12 md:h-14 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-base md:text-lg shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "ดำเนินการ Reset OTP"}
              </button>
              
              <button 
                onClick={handleBack}
                className="w-full py-2 text-[10px] md:text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 group"
              >
                <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                ค้นหาเบอร์อื่น
              </button>
            </div>
          </div>
        )}
      </main>

      <SuccessModal show={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
}