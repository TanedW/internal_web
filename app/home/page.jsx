"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  Mail, Briefcase, LayoutGrid, Users, 
  MessageSquareCode, Search, FolderSearch, ArrowRight,
  LayoutDashboard, ShieldCheck, LogOut 
} from "lucide-react";

export default function HomePage() {
  const [currentRoles, setCurrentRoles] = useState([]);
  const [userName, setUserName] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 1. ตั้งค่า Mounted เป็น true เมื่อรันบน Client เสร็จ
    setIsMounted(true);

    // 2. ดึงข้อมูลจาก Session
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
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (confirmLogout) {
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  // ✅ ย้าย useMemo มาไว้ด้านบน (ก่อน Conditional Return ใดๆ)
  const allMenus = useMemo(() => [
    { title: "จัดการ Email", slug: "email", description: "ดูแลจัดการสมาชิกเเละสิทธิ์ของสมาชิก", icon: <Mail size={24} />, href: "/manage", roles: ["admin", "editor", "editor_manage_user"] },
    { title: "จัดการ Case", slug: "case", description: "แก้ไขจัดการรูปภาพใน case", icon: <Briefcase size={24} />, href: "/manage-case", roles: ["admin", "editor", "editor_manage_case"] },
    { title: "จัดการ Menu", slug: "menu", description: "Rich Menu สำหรับ LINE OA", icon: <LayoutGrid size={24} />, href: "/manage-richmenu", roles: ["admin", "editor", "editor_manage_menu"] },
    { title: "จัดการ ORG", slug: "org", description: "ดูเเลจัดการหน่วยงานและข้อมูลองค์กร", icon: <Users size={24} />, href: "/manage-org", roles: ["admin", "editor", "editor_manage_org", "editor_manage_org_info"] },
    { title: "จัดการ Flex Message", slug: "flex", description: "สร้างชุดข้อความ Flex", icon: <MessageSquareCode size={24} />, href: "/manage-flex-message", roles: ["admin", "editor", "editor_manage_flex"] },
    { title: "ค้นหาหน่วยงานซ้ำ", slug: "search", description: "ค้นหาและจัดการความซ้ำซ้อนของหน่วยงาน", icon: <Search size={24} />, href: "/search-org", roles: ["admin", "editor", "editor_search_duplicate_org"] },
    { title: "จัดการไฟล์ FAQ", slug: "file", description: "จัดการฐานข้อมูลความรู้และเอกสาร", icon: <FolderSearch size={24} />, href: "/manage-file-search", roles: ["admin", "editor", "editor_file_search"] },
  ], []);

  const accessibleMenus = useMemo(() => {
    // กรองเมนูตามสิทธิ์ (ถ้ายังไม่ Mounted จะคืนค่าว่างป้องกัน UI โดด)
    if (!isMounted) return [];
    return allMenus.filter(menu => currentRoles.some(r => menu.roles.includes(r)));
  }, [isMounted, currentRoles, allMenus]);

  const getMenuStyles = (slug) => {
    const styles = {
      email: { color: "from-blue-600 to-indigo-700", text: "text-blue-600" },
      case: { color: "from-rose-500 to-orange-600", text: "text-rose-600" },
      menu: { color: "from-amber-400 to-orange-600", text: "text-amber-600" },
      org: { color: "from-emerald-500 to-teal-600", text: "text-emerald-600" },
      flex: { color: "from-violet-500 to-purple-600", text: "text-violet-600" },
      search: { color: "from-sky-400 to-blue-600", text: "text-sky-600" },
      file: { color: "from-slate-700 to-slate-900", text: "text-slate-700" },
      default: { color: "from-indigo-600 to-purple-700", text: "text-indigo-600" }
    };
    return styles[slug] || styles.default;
  };

  // ✅ เช็คการ Mounted บรรทัดสุดท้ายก่อน Render UI จริง
  if (!isMounted) {
    return <div className="min-h-screen bg-[#FDFDFD]" />;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16 animate-in fade-in duration-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-indigo-600">
              <LayoutDashboard size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">Administration</span>
              <h2 className="text-sm font-bold text-slate-800">Control Center Hub</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 shadow-sm rounded-[1.5rem]">
              <div className="flex items-center gap-3 pl-3 pr-4 py-1.5 bg-slate-50/50 rounded-[1.25rem]">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : "?"}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 uppercase">
                    <ShieldCheck size={10} /> Verified
                  </span>
                  <span className="text-sm font-black text-slate-800">{userName || "Admin"}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-4 bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition-all duration-300 shadow-sm group active:scale-95"
              title="ออกจากระบบ"
            >
              <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <header className="mb-16 animate-in fade-in slide-in-from-left-4 duration-700">
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1]">
            สวัสดี, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">{userName || "ผู้ดูแลระบบ"}</span>
            <span className="inline-block ml-4">✨</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg lg:text-xl leading-relaxed whitespace-nowrap">
            เลือกเมนูที่คุณต้องการเพื่อเริ่มดำเนินการจัดการระบบได้เลย!
          </p>
        </header>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {accessibleMenus.map((menu, index) => {
            const style = getMenuStyles(menu.slug);
            return (
              <Link 
                key={menu.slug} 
                href={menu.href}
                className="group relative bg-white rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-slate-50 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`relative w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${style.color} text-white flex items-center justify-center mb-10 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {menu.icon}
                </div>

                <div className="relative">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {menu.title}
                  </h3>
                  <p className="text-slate-400 text-[15px] leading-relaxed mb-10 min-h-[3rem] font-medium">
                    {menu.description}
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