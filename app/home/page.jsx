"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Sidebar, { SIDEBAR_MENUS } from "../components/sidebar"; 
import { 
  ArrowRight, LayoutDashboard, ShieldCheck, LogOut 
} from "lucide-react";

export default function HomePage() {
  const [currentRoles, setCurrentRoles] = useState([]);
  const [userName, setUserName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const getCurrentAdminId = useCallback(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  }, []);

  const syncUserRoles = useCallback(async () => {
    const currentAdminId = getCurrentAdminId();
    const sessionData = sessionStorage.getItem("active_sidebar_data");
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        setCurrentRoles(parsed.roles || []);
        setUserName(parsed.name || "Admin");
      } catch (e) {
        console.error("Session parse error", e);
      }
    }

    if (currentAdminId && API_URL) {
      try {
        const res = await fetch(`${API_URL}?requester_id=${currentAdminId}`);
        if (res.ok) {
          const jsonResponse = await res.json();
          const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);
          const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
          if (myProfile) {
            const updatedRoles = Array.isArray(myProfile.roles) ? myProfile.roles : (myProfile.role ? [myProfile.role] : []);
            setCurrentRoles(updatedRoles);
            const newName = myProfile.email ? myProfile.email.split('@')[0] : "Admin";
            setUserName(newName);
            const updatedSession = { ...(sessionData ? JSON.parse(sessionData) : {}), roles: updatedRoles, name: newName };
            sessionStorage.setItem("active_sidebar_data", JSON.stringify(updatedSession));
          }
        }
      } catch (error) {
        console.error("Failed to sync roles:", error);
      }
    }
    setIsLoading(false);
  }, [API_URL, getCurrentAdminId]);

  useEffect(() => {
    setIsMounted(true);
    syncUserRoles();
    window.addEventListener("focus", syncUserRoles);
    window.addEventListener("storage", syncUserRoles);
    return () => {
      window.removeEventListener("focus", syncUserRoles);
      window.removeEventListener("storage", syncUserRoles);
    };
  }, [syncUserRoles]);

  const handleLogout = () => {
    const confirmLogout = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (confirmLogout) {
      sessionStorage.clear();
      localStorage.removeItem("current_admin_id");
      window.location.href = "/";
    }
  };

  const accessibleMenus = useMemo(() => {
    if (!isMounted) return [];
    return SIDEBAR_MENUS.filter(menu => {
      if (menu.href === "/home") return false;
      if (menu.roles.includes("all")) return true; 
      return currentRoles.some(r => menu.roles.includes(r));
    });
  }, [isMounted, currentRoles]);

  const getMenuStyles = (href) => {
    const path = href.toLowerCase();
    if (path.includes("manage") || path.includes("email")) return { color: "from-purple-500 to-purple-600", text: "text-purple-600" };
    if (path.includes("case") || path.includes("org") || path.includes("search")) return { color: "from-emerald-500 to-emerald-600", text: "text-emerald-600" };
    if (path.includes("otp") || path.includes("shield") || path.includes("stats")) return { color: "from-amber-500 to-orange-600", text: "text-orange-600" };
    return { color: "from-sky-500 to-sky-600", text: "text-sky-600" };
  };

  if (!isMounted) return <div className="min-h-screen bg-[#FDFDFD]" />;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-900 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        
        <div className="flex items-center justify-between mb-16 animate-in fade-in duration-700">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-white border border-slate-100 shadow-sm rounded-xl sm:rounded-2xl text-indigo-600 flex-shrink-0">
              <LayoutDashboard size={24} />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">Administration</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 leading-tight">Control Center</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 p-1.5 bg-white border border-slate-100 shadow-sm rounded-[1.5rem]">
              <div className="flex items-center gap-3 pl-3 pr-4 py-1.5 bg-slate-50/50 rounded-[1.25rem]">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                    <ShieldCheck size={10} /> {isLoading ? "Syncing..." : "Verified"}
                  </span>
                  <span className="text-sm font-black text-slate-800">{userName || "Admin"}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-3 sm:p-4 bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-full sm:rounded-2xl transition-all duration-300 shadow-sm group active:scale-95 flex-shrink-0"
              title="ออกจากระบบ"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>

        <header className="mb-16 animate-in fade-in slide-in-from-left-4 duration-700">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1]">
            สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">{userName || "ผู้ดูแลระบบ"}</span> ✨
          </h1>
          <p className="text-slate-500 font-medium text-lg lg:text-xl leading-relaxed">
            ระบบตรวจสอบสิทธิ์เรียบร้อยแล้ว กรุณาเลือกเครื่องมือจัดการระบบด้านล่างนี้
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {accessibleMenus.map((menu, index) => {
            const style = getMenuStyles(menu.href);
            return (
              <Link 
                key={menu.href} 
                href={menu.href}
                className="group relative bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-slate-50 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* ดึงไอคอนมาใช้ และขยายขนาดเล็กน้อยสำหรับหน้า Home */}
                <div className={`relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${style.color} text-white flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {React.cloneElement(menu.icon, { size: 28 })}
                </div>
                <div className="relative">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {menu.title}
                  </h3>
                  <p className="text-slate-400 text-[15px] leading-relaxed mb-10 min-h-[3rem] font-medium">
                    เข้าจัดการส่วนงาน {menu.title} ตามสิทธิ์ของผู้ดูแลระบบ
                  </p>
                </div>
                <div className="relative mt-auto pt-6 flex items-center justify-between border-t border-slate-50">
                  <div className={`flex items-center gap-2 font-black text-[11px] uppercase tracking-widest ${style.text}`}>
                    Explore Tool <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}