'use client';

import React, { useState } from "react";
import Sidebar from "../components/sidebar";
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  User,
  Lock,
  Mail,
  RefreshCw
} from "lucide-react";

const SuccessModal = ({ show, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">ดำเนินการสำเร็จ</h3>
        <p className="text-slate-500 font-medium mb-6">ปลดล็อกระบบ OTP เรียบร้อยแล้ว</p>
        <button 
          onClick={onClose}
          className="w-full py-3.5 bg-[#0F172A] text-white rounded-xl font-bold hover:bg-black transition-all active:scale-[0.98]"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
};

export default function ResetOtpPage() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) setPhoneNumber(value);
  };

  const handleCheckStatus = (e) => {
    e.preventDefault();
    if (phoneNumber.length < 10) return;
    setIsChecking(true);
    setTimeout(() => {
      setUserInfo({ 
        name: "Piti Rat", 
        email: "piti.rat3@example.com",
        phone: phoneNumber,
        isLocked: true 
      });
      setIsChecking(false);
    }, 800);
  };

  const handleBack = () => {
    setUserInfo(null);
    setPhoneNumber("");
  };

  const handleResetOtp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true);
      setUserInfo(null);
      setPhoneNumber("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      <main className={`transition-all duration-300 ${isDesktopSidebarOpen ? 'pl-64' : 'pl-20'} min-h-screen flex flex-col items-center justify-center p-6 space-y-6`}>
        
        {!userInfo && (
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-[0_25px_60px_rgba(0,0,0,0.1)] border border-slate-100 text-center">
            <h1 className="text-2xl font-black text-slate-900 mb-2">Reset OTP Lock</h1>
            <p className="text-slate-400 text-sm font-medium mb-8">กรอกเบอร์โทรศัพท์เพื่อค้นหาผู้ใช้งาน</p>
            
            <form onSubmit={handleCheckStatus} className="space-y-6 flex flex-col items-center">
              <div className="w-full max-w-sm text-left">
                <label className="input validator w-full h-16 bg-slate-50 border-slate-200 rounded-2xl flex items-center px-4 gap-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-inner">
                  <svg className="h-[1.5em] opacity-50 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <g fill="none">
                      <path
                        d="M7.25 11.5C6.83579 11.5 6.5 11.8358 6.5 12.25C6.5 12.6642 6.83579 13 7.25 13H8.75C9.16421 13 9.5 12.6642 9.5 12.25C9.5 11.8358 9.16421 11.5 8.75 11.5H7.25Z"
                        fill="currentColor"
                      ></path>
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6 1C4.61929 1 3.5 2.11929 3.5 3.5V12.5C3.5 13.8807 4.61929 15 6 15H10C11.3807 15 12.5 13.8807 12.5 12.5V3.5C12.5 2.11929 11.3807 1 10 1H6ZM10 2.5H9.5V3C9.5 3.27614 9.27614 3.5 9 3.5H7C6.72386 3.5 6.5 3.27614 6.5 3V2.5H6C5.44771 2.5 5 2.94772 5 3.5V12.5C5 13.0523 5.44772 13.5 6 13.5H10C10.5523 13.5 11 13.0523 11 12.5V3.5C11 2.94772 10.5523 2.5 10 2.5Z"
                        fill="currentColor"
                      ></path>
                    </g>
                  </svg>
                  <input
                    type="tel"
                    className="tabular-nums grow text-xl font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                    required
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    pattern="[0-9]*"
                    minLength={10}
                    maxLength={10}
                    title="Must be 10 digits"
                  />
                </label>
                <p className="validator-hint mt-2 text-xs font-medium text-slate-400 px-1">Must be 10 digits</p>
              </div>

              <button 
                type="submit"
                disabled={phoneNumber.length < 10 || isChecking}
                className="w-full max-w-sm h-14 bg-[#0F172A] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-20 shadow-lg"
              >
                {isChecking ? <Loader2 className="animate-spin" /> : "ตรวจสอบข้อมูล"}
              </button>
            </form>
          </div>
        )}

        {userInfo && (
          <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white ring-1 ring-slate-100 relative animate-in fade-in zoom-in-95 duration-300">
            
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <User size={40} className="text-indigo-400" />
                </div>
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white rounded-full"></div>
              </div>
              <h2 className="text-2xl font-black text-[#0F172A] mb-1">{userInfo.name}</h2>
              <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200 shadow-sm">
                <ShieldCheck size={12} className="text-slate-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin</span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 p-5 bg-slate-50/80 rounded-[1.25rem] shadow-sm border border-white">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <svg className="h-[1.2em] text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <g fill="none">
                      <path d="M7.25 11.5C6.83579 11.5 6.5 11.8358 6.5 12.25C6.5 12.6642 6.83579 13 7.25 13H8.75C9.16421 13 9.5 12.6642 9.5 12.25C9.5 11.8358 9.16421 11.5 8.75 11.5H7.25Z" fill="currentColor"></path>
                      <path fillRule="evenodd" clipRule="evenodd" d="M6 1C4.61929 1 3.5 2.11929 3.5 3.5V12.5C3.5 13.8807 4.61929 15 6 15H10C11.3807 15 12.5 13.8807 12.5 12.5V3.5C12.5 2.11929 11.3807 1 10 1H6ZM10 2.5H9.5V3C9.5 3.27614 9.27614 3.5 9 3.5H7C6.72386 3.5 6.5 3.27614 6.5 3V2.5H6C5.44771 2.5 5 2.94772 5 3.5V12.5C5 13.0523 5.44772 13.5 6 13.5H10C10.5523 13.5 11 13.0523 11 12.5V3.5C11 2.94772 10.5523 2.5 10 2.5Z" fill="currentColor"></path>
                    </g>
                  </svg>
                </div>
                <span className="font-bold text-[#1E293B]">{userInfo.phone}</span>
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50/80 rounded-[1.25rem] shadow-sm border border-white">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <span className="font-bold text-[#1E293B] text-sm">{userInfo.email}</span>
              </div>

              <div className="flex items-center justify-between p-5 bg-white rounded-[1.25rem] border border-dashed border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-red-50 rounded-xl">
                    <Lock size={18} className="text-red-500" />
                  </div>
                  <span className="font-bold text-[#1E293B] text-sm">สถานะ OTP</span>
                </div>
                {userInfo.isLocked ? (
                  <span className="text-[10px] font-black bg-red-50 text-red-600 px-4 py-1.5 rounded-lg border border-red-100 uppercase tracking-tighter">LOCKED</span>
                ) : (
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-tighter">NORMAL</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleResetOtp} 
                disabled={isLoading || !userInfo.isLocked}
                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-lg shadow-[0_10px_25px_rgba(220,38,38,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "ดำเนินการ Reset OTP"}
              </button>
              
              <button 
                onClick={handleBack}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 group"
              >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
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