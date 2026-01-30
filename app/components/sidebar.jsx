'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { Mail, Briefcase, LayoutGrid, Users, X, LogOut, Menu, MessageSquareCode } from "lucide-react";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export default function Sidebar({ isDesktopSidebarOpen, setIsDesktopSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null); 
  const [currentRoles, setCurrentRoles] = useState([]);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);
  
  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "Admin")}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAdminProfile();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAdminProfile = async () => {
    const adminId = localStorage.getItem("current_admin_id")?.replace(/^"|"$/g, '');
    if (!adminId || !API_URL_ADMIN) return;
    try {
      const res = await fetch(`${API_URL_ADMIN}?requester_id=${adminId}`);
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      const myProfile = data.find(u => String(u.admin_id) === String(adminId));
      if (myProfile) {
        setAdminData(myProfile);
        setCurrentRoles(Array.isArray(myProfile.roles) ? myProfile.roles : [myProfile.role || 'guest']);
      }
    } catch (error) { console.error("Error loading profile:", error); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push('/');
    } catch (error) { console.error("Logout error:", error); }
  };

  const hasAccess = (roles) => currentRoles.some(r => roles.includes(r));
  
  const getMenuClass = (path) => `flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-200 ${
    pathname === path ? "bg-[#111827] !text-white shadow-lg scale-[1.02]" : "text-black hover:bg-slate-50"
  }`;

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
      {currentRoles.length > 0 ? (
        <>
          {isSidebarRolesExpanded ? (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 w-full items-center">
              {currentRoles.map((role, idx) => (
                <span key={idx} className="text-[9px] font-bold text-[#6366F1] uppercase tracking-wider bg-[#EEF2FF] px-2.5 py-1 rounded-full border border-indigo-50 truncate max-w-[160px]">
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
              <button 
                onClick={() => setIsSidebarRolesExpanded(false)} 
                className="btn btn-xs h-6 min-h-0 bg-white border border-indigo-400 text-indigo-500 hover:bg-indigo-50 rounded-full px-2 text-[8px] font-bold uppercase mt-1"
              >
                Show less
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 w-full">
              <span className="text-[9px] font-bold text-[#6366F1] uppercase tracking-wider bg-[#EEF2FF] px-2.5 py-1 rounded-full border border-indigo-50 truncate max-w-[120px]">
                {currentRoles[0].replace(/_/g, ' ')}
              </span>
              {currentRoles.length > 1 && (
                <button 
                  onClick={() => setIsSidebarRolesExpanded(true)} 
                  className="btn btn-xs h-6 min-h-0 bg-white border border-indigo-400 text-indigo-500 hover:bg-indigo-50 rounded-full px-2 text-[8px] font-bold uppercase whitespace-nowrap shadow-sm"
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
      </div>
      <h2 className="text-sm font-bold text-slate-800 mt-4 px-2 break-words w-full">
        {adminData?.name || user?.displayName || "Admin User"}
      </h2>
      <SidebarRoleDisplay />
    </div>
  );

  return (
    <>
      {/* CSS สำหรับซ่อน Scrollbar โดยที่ยังเลื่อนได้ */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* MOBILE NAVBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-40 px-5 flex items-center border-b border-slate-100 shadow-sm">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-800 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <span className="ml-4 font-bold text-slate-800 text-sm">Admin Portal</span>
      </div>

      {/* MOBILE SIDEBAR DRAW */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-8 rounded-r-[2rem] animate-in slide-in-from-left duration-300 overflow-y-auto no-scrollbar">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 p-1.5 bg-slate-50 text-slate-400 rounded-full"><X size={18}/></button>
            <SidebarHeader />
            <nav className="flex flex-col gap-1.5 flex-1 mt-6 overflow-y-auto no-scrollbar">
              <Link href="/manage" className={getMenuClass('/manage')} onClick={() => setIsMobileMenuOpen(false)}>
                <Mail size={20} />
                <span className="text-[15px] font-bold">จัดการ Email</span>
              </Link>
              {hasAccess(['admin', 'editor', 'editor_manage_case']) && (
                <Link href="/manage-case" className={getMenuClass('/manage-case')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Briefcase size={20} />
                  <span className="text-[15px] font-bold">จัดการ Case</span>
                </Link>
              )}
              {hasAccess(['admin', 'editor', 'editor_manage_menu']) && (
                <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')} onClick={() => setIsMobileMenuOpen(false)}>
                  <LayoutGrid size={20} />
                  <span className="text-[15px] font-bold">จัดการ Menu</span>
                </Link>
              )}
              {hasAccess(['admin', 'editor', 'editor_manage_org']) && (
                <Link href="/manage-org" className={getMenuClass('/manage-org')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Users size={20} />
                  <span className="text-[15px] font-bold">จัดการ ORG</span>
                </Link>
              )}
              {hasAccess(['admin', 'editor', 'editor_manage_flex']) && (
                <Link href="/manage-flex-message" className={getMenuClass('/manage-flex-message')} onClick={() => setIsMobileMenuOpen(false)}>
                  <MessageSquareCode size={20} />
                  <span className="text-[15px] font-bold">จัดการ Flex Message</span>
                </Link>
              )}
            </nav>
            <div className="mt-auto pt-4 border-t border-slate-100">
                <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full text-red-600 font-bold text-[15px]">
                    <LogOut size={20} /> Logout
                </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-10 px-8 z-50 transition-all duration-300 ease-in-out overflow-y-auto no-scrollbar ${isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"}`}>
        <button onClick={() => setIsDesktopSidebarOpen(false)} className="absolute top-6 right-6 p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"><X size={18}/></button>
        <SidebarHeader />
        
        {/* รายการเมนู (พร้อมซ่อนแถบเลื่อน) */}
        <nav className="flex flex-col gap-1.5 flex-1 mt-4 overflow-y-auto no-scrollbar">
          <Link href="/manage" className={getMenuClass('/manage')}>
            <Mail size={20} />
            <span className="font-bold text-[15px]">จัดการ Email</span>
          </Link>
          
          {hasAccess(['admin', 'editor', 'editor_manage_case']) && (
            <Link href="/manage-case" className={getMenuClass('/manage-case')}>
              <Briefcase size={20} />
              <span className="font-bold text-[15px]">จัดการ Case</span>
            </Link>
          )}

          {hasAccess(['admin', 'editor', 'editor_manage_menu']) && (
            <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}>
              <LayoutGrid size={20} />
              <span className="font-bold text-[15px]">จัดการ Menu</span>
            </Link>
          )}

          {hasAccess(['admin', 'editor', 'editor_manage_org']) && (
            <Link href="/manage-org" className={getMenuClass('/manage-org')}>
              <Users size={20} />
              <span className="font-bold text-[15px]">จัดการ ORG</span>
            </Link>
          )}

          {hasAccess(['admin', 'editor', 'editor_manage_flex']) && (
            <Link href="/manage-flex-message" className={getMenuClass('/manage-flex-message')}>
              <MessageSquareCode size={20} />
              <span className="font-bold text-[15px]">จัดการ Flex Message</span>
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100">
            <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
            </button>
        </div>
      </aside>
    </>
  );
}