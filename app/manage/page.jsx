'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 

export default function Manage() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- State ข้อมูล ---
  const [allowedEmails, setAllowedEmails] = useState([]); 
  const [filteredEmails, setFilteredEmails] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  
  // State สิทธิ์
  const [canDelete, setCanDelete] = useState(false); 
  const [currentRoles, setCurrentRoles] = useState([]); 

  // State สำหรับ Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State สำหรับ Desktop Sidebar (Toggle)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // State สำหรับ Modal ดู Role (ใช้เฉพาะใน Grid View ตรงกลาง)
  const [roleModalData, setRoleModalData] = useState(null);

  // State สำหรับ Toggle การแสดง Role ทั้งหมดใน Sidebar
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  // State สำหรับฟอร์ม
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // Helper: ดึง ID ตัวเองจาก LocalStorage
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  };

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // --- API Functions ---
  const fetchAdmins = async () => {
    if (!API_URL) return;
    const currentAdminId = getCurrentAdminId();
    try {
      const url = currentAdminId ? `${API_URL}?requester_id=${currentAdminId}` : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admins");
      const jsonResponse = await res.json();
      const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);
      const meta = jsonResponse.meta || {};

      setAllowedEmails(data);
      setFilteredEmails(data);
      setCanDelete(!!meta.can_delete); 

      if (currentAdminId && data.length > 0) {
        const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
        if (myProfile) {
            let roles = [];
            if (Array.isArray(myProfile.roles)) {
                roles = myProfile.roles;
            } else if (myProfile.role) {
                roles = [myProfile.role];
            }
            setCurrentRoles(roles);
        }
      }
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAdmins(); 
        setLoading(false);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, API_URL]);

  useEffect(() => {
    const results = allowedEmails.filter(item =>
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmails(results);
  }, [searchTerm, allowedEmails]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) return;
    if (allowedEmails.some(item => item.email === newEmail)) {
        alert("อีเมลนี้มีอยู่ในระบบแล้ว");
        return;
    }
    const currentAdminId = getCurrentAdminId();
    if (!currentAdminId) {
        alert("ไม่พบข้อมูลผู้ดูแลระบบ");
        return;
    }
    setIsSubmitting(true);
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: newEmail,
                role: newRole, 
                current_admin_id: currentAdminId 
            }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to add admin");
        setNewEmail("");
        setNewRole("editor"); 
        fetchAdmins();
        document.getElementById('add_admin_modal').close();
    } catch (error) {
        console.error("Error adding admin:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteEmail = async (targetId) => {
    if(!confirm("ยืนยันการลบสิทธิ์นี้?")) return;
    const currentAdminId = getCurrentAdminId();
    if (!currentAdminId) return;
    try {
        const res = await fetch(`${API_URL}?id=${targetId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_admin_id: currentAdminId }),
        });
        const result = await res.json();
        if (res.status === 403) {
            alert("⛔ Access Denied: คุณไม่มีสิทธิ์ลบข้อมูลผู้ดูแลระบบ");
            return;
        }
        if (!res.ok) throw new Error(result.message || "Failed to delete admin");
        fetchAdmins();
    } catch (error) {
        console.error("Error deleting admin:", error);
        alert("ลบไม่สำเร็จ: " + error.message);
    }
  };

  const hasAccess = (requiredRoles) => {
     return currentRoles.some(myRole => requiredRoles.includes(myRole));
  };

  const showCaseMenu = hasAccess(['admin', 'editor', 'editor_manage_case']);
  const showMenuMenu = hasAccess(['admin', 'editor', 'editor_manage_menu']);

  const getMenuClass = (targetPath) => {
      const isActive = pathname === targetPath;
      return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
        isActive 
          ? "bg-[#111827] !text-white shadow-lg shadow-slate-300 scale-[1.02]" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`;
  };

  // ✅ Component SidebarRoleDisplay ปรับปรุงดีไซน์ตามรูป
  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
        {currentRoles.length > 0 ? (
            <>
                {/* --- 1. กรณีขยาย (Expanded) --- */}
                {isSidebarRolesExpanded ? (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 w-full items-center">
                        {currentRoles.map((role, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[160px]">
                                {role.replace(/_/g, ' ')}
                            </span>
                        ))}
                        <button 
                            onClick={() => setIsSidebarRolesExpanded(false)}
                            className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm"
                        >
                            Show less
                        </button>
                    </div>
                ) : (
                    /* --- 2. กรณีปกติ (Collapsed) --- */
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        {/* Role แรก (สีม่วง/น้ำเงิน) */}
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[150px]">
                            {currentRoles[0].replace(/_/g, ' ')}
                        </span>

                        {/* ปุ่ม +X more (สีเทา แบบในรูป) */}
                        {currentRoles.length > 1 && (
                            <button
                                onClick={() => setIsSidebarRolesExpanded(true)}
                               
                                className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm"
                            >
                                +{currentRoles.length - 1} more
                            </button>
                        )}
                    </div>
                )}
            </>
        ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest</span>
        )}
    </div>
  );

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE HEADER ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F4F6F8]/95 backdrop-blur-sm z-40 px-5 flex justify-between items-center border-b border-slate-200/50">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="btn btn-square btn-ghost btn-sm text-slate-800">
                   {/* Hamburger Icon (Mobile) */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
              </button>
              <h1 className="font-bold text-slate-800 text-lg">Team</h1>
           </div>
      </div>

     {/* ================= MOBILE SIDEBAR DRAWER ================= */}
     {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-6 rounded-r-[2rem]">
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                >
                    {/* Cross Icon (Mobile) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="flex flex-col items-center text-center mb-8 mt-6">
                      <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                            <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
                        </div>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800 break-words w-full px-2">{user?.displayName || "Admin"}</h2>
                      
                      {/* ✅ เรียกใช้ SidebarRoleDisplay (Mobile) */}
                      <SidebarRoleDisplay />

                </div>
                <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
                    <Link href="/manage" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                        <span className="font-bold text-sm">จัดการ Email</span>
                    </Link>
                    {showCaseMenu && (
                        <Link href="/manage-case" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-case')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                            <span className="font-bold text-sm">จัดการ Case</span>
                        </Link>
                    )}
                    {showMenuMenu && (
                        <Link href="/manage-richmenu" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-richmenu')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path></svg>
                            <span className="font-bold text-sm">จัดการ Menu</span>
                        </Link>
                    )}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                        <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 transition-transform group-hover:translate-x-0.5">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </div>
                        <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                    </button>
                </div>
            </div>
        </div>
     )}


      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2rem] shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-8 px-6 z-50 overflow-y-auto no-scrollbar transition-all duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
          
          {/* ✅ 1. ปุ่ม Close (กากบาท) บน Sidebar */}
          <button 
                onClick={() => setIsDesktopSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all duration-200"
                title="Close Sidebar"
          >
               {/* ไอคอน Cross (X) */}
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
          </button>

          <div className="flex flex-col items-center text-center mb-10 mt-2">
              <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-slate-200 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                      <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
                  </div>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 px-2 break-words w-full">{user?.displayName || "Admin"}</h2>
              
              {/* ✅ เรียกใช้ SidebarRoleDisplay (Desktop) */}
              <SidebarRoleDisplay />

          </div>

          <div className="flex flex-col gap-2 w-full flex-1">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
                  <Link href="/manage" className={getMenuClass('/manage')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                      <span className="font-bold text-sm">จัดการ Email</span>
                  </Link>
              {showCaseMenu && (
                  <Link href="/manage-case" className={getMenuClass('/manage-case')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                      <span className="font-bold text-sm">จัดการ Case</span>
                  </Link>
              )}
              {showMenuMenu && (
                  <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path></svg>
                      <span className="font-bold text-sm">จัดการ Menu</span>
                  </Link>
              )}
          </div>

          <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200">
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 transition-transform group-hover:translate-x-0.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </div>
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
          </button>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {/* ✅ 2. ปุ่ม Open (Hamburger) แสดงเฉพาะตอน Sidebar ปิด */}
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:block fixed top-8 left-8 z-30">
                <button 
                    onClick={() => setIsDesktopSidebarOpen(true)}
                    className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"
                    title="Open Sidebar"
                >
                    {/* ไอคอน Hamburger (3 ขีด) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
             </div>
        )}

        {/* Header Desktop */}
        <div className="hidden lg:flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Team Directory</h1>
                    <p className="text-slate-400 mt-1 font-medium">Manage your team members and permissions</p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="relative w-72 group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Search members..." 
                        className="input bg-white w-full h-12 !pl-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-2xl shadow-sm border border-slate-100 placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                </div>
            </div>
        </div>

        {/* HEADER MOBILE */}
        <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
            <div className="mt-4 flex gap-3 items-center">
                 <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                         </svg>
                      </div>
                      <input 
                        type="text"
                        className="input w-full !pl-12 bg-white text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border-slate-200"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                 </div>
                 <button 
                    onClick={() => document.getElementById('add_admin_modal').showModal()}
                    className="btn btn-primary text-white min-h-[3rem] h-12 px-4 rounded-xl shadow-md shadow-indigo-200 whitespace-nowrap"
                  >
                      + New
                  </button>
            </div>
        </div>

        {/* --- GRID VIEW --- */}
        {/* ปรับ Grid Columns ให้เหมาะสม */}
        <div className={`grid grid-cols-1 gap-4 ${
            isDesktopSidebarOpen 
                ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" // Sidebar เปิด
                : "md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" // Sidebar ปิด
        }`}>
            <div 
               className={`hidden lg:flex group relative flex-col items-center justify-center border-2 border-dashed border-indigo-300 bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 cursor-pointer rounded-2xl shadow-md hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-2 h-full ${
                 isDesktopSidebarOpen ? 'p-4' : 'p-6'
               }`}
               onClick={() => document.getElementById('add_admin_modal').showModal()}
            >
                <div className={`rounded-full bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-300 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 ${
                    isDesktopSidebarOpen ? 'w-12 h-12' : 'w-16 h-16'
                }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`${isDesktopSidebarOpen ? 'h-6 w-6' : 'h-8 w-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                      </svg>
                </div>
                <h3 className={`text-indigo-900 font-bold group-hover:text-indigo-700 transition-colors ${
                    isDesktopSidebarOpen ? 'text-base' : 'text-lg'
                }`}>Add Member</h3>
                <p className="text-indigo-500/80 text-xs mt-1 text-center font-medium">Click to invite new admin</p>
            </div>

            {filteredEmails.map((item) => {
                const userRoles = item.roles && item.roles.length > 0 ? item.roles : (item.role ? [item.role] : ['member']);
                return (
                    <div key={item.admin_id} 
                        // ✅ ปรับ Padding การ์ด
                        className={`relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center justify-center h-full ${
                            isDesktopSidebarOpen ? "p-4" : "p-6"
                        }`}
                    >
                        {canDelete && (
                             <button 
                               onClick={() => handleDeleteEmail(item.admin_id)}
                               className="absolute top-2 right-2 !text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors z-10"
                               title="Remove user"
                               style={{ color: '#ef4444' }} 
                             >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                   <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                               </svg>
                             </button>
                        )}
                        {/* ✅ ปรับขนาดรูป */}
                        <div className={`rounded-full bg-slate-50 mb-3 overflow-hidden ring-2 ring-slate-50 mx-auto ${
                            isDesktopSidebarOpen ? "w-10 h-10 mb-2" : "w-14 h-14 mb-3"
                        }`}>
                            <img 
                               src={item.profile_url || getAvatarUrl(item.email)} 
                               alt="Avatar" 
                               className="w-full h-full object-cover"
                               onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getAvatarUrl(item.email); }}
                            />
                        </div>

                        {/* ✅ ปรับขนาดตัวหนังสือ Email */}
                        <h3 className={`font-bold text-slate-800 mb-2 break-all w-full px-1 ${
                             isDesktopSidebarOpen ? "text-[10px] mb-1" : "text-sm mb-2"
                        }`} title={item.email}>
                            {item.email}
                        </h3>
                        
                        {/* ============= ส่วนแสดงผล Role (Update ใหม่ กรอบใหญ่ขึ้น) ============= */}

                        {/* 1. Mobile View (1 Role + Button +X more) */}
                        <div className="lg:hidden mt-2 w-full px-2 flex flex-wrap gap-2 justify-center items-center">
                            {/* แสดง Role แรกเสมอ (เพิ่มขนาดกรอบและ Max Width) */}
                            {userRoles.length > 0 && (
                                <span className="inline-flex items-center justify-center text-indigo-600 font-bold text-[10px] uppercase tracking-wider bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 truncate max-w-[180px]">
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}

                            {/* ถ้ามีมากกว่า 1 Role ให้แสดงปุ่มกดแบบขอบม่วง */}
                            {userRoles.length > 1 && (
                                <button 
                                    onClick={() => {
                                        setRoleModalData(userRoles);
                                        document.getElementById('role_modal').showModal();
                                    }}
                                    className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm"
                                >
                                    +{userRoles.length - 1} more
                                </button>
                            )}
                        </div>

                        {/* 2. Desktop View (1 Role + Tooltip with Smart Resize) */}
                        <div className="hidden lg:flex flex-wrap gap-2 justify-center mt-2 w-full px-2">
                            {userRoles.length > 0 && (
                                <span className={`inline-flex items-center justify-center font-bold uppercase tracking-wider bg-indigo-50 rounded-full border border-indigo-100 truncate text-indigo-600 ${
                                    isDesktopSidebarOpen 
                                        ? "text-[9px] px-2 py-0.5 max-w-[140px]"  // Sidebar เปิด
                                        : "text-[10px] px-3 py-1 max-w-[180px]"   // Sidebar ปิด
                                }`}>
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}
                            {userRoles.length > 1 && (
                                <div className="tooltip" data-tip={userRoles.slice(1).map(r => r.replace(/_/g, ' ')).join(', ')}>
                                    <span className={`cursor-help text-slate-500 font-bold tracking-wider bg-slate-100 rounded-full whitespace-nowrap border border-slate-200 hover:bg-slate-200 transition-colors ${
                                        isDesktopSidebarOpen 
                                            ? "text-[9px] px-2 py-0.5" 
                                            : "text-[10px] px-2.5 py-1"
                                    }`}>
                                        +{userRoles.length - 1} more
                                    </span>
                                </div>
                            )}
                        </div>
                        {/* ============= สิ้นสุดส่วนแสดงผล Role ============= */}

                    </div>
                );
            })}
        </div>
        {filteredEmails.length === 0 && (<div className="text-center py-20 text-slate-400">No contacts found</div>)}
      </div>

        {/* --- ADD ADMIN MODAL --- */}
        <dialog id="add_admin_modal" className="modal modal-bottom sm:modal-middle z-[999]">
            <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-800">Add Member</h3>
                    <button onClick={() => document.getElementById('add_admin_modal').close()} className="btn btn-sm btn-circle btn-ghost text-slate-400 bg-slate-100 hover:bg-slate-200">✕</button>
                </div>
                <form onSubmit={handleAddEmail} className="flex flex-col gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text font-bold text-slate-700">Email Address</span></label>
                        <label className="input input-bordered h-12 flex items-center gap-2 bg-slate-50 border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl">
                            <svg className="h-[1em] opacity-50 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                </g>
                            </svg>
                            <input type="email" className="grow bg-transparent border-none outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400" placeholder="mail@site.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                        </label>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text font-bold text-slate-700">Assign Role</span></label>
                        <select className="select select-bordered h-12 w-full bg-slate-50 border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-slate-800" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                            <option value="editor" disabled>Select Role...</option>
                            <option value="editor_manage_email">Admin Email</option>
                            <option value="editor_manage_case">Admin Case</option>
                            <option value="editor_manage_menu">Admin Menu</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4 h-12 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200 text-white" disabled={isSubmitting}>
                            {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Confirm"}
                    </button>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
        </dialog>

        {/* --- ROLE VIEW MODAL (สำหรับมือถือ - เฉพาะ Grid View) --- */}
        <dialog id="role_modal" className="modal modal-bottom sm:modal-middle z-[9999]">
            <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">All Roles</h3>
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost text-slate-400 bg-slate-100 hover:bg-slate-200">✕</button>
                    </form>
                </div>
                
                <div className="flex flex-wrap gap-2 content-start">
                    {roleModalData && roleModalData.map((role, idx) => (
                        <span key={idx} className="text-indigo-600 font-bold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 w-full text-center sm:w-auto">
                            {role.replace(/_/g, ' ')}
                        </span>
                    ))}
                </div>
                
                <div className="modal-action w-full mt-6">
                    <form method="dialog" className="w-full">
                        <button className="btn btn-primary w-full rounded-xl text-white">Close</button>
                    </form>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
        </dialog>
    </div>
  );
}