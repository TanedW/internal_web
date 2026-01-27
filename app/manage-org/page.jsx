'use client';

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from 'next/link';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import { 
  Building2, Upload, Save, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  Mail, Briefcase, LayoutGrid, Users, X, Menu, LogOut,
  ChevronRight, Lock, MousePointerClick
} from "lucide-react";

export default function ManageOrg() {
  const router = useRouter();
  const pathname = usePathname();

  // --- UI States ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  // --- Auth & Permission States ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoles, setCurrentRoles] = useState([]);

  // --- Business Logic States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [cases, setCases] = useState([]); 
  const [orgId, setOrgId] = useState("");     
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;
  const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 
  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "Admin")}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // --- Helper Functions ---
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      return storedId ? storedId.replace(/^"|"$/g, '') : null;
    }
    return null;
  };

  const hasAccess = (requiredRoles) => {
    return currentRoles.some(myRole => requiredRoles.includes(myRole));
  };

  const showCaseMenu = hasAccess(['admin', 'editor', 'editor_manage_case']);
  const showMenuMenu = hasAccess(['admin', 'editor', 'editor_manage_menu']);
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  // --- Handlers ---
  const fetchAdmins = async () => {
    if (!API_URL_ADMIN) return;
    const adminId = getCurrentAdminId();
    try {
      const res = await fetch(adminId ? `${API_URL_ADMIN}?requester_id=${adminId}` : API_URL_ADMIN);
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      if (adminId && data.length > 0) {
        const myProfile = data.find(u => String(u.admin_id) === String(adminId));
        if (myProfile) {
          const roles = Array.isArray(myProfile.roles) ? myProfile.roles : [myProfile.role || 'guest'];
          setCurrentRoles(roles);
        }
      }
    } catch (error) {
      console.error("Error loading roles:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchOrgData = async (targetId = "") => {
    if (!targetId) return;
    setIsSearching(true);
    setOrgId(""); 
    setStatus({ type: '', message: '' });
    try {
      const res = await fetch(`${API_URL_ORG}?q=${encodeURIComponent(targetId)}`);
      if (!res.ok) throw new Error("API response was not ok");
      const result = await res.json();
      if (result.found && result.data) {
        const mappedData = result.data.map(item => ({
          org_id: item.id,
          org_name: item.name,
          logo_url: item.photo, 
        }));
        setCases(mappedData);
      } else {
        setCases([]);
        setStatus({ type: 'error', message: 'ไม่พบข้อมูลหน่วยงาน' });
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setCases([]);
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally { 
      setIsSearching(false); 
    }
  };

  const handleSelectCase = (item) => {
    if (orgId === item.org_id) {
      setOrgId("");
      setOrgName("");
      setLogoPreview(null);
      setLogoFile(null);
    } else {
      setOrgId(item.org_id);
      setOrgName(item.org_name || item.name);
      setLogoPreview(item.logo_url);
      setLogoFile(null);
      document.getElementById('edit-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus({ type: 'success', message: 'อัปเดตข้อมูลหน่วยงานสำเร็จ' });
    } catch (error) {
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("ไฟล์มีขนาดใหญ่เกินไป (จำกัด 5MB)");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAdmins();
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const getMenuClass = (targetPath) => {
    const isActive = pathname === targetPath;
    return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer ${
      isActive ? "bg-[#111827] !text-white shadow-lg scale-[1.02]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold"
    }`;
  };

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full text-center">
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {currentRoles.length > 0 ? (
          <>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[120px]">
              {currentRoles[0].replace(/_/g, ' ')}
            </span>
            {currentRoles.length > 1 && (
              <button onClick={() => setIsSidebarRolesExpanded(!isSidebarRolesExpanded)} className="h-7 bg-white border border-indigo-500 text-indigo-600 rounded-full px-3 text-[10px] font-bold active:bg-indigo-50">
                {isSidebarRolesExpanded ? "Less" : `+ ${currentRoles.length - 1} more`}
              </button>
            )}
          </>
        ) : <span className="text-[10px] font-bold text-slate-400">GUEST</span>}
      </div>
      {isSidebarRolesExpanded && (
        <div className="flex flex-col gap-2 w-full mt-2 items-center animate-in fade-in slide-in-from-top-1">
          {currentRoles.slice(1).map((role, idx) => (
            <span key={idx} className="text-[10px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 w-fit">
              {role.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans overflow-x-hidden">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" />

      {/* NAVBAR MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F4F6F8]/95 backdrop-blur-sm z-40 px-5 flex justify-between items-center border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="btn btn-square btn-ghost btn-sm text-slate-800">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-slate-800 text-lg">Manage ORG</h1>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300 rounded-r-[2rem]">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"><X size={20}/></button>
            <div className="flex flex-col items-center text-center mb-8 mt-6">
              <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                  <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full" />
                </div>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 truncate w-full px-2">{user?.displayName || "Admin"}</h2>
              <SidebarRoleDisplay />
            </div>
            <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
              <Link href="/manage" className={getMenuClass('/manage')}><Mail size={20}/> <span className="text-sm">จัดการ Email</span></Link>
              {showCaseMenu && <Link href="/manage-case" className={getMenuClass('/manage-case')}><Briefcase size={20}/> <span className="text-sm">จัดการ Case</span></Link>}
              {showMenuMenu && <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}><LayoutGrid size={20}/> <span className="text-sm">จัดการ Menu</span></Link>}
              {showORGMenu && <Link href="/manage-org" className={getMenuClass('/manage-org')}><Users size={20}/> <span className="text-sm">จัดการ ORG</span></Link>}
            </div>
            <div className="mt-auto pt-4 border-t"><button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 w-full"><LogOut size={20} className="text-red-500"/><span className="text-red-600 font-bold">Logout</span></button></div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex-col py-8 px-6 z-50 transition-all duration-300 ${isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"}`}>
        <button onClick={() => setIsDesktopSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"><X size={20}/></button>
        <div className="flex flex-col items-center text-center mb-10 mt-2">
            <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-slate-200 mb-4">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 px-2 break-words w-full">{user?.displayName || "Admin"}</h2>
            <SidebarRoleDisplay />
        </div>
        <div className="flex flex-col gap-2 w-full flex-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
            <Link href="/manage" className={getMenuClass('/manage')}><Mail size={20}/><span className="font-bold text-sm">จัดการ Email</span></Link>
            {showCaseMenu && <Link href="/manage-case" className={getMenuClass('/manage-case')}><Briefcase size={20}/><span className="font-bold text-sm">จัดการ Case</span></Link>}
            {showMenuMenu && <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}><LayoutGrid size={20}/><span className="font-bold text-sm">จัดการ Menu</span></Link>}
            {showORGMenu && <Link href="/manage-org" className={getMenuClass('/manage-org')}><Users size={20}/><span className="font-bold text-sm">จัดการ ORG</span></Link>}
        </div>
        <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">
          <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100"><LogOut size={20} className="text-red-500"/></div>
          <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
        </button>
      </div>

      <main className={`transition-all duration-300 pt-24 lg:pt-12 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-12"}`}>
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          
          <header className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
            <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200"><Building2 size={32} /></div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">จัดการหน่วยงาน</h1>
              <p className="text-slate-500 font-medium">ค้นหาและอัปเดตข้อมูลหน่วยงานในระบบ</p>
            </div>
          </header>

          {/* SEARCH BAR */}
          <div className="flex flex-row items-center gap-4 mb-10 w-full">
            <section className="flex-1 flex items-center bg-white rounded-full shadow-lg border border-slate-100 p-2 h-16 min-w-0">
              <div className="flex items-center px-6 gap-3 w-full">
                <Search className="text-slate-400 shrink-0" size={24} strokeWidth={2.5} />
                <input 
                  type="text" 
                  className="grow bg-transparent focus:outline-none text-slate-800 font-bold placeholder:text-slate-300 text-base md:text-lg min-w-0"
                  placeholder="ค้นหาหน่วยงาน..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)}
                />
              </div>
            </section>
             <button 
              onClick={() => fetchOrgData(searchId)} 
              disabled={isSearching} 
              style={{ 
                  backgroundColor: isSearching ? '#e2e8f0' : '#000000',
                  color: '#FFFFFF',
                  minWidth: '100px' 
              }}
              className="h-16 px-12 md:px-16 rounded-full !text-white font-black text-sm md:text-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 hover:shadow-indigo-200/40 shrink-0"
            >
              {isSearching ? (
                <Loader2 size={24} className="animate-spin text-slate-400" />
              ) : (
                <span className="!text-white whitespace-nowrap tracking-wider">ค้นหา</span>
              )}
            </button>
          </div>

          {/* SEARCH RESULTS */}
          <section className="mb-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">ผลการค้นหา</h3>
            {cases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {cases.map((item) => (
                  <div 
                    key={item.org_id}
                    onClick={() => handleSelectCase(item)}
                    className={`card bg-white shadow-sm cursor-pointer transition-all border-2 ${
                      orgId === item.org_id ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <figure className="px-4 pt-4">
                      <div className="w-full h-32 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                        <img src={item.logo_url || getAvatarUrl(item.org_id)} alt="Logo" className="h-full object-contain p-4" onError={(e) => e.target.src = getAvatarUrl(item.org_id)} />
                      </div>
                    </figure>
                    <div className="card-body p-5">
                      <h2 className="card-title text-slate-800 font-black text-lg">
                        {item.org_name || "ไม่ระบุชื่อ"}
                        {orgId === item.org_id && <div className="badge badge-secondary uppercase text-[10px]">Selected</div>}
                      </h2>
                      <div className="card-actions justify-end">
                        <div className="badge badge-outline text-slate-400 font-bold text-[10px]">ID: {item.org_id}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-16 flex flex-col items-center text-center px-6">
                <MousePointerClick size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 text-base font-bold">ระบุรหัสหน่วยงานเพื่อเริ่มต้น</p>
              </div>
            )}
          </section>

          {/* ✅ EDIT CARD SECTION */}
          <section id="edit-card" className="relative mb-20">
            {!orgId && (
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[3px] rounded-[2.5rem] flex items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3 animate-pulse">
                  <Lock size={28} className="text-slate-400" />
                  <p className="font-bold text-slate-500 text-sm">กรุณาเลือกหน่วยงานเพื่อดำเนินการ</p>
                </div>
              </div>
            )}
            
            <div className={`bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden transition-all duration-500 ${!orgId ? 'opacity-40 grayscale' : 'opacity-100'}`}>
              <form onSubmit={handleSubmit}>
                <div className="p-10 lg:p-14">
                  <div className="flex flex-col md:flex-row gap-12 items-center">
                    
                    {/* Logo Section */}
                    <div className="relative group shrink-0">
                      <div className="w-44 h-44 lg:w-52 lg:h-52 rounded-[2.5rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center p-8 transition-all group-hover:border-indigo-400 group-hover:bg-white">
                        {logoPreview ? (
                          <img src={logoPreview} className="w-full h-full object-contain" alt="logo" />
                        ) : (
                          <ImageIcon size={50} className="text-slate-300" />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-xl cursor-pointer transition-transform active:scale-90">
                        <Upload size={22} strokeWidth={2.5} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={!orgId} />
                      </label>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 w-full space-y-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-2">
                          Display Name
                        </label>
                        <input 
                          type="text" 
                          value={orgName} 
                          onChange={(e) => setOrgName(e.target.value)} 
                          className="w-full h-16 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-3xl text-xl font-bold text-slate-800 px-8 outline-none transition-all shadow-inner"
                          placeholder="ชื่อหน่วยงาน..."
                          required
                          disabled={!orgId}
                        />
                      </div>

                      {/* Warning Alert */}
                      <div className="flex items-center gap-5 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                          <AlertCircle size={24} className="text-amber-600" />
                        </div>
                        <p className="text-[14px] text-amber-900 font-bold leading-relaxed">
                          การเปลี่ยนแปลงจะส่งผลต่อ LINE และ Dashboard ทันที
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ BIG GREEN BUTTON (FORCED COLOR WITH INLINE STYLE) */}
                <div className="px-10 pb-14 flex justify-center">
                  <button 
                    type="submit" 
                    disabled={!orgId || isSubmitting} 
                    style={{ 
                      backgroundColor: !orgId || isSubmitting ? '#cbd5e1' : '#22c55e',
                      color: 'white',
                      boxShadow: !orgId || isSubmitting ? 'none' : '0 10px 25px -5px rgba(34, 197, 94, 0.4)'
                    }}
                    className="group flex items-center justify-center gap-4 w-full max-w-lg h-20 font-black text-xl lg:text-2xl rounded-[2rem] transition-all active:scale-[0.97] border-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={28} className="animate-spin text-white" />
                        <span>กำลังบันทึกข้อมูล...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={28} className="group-hover:rotate-12 transition-transform text-white" />
                        <span>ยืนยันการอัปเดตข้อมูล</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}