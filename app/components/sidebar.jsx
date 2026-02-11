"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  Mail,
  Briefcase,
  LayoutGrid,
  Users,
  X,
  LogOut,
  Menu,
  MessageSquareCode,
  Search,
} from "lucide-react";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// const prefetchData = async (url) => {
//   if (!url) return;
//   try {
//     // ยิง fetch ทิ้งไว้เพื่อให้ Vercel Edge Cache (HIT) และ Browser จำค่าไว้
//     // credentials: 'omit' สำคัญมากเพื่อให้ตรงกับที่ Middleware และ API คาดหวัง
//     await fetch(url, { credentials: 'omit' });
//   } catch (e) {
//     // เงียบไว้ถ้าโหลดไม่สำเร็จ ไม่ให้กวนหน้าจอผู้ใช้
//   }
// };


export default function Sidebar({
  isDesktopSidebarOpen,
  setIsDesktopSidebarOpen,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // --- ฟังก์ชันสำหรับแอบโหลดข้อมูล (Prefetch) ---
  const prefetchData = async (url) => {
    if (!url) return;
    try {
      // ใช้ credentials: 'omit' เพื่อให้ Edge Cache ทำงาน (HIT)
      await fetch(url, { credentials: 'include' });
    } catch (e) {
      console.warn("Prefetch failed:", e);
    }
  };

  const handleMouseEnter = (path) => {
    const email = localStorage.getItem("user_email");
    const adminId = localStorage.getItem("current_admin_id")?.replace(/^"|"$/g, "");
    
    // 1. Prefetch Roles เสมอ
    if (email) {
      prefetchData(`/api/GetUserRoles?email=${email}`);
    }

    // 2. ถ้าชี้ที่เมนูจัดการ ORG ให้แอบโหลด AdminList รอเลย (เพราะหน้านี้โหลดนาน)
    const targetPaths = [
      "/manage-org", 
      "/manage-case", 
      "/manage-flex-message",
      "/manage-richmenu",
      "/search-org"
    ];

    if (targetPaths.includes(path) && adminId && API_URL_ADMIN) {
      prefetchData(`${API_URL_ADMIN}?requester_id=${adminId}`);
    }
  };

  const getAvatarUrl = (seed) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "Admin")}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // ต้องใส่ await เพื่อให้รอดึง Profile และ Roles ให้เสร็จก่อน
        await fetchAdminProfile(); 
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
    useEffect(() => {
  // เลือกปิดเฉพาะกรณีที่เป็น Mobile หรือถ้าต้องการให้ Desktop ปิดด้วยตามโจทย์
  const handleNavigation = () => {
    setIsDesktopSidebarOpen(false);
    setIsMobileMenuOpen(false);
  };

  handleNavigation();
}, [pathname]);

  const fetchAdminProfile = async () => {
    const adminId = localStorage.getItem("current_admin_id")?.replace(/^"|"$/g, "");
    if (!adminId || !API_URL_ADMIN) {
      setIsLoading(false);
      return;
    }
    try {
const res = await fetch(`${API_URL_ADMIN}?requester_id=${adminId}`, {
  credentials: 'include' // เพื่อให้ Browser ส่ง HttpOnly Cookie ไปด้วย
});      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];
      const myProfile = data.find((u) => String(u.admin_id) === String(adminId));
      if (myProfile) {
        setAdminData(myProfile);
        setCurrentRoles(Array.isArray(myProfile.roles) ? myProfile.roles : [myProfile.role || "guest"]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      // ปิดการโหลดที่นี่เพื่อให้ทุกอย่างแสดงพร้อมกัน
      setIsLoading(false); 
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      const deleteCookie = (name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      };
      deleteCookie("access_token");
      deleteCookie("user_email");
      deleteCookie("user_role");
      localStorage.clear(); 
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const hasAccess = (roles) => currentRoles.some((r) => roles.includes(r));

  const getMenuClass = (path) => {
    const isActive = pathname === path;
    return `flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-[#111827] !text-white shadow-lg scale-[1.02]"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
      {currentRoles.length > 0 ? (
        <>
          {isSidebarRolesExpanded ? (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 w-full items-center">
              {currentRoles.map((role, idx) => (
                <span 
                  key={idx} 
                  className="text-[9px] font-bold !text-[#4F46E5] uppercase tracking-wider !bg-[#E0E7FF] px-2.5 py-1 rounded-full border border-indigo-100 truncate max-w-[160px]"
                >
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
              <button 
                onClick={() => setIsSidebarRolesExpanded(false)} 
                className="btn btn-xs h-6 min-h-0 !bg-[#F1F5F9] !border-none !text-[#475569] hover:!bg-slate-200 rounded-full px-3 text-[8px] font-bold uppercase mt-1 shadow-none"
              >
                Show less
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 w-full">
              <span 
                className="text-[9px] font-bold !text-[#4F46E5] uppercase tracking-wider !bg-[#E0E7FF] px-2.5 py-1 rounded-full border border-indigo-100 shadow-sm truncate max-w-[120px]"
              >
                {currentRoles[0].replace(/_/g, ' ')}
              </span>
              {currentRoles.length > 1 && (
                <button 
                  onClick={() => setIsSidebarRolesExpanded(true)} 
                  className="btn btn-xs h-6 min-h-0 !bg-[#F0F7FF] !border-none !text-[#4F46E5] hover:!bg-[#E0F0FF] rounded-full px-3 text-[9px] font-bold lowercase whitespace-nowrap shadow-none"
                >
                  +{currentRoles.length - 1} more
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Guest</span>
      )}
    </div>
  );

  const SidebarHeader = () => (
    <div className="flex flex-col items-center text-center mb-8 mt-2">
      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
        <img
          src={adminData?.profile_url || user?.photoURL || getAvatarUrl("Admin")}
          alt="User Profile"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = getAvatarUrl("Admin"); }}
        />
      </div><br></br>
      <h2 className="text-sm font-bold mt-4 px-2 break-words w-full" style={{ color: '#1e293b' }}>
        {adminData?.name || user?.displayName || "Admin User"}
      </h2>
      <SidebarRoleDisplay />
    </div>
  );

  const SidebarSkeleton = () => (
  <div className="flex flex-col items-center w-full animate-pulse">
    {/* วงกลมรูปโปรไฟล์ */}
    <div className="w-24 h-24 rounded-full bg-slate-200 mb-8"></div>
    {/* แถบชื่อ */}
    <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
    {/* แถบ Role */}
    <div className="h-6 w-24 bg-slate-100 rounded-full mb-10"></div>
    {/* แถบเมนูจำลอง */}
    <div className="w-full space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 w-full bg-slate-50 rounded-xl"></div>
      ))}
    </div>
  </div>
);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .force-light { background-color: #ffffff !important; color: #1e293b !important; }
      `}} />

      {/* MOBILE NAVBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 force-light z-40 px-5 flex items-center border-b border-slate-100 shadow-sm">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 !bg-white !text-black rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:bg-slate-50 transition-all !border-none"
        >
          <Menu className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <span className="ml-4 font-bold text-slate-800 text-sm">Admin Portal</span>
      </div>

{/* MOBILE SIDEBAR DRAW */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[280px] h-full force-light shadow-2xl flex flex-col p-8 rounded-r-[2rem] animate-in slide-in-from-left duration-300 overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-1.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100"
            >
              <X size={18} style={{ color: '#000000' }} strokeWidth={3} />
            </button>

            {isLoading ? (
              /* 1. แสดง Skeleton ตอนรอโหลดใน Mobile */
              <div className="mt-8">
                <SidebarSkeleton />
              </div>
            ) : (
              /* 2. แสดงข้อมูลจริงเมื่อโหลดเสร็จ */
              <div className="flex flex-col h-full animate-in fade-in duration-500">
                <SidebarHeader />
                <nav className="flex flex-col gap-1.5 flex-1 mt-6 overflow-y-auto no-scrollbar">
                  <Link
                    href="/manage"
                    className={getMenuClass("/manage")}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onMouseEnter={() => handleMouseEnter("/manage")}
                  >
                    <Mail size={20} />
                    <span className="text-[15px] font-bold">จัดการ Email</span>
                  </Link>

                  {hasAccess(["admin", "editor", "editor_manage_case"]) && (
                    <Link
                      href="/manage-case"
                      className={getMenuClass("/manage-case")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => handleMouseEnter("/manage-case")}
                    >
                      <Briefcase size={20} />
                      <span className="text-[15px] font-bold">จัดการ Case</span>
                    </Link>
                  )}

                  {hasAccess(["admin", "editor", "editor_manage_menu"]) && (
                    <Link
                      href="/manage-richmenu"
                      className={getMenuClass("/manage-richmenu")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => handleMouseEnter("/manage-richmenu")}
                    >
                      <LayoutGrid size={20} />
                      <span className="text-[15px] font-bold">จัดการ Menu</span>
                    </Link>
                  )}

                  {hasAccess(["admin", "editor", "editor_manage_org_info", "editor_manage_org"]) && (
                    <Link
                      href="/manage-org"
                      className={getMenuClass("/manage-org")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => handleMouseEnter("/manage-org")}
                    >
                      <Users size={20} />
                      <span className="text-[15px] font-bold">จัดการ ORG</span>
                    </Link>
                  )}

                  {hasAccess(["admin", "editor", "editor_manage_flex"]) && (
                    <Link
                      href="/manage-flex-message"
                      className={getMenuClass("/manage-flex-message")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => handleMouseEnter("/manage-flex-message")}
                    >
                      <MessageSquareCode size={20} />
                      <span className="text-[15px] font-bold">จัดการ Flex Message</span>
                    </Link>
                  )}

                  {hasAccess(["admin", "editor", "editor_search_duplicate_org"]) && (
                    <Link
                      href="/search-org"
                      className={getMenuClass("/search-org")}
                      onClick={() => setIsMobileMenuOpen(false)}
                      onMouseEnter={() => handleMouseEnter("/search-org")}
                    >
                      <Search size={20} />
                      <span className="text-[15px] font-bold">ค้นหาหน่วยงานซ้ำ</span>
                    </Link>
                  )}
                </nav>
                
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                    <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                      <LogOut size={20} className="text-red-500" />
                    </div>
                    <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
  className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 force-light rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-10 px-8 z-50 transition-all duration-300 ease-in-out overflow-y-auto no-scrollbar ${isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"}`}
>
  {/* ปุ่มกากบาท (X) ให้แสดงตลอดเพื่อให้ User ปิด Sidebar ได้แม้ยังโหลดไม่เสร็จ */}
  <button
    onClick={() => setIsDesktopSidebarOpen(false)}
    className="absolute top-8 right-8 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
  >
    <X size={20} style={{ color: '#000000' }} strokeWidth={3} />
  </button>

  {isLoading ? (
    /* 1. แสดง Skeleton ตอนรอโหลด */
    <SidebarSkeleton />
  ) : (
    /* 2. แสดงข้อมูลจริงเมื่อ isLoading เป็น false เท่านั้น */
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <SidebarHeader />

      <nav className="flex flex-col gap-1.5 flex-1 mt-4 overflow-y-auto no-scrollbar">
        <Link href="/manage" className={getMenuClass("/manage")} onMouseEnter={() => handleMouseEnter("/manage")}>
          <Mail size={20} />
          <span className="font-bold text-[15px]">จัดการ Email</span>
        </Link>

        {hasAccess(["admin", "editor", "editor_manage_case"]) && (
          <Link href="/manage-case" className={getMenuClass("/manage-case")} onMouseEnter={() => handleMouseEnter("/manage-case")}>
            <Briefcase size={20} />
            <span className="font-bold text-[15px]">จัดการ Case</span>
          </Link>
        )}

        {hasAccess(["admin", "editor", "editor_manage_menu"]) && (
          <Link href="/manage-richmenu" className={getMenuClass("/manage-richmenu")} onMouseEnter={() => handleMouseEnter("/manage-richmenu")}>
            <LayoutGrid size={20} />
            <span className="font-bold text-[15px]">จัดการ Menu</span>
          </Link>
        )}

        {hasAccess(["admin", "editor", "editor_manage_org", "editor_manage_org_info"]) && (
          <Link href="/manage-org" className={getMenuClass("/manage-org")} onMouseEnter={() => handleMouseEnter("/manage-org")}>
            <Users size={20} />
            <span className="font-bold text-[15px]">จัดการ ORG</span>
          </Link>
        )}

        {hasAccess(["admin", "editor", "editor_manage_flex"]) && (
          <Link href="/manage-flex-message" className={getMenuClass("/manage-flex-message")} onMouseEnter={() => handleMouseEnter("/manage-flex-message")}>
            <MessageSquareCode size={20} />
            <span className="font-bold text-[15px]">จัดการ Flex Message</span>
          </Link>
        )}

        {hasAccess(["admin", "editor", "editor_search_duplicate_org"]) && (
          <Link href="/search-org" className={getMenuClass("/search-org")} onMouseEnter={() => handleMouseEnter("/search-org")}>
            <Search size={20} />
            <span className="font-bold text-[15px]">ค้นหาหน่วยงานซ้ำ</span>
          </Link>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
          <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
            <LogOut size={20} className="text-red-500" />
          </div>
          <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
        </button>
      </div>
    </div>
  )}
</aside>

      {!isDesktopSidebarOpen && (
        <div className="hidden lg:block fixed top-8 left-8 z-30">
          <button
            onClick={() => setIsDesktopSidebarOpen(true)}
            className="btn btn-square !bg-white !border-none shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] !text-black hover:bg-slate-50 transition-all duration-300 rounded-xl"
          >
            <Menu className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}