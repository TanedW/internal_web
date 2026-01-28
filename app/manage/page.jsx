'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import { 
  Mail, 
  Briefcase, 
  LayoutGrid, 
  Users, 
  LogOut, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  Menu 
} from "lucide-react";

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

  // State สำหรับ Modal ดู Role
  const [roleModalData, setRoleModalData] = useState(null);

  // ✅ State สำหรับเก็บ Email ที่เลือกดูบน Mobile
  const [selectedEmailForMobile, setSelectedEmailForMobile] = useState("");

  // State สำหรับ Toggle การแสดง Role ใน Sidebar
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  // State สำหรับฟอร์ม
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  };

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

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

  // ✅ ฟังก์ชันเปิด Modal บนมือถือ
  const handleEmailMobileClick = (email) => {
    if (window.innerWidth < 1024) {
      setSelectedEmailForMobile(email);
      document.getElementById('email_mobile_modal').showModal();
    }
  };

  const showCaseMenu = hasAccess(['admin', 'editor', 'editor_manage_case']);
  const showMenuMenu = hasAccess(['admin', 'editor', 'editor_manage_menu']);
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  const getMenuClass = (targetPath) => {
      const isActive = pathname === targetPath;
      return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
        isActive 
          ? "bg-[#111827] !text-white shadow-lg shadow-slate-300 scale-[1.02]" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`;
  };

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
        {currentRoles.length > 0 ? (
            <>
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
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[150px]">
                            {currentRoles[0].replace(/_/g, ' ')}
                        </span>
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
                  <Menu className="w-6 h-6" />
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
                    <X className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center text-center mb-8 mt-6">
                      <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                            <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
                        </div>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800 break-words w-full px-2">{user?.displayName || "Admin"}</h2>
                      <SidebarRoleDisplay />
                </div>
                <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
                    <Link href="/manage" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage')}>
                        <Mail size={20} />
                        <span className="font-bold text-sm">จัดการ Email</span>
                    </Link>
                    {showCaseMenu && (
                        <Link href="/manage-case" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-case')}>
                            <Briefcase size={20} />
                            <span className="font-bold text-sm">จัดการ Case</span>
                        </Link>
                    )}
                    {showMenuMenu && (
                        <Link href="/manage-richmenu" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-richmenu')}>
                            <LayoutGrid size={20} />
                            <span className="font-bold text-sm">จัดการ Menu</span>
                        </Link>
                    )}
                    {showORGMenu && (
                        <Link href="/manage-org" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-org')}>
                            <Users size={20} />
                            <span className="font-bold text-sm">จัดการ ORG</span>
                        </Link>
                    )}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                        <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                            <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
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
          
          <button 
                onClick={() => setIsDesktopSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all duration-200"
                title="Close Sidebar"
          >
              <X className="w-5 h-5" />
          </button>

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
              <Link href="/manage" className={getMenuClass('/manage')}>
                  <Mail size={20} />
                  <span className="font-bold text-sm">จัดการ Email</span>
              </Link>
              {showCaseMenu && (
                  <Link href="/manage-case" className={getMenuClass('/manage-case')}>
                      <Briefcase size={20} />
                      <span className="font-bold text-sm">จัดการ Case</span>
                  </Link>
              )}
              {showMenuMenu && (
                  <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}>
                      <LayoutGrid size={20} />
                      <span className="font-bold text-sm">จัดการ Menu</span>
                  </Link>
              )}
              {showORGMenu && (
                  <Link href="/manage-org" className={getMenuClass('/manage-org')}>
                      <Users size={20} />
                      <span className="font-bold text-sm">จัดการ ORG</span>
                  </Link>
              )}
          </div>

          <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200">
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
          </button>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:block fixed top-8 left-8 z-30">
                <button 
                    onClick={() => setIsDesktopSidebarOpen(true)}
                    className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"
                    title="Open Sidebar"
                >
                    <Menu className="w-6 h-6" />
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
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
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
                         <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
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
        <div className={`grid grid-cols-1 gap-4 ${
            isDesktopSidebarOpen 
                ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" 
                : "md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
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
                    <Plus size={isDesktopSidebarOpen ? 24 : 32} strokeWidth={3} />
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
                        className={`relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center justify-center h-full hover:z-30 ${
                            isDesktopSidebarOpen ? "p-4" : "p-6"
                        }`}
                    >
                        {canDelete && (
                             <button 
                               onClick={() => handleDeleteEmail(item.admin_id)}
                               className="absolute top-2 right-2 hover:bg-red-50 rounded-full p-2 transition-colors z-10"
                               title="Remove user"
                               style={{ color: '#ef4444' }} 
                             >
                               <Trash2 size={20} />
                             </button>
                        )}
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

                        {/* ✅ แก้ไขส่วนแสดง Email: 
                            - บน PC: ใช้ tooltip แสดงเมลเต็มเมื่อเอาเมาส์ชี้
                            - บน Mobile: คลิกเพื่อเปิด Modal แสดงเมลเต็ม 
                        */}
                        <div 
                          className="w-full px-1 cursor-pointer lg:cursor-default" 
                          onClick={() => handleEmailMobileClick(item.email)}
                        >
                          <div className="tooltip lg:tooltip-bottom w-full before:text-[10px]" data-tip={item.email}>
                            <h3 className={`font-bold text-slate-800 truncate whitespace-nowrap overflow-hidden ${
                                isDesktopSidebarOpen ? "text-[10px] mb-1" : "text-sm mb-2"
                            }`}>
                                {item.email}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="lg:hidden mt-2 w-full px-2 flex flex-wrap gap-2 justify-center items-center">
                            {userRoles.length > 0 && (
                                <span className="inline-block align-middle text-indigo-600 font-bold text-[10px] uppercase tracking-wider bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 truncate max-w-[80%]">
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}
                            {userRoles.length > 1 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); // กันไม่ให้ไป trigger คลิกเมล
                                        setRoleModalData(userRoles);
                                        document.getElementById('role_modal').showModal();
                                    }}
                                    className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm shrink-0"
                                >
                                    +{userRoles.length - 1} more
                                </button>
                            )}
                        </div>

                        <div className="hidden lg:flex flex-nowrap gap-2 justify-center items-center mt-2 w-full px-1">
                            {userRoles.length > 0 && (
                                <span className={`inline-block font-bold uppercase tracking-wider bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 truncate ${
                                    isDesktopSidebarOpen 
                                        ? "text-[9px] px-2 py-0.5 max-w-[100px]" 
                                        : "text-[10px] px-3 py-1 max-w-[140px]" 
                                }`}>
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}
                            {userRoles.length > 1 && (
                                <div className="tooltip tooltip-bottom z-50 flex-shrink-0 before:max-w-[12rem] before:whitespace-normal before:text-center before:content-[attr(data-tip)]" 
                                     data-tip={userRoles.slice(1).map(r => r.replace(/_/g, ' ')).join(', ')}>
                                    <span className={`cursor-help text-slate-500 font-bold tracking-wider bg-slate-100 rounded-full whitespace-nowrap border border-slate-200 hover:bg-slate-200 transition-colors flex-shrink-0 ${
                                        isDesktopSidebarOpen 
                                            ? "text-[9px] px-2 py-0.5" 
                                            : "text-[10px] px-2.5 py-1"
                                    }`}>
                                        +{userRoles.length - 1} more
                                    </span>
                                </div>
                            )}
                        </div>
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
                    <button onClick={() => document.getElementById('add_admin_modal').close()} className="btn btn-sm btn-circle btn-ghost text-slate-400 bg-slate-100 hover:bg-slate-200">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleAddEmail} className="flex flex-col gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text font-bold text-slate-700">Email Address</span></label>
                        <label className="input input-bordered h-12 flex items-center gap-2 bg-slate-50 border-slate-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl">
                            <Mail size={18} className="opacity-50 flex-shrink-0" />
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
                            <option value="editor_manage_org">Admin ORG</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4 h-12 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200 text-white" disabled={isSubmitting}>
                            {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : "Confirm"}
                    </button>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
        </dialog>

        {/* --- ROLE VIEW MODAL --- */}
        <dialog id="role_modal" className="modal modal-bottom sm:modal-middle z-[9999]">
            <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">All Roles</h3>
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost text-slate-400 bg-slate-100 hover:bg-slate-200">
                           <X size={16} />
                        </button>
                    </form>
                </div>
                
                <div className="flex flex-wrap gap-2 content-start">
                    {roleModalData && roleModalData.map((role, idx) => (
                        <span key={idx} className="text-indigo-600 font-bold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 w-full text-center sm:w-auto">
                            {role.replace(/_/g, ' ')}
                        </span>
                    ))}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
        </dialog>

        {/* ✅ ✅ NEW: MODAL สำหรับแสดงเมลเต็มบนมือถือ (ต่อท้ายสุด) ✅ ✅ */}
        <dialog id="email_mobile_modal" className="modal modal-bottom sm:modal-middle z-[99999]">
            <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl text-center">
                <h3 className="font-bold text-lg text-slate-400 mb-2 uppercase tracking-widest text-xs">Email Address</h3>
                <p className="text-slate-800 font-bold text-xl break-all">{selectedEmailForMobile}</p>
                <div className="modal-action justify-center mt-6">
                    <form method="dialog">
                        <button className="btn btn-primary rounded-xl px-10 text-white font-bold h-12 shadow-lg shadow-indigo-100">ปิด</button>
                    </form>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
        </dialog>

    </div>
  );
}