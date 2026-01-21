'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { LogOut, Menu, X, Mail, Briefcase, LayoutGrid } from 'lucide-react';

export default function RichMenuHome() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- State Rich Menu Logic ---
  const [bots, setBots] = useState([]);
  const [currentMenus, setCurrentMenus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // --- State Sidebar & Role ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State สำหรับ Desktop Sidebar (Toggle)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  // ✅ State สำหรับ Toggle การแสดง Role (Sidebar)
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  const [currentRoles, setCurrentRoles] = useState([]); 

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // --- Helpers ---
  const getAvatarUrl = (bot) => {
    if (bot.pictureUrl) return bot.pictureUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(bot.name)}&background=0D9&color=fff&size=128`;
  };

  const getUserAvatar = (u) => {
      return u?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.displayName || 'Admin'}`;
  };

  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
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

  // ✅ Component SidebarRoleDisplay
  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
        {currentRoles.length > 0 ? (
            <>
                {/* --- 1. Expanded --- */}
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
                    /* --- 2. Collapsed --- */
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

  const fetchAdmins = async () => {
    if (!API_URL_ADMIN) return;
    const currentAdminId = getCurrentAdminId();

    try {
      const url = currentAdminId 
        ? `${API_URL_ADMIN}?requester_id=${currentAdminId}` 
        : API_URL_ADMIN;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admins");
      
      const jsonResponse = await res.json();
      const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);

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

  // --- Main Logic ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const cachedBots = localStorage.getItem('cachedBots');
        if (cachedBots) setBots(JSON.parse(cachedBots));
        const cachedMenus = localStorage.getItem('cachedMenus');
        if (cachedMenus) setCurrentMenus(JSON.parse(cachedMenus));
        
        setLoading(false);
        fetchBotsData();
        fetchAdmins();
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function fetchBotsData() {
    setIsRefreshing(true);
    try {
      const botsRes = await fetch('/api/richmenu/bots');
      const botsData = await botsRes.json();
      if (Array.isArray(botsData)) {
        setBots(botsData);
        localStorage.setItem('cachedBots', JSON.stringify(botsData));
        const menusData = {};
        for (const bot of botsData) {
          try {
            const menuRes = await fetch(`/api/richmenu/current?botKey=${bot.key}`);
            const menuData = await menuRes.json();
            menusData[bot.key] = menuData.currentMenuId || null;
          } catch (err) {
            console.error(`Error fetching menu for ${bot.key}:`, err);
          }
        }
        setCurrentMenus(menusData);
        localStorage.setItem('cachedMenus', JSON.stringify(menusData));
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('current_admin_id');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE HEADER ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F4F6F8]/95 backdrop-blur-sm z-40 px-5 flex justify-between items-center border-b border-slate-200/50">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="btn btn-square btn-ghost btn-sm text-slate-800">
                  <Menu size={24} />
              </button>
              <h1 className="font-bold text-slate-800 text-lg">Rich Menu</h1>
           </div>
      </div>

     {/* ================= MOBILE SIDEBAR DRAWER ================= */}
     {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-6 animate-slide-in-left rounded-r-[2rem]">
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center mb-8 mt-6">
                      <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                            <img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full"/>
                        </div>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800 break-words w-full px-2">{user?.displayName || "Admin"}</h2>
                      
                      {/* ✅ เรียกใช้ SidebarRoleDisplay (Mobile) */}
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
               <X size={20} />
           </button>

          <div className="flex flex-col items-center text-center mb-10 mt-2">
              <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-slate-200 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                      <img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full"/>
                  </div>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 px-2 break-words w-full">{user?.displayName || "Admin"}</h2>
              
              {/* ✅ เรียกใช้ SidebarRoleDisplay (Desktop) */}
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
          </div>

          <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200">
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
          </button>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className={`mt-16 lg:mt-0 pt-0 lg:pt-6 transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {/* ✅ ปุ่ม Open Sidebar พร้อมข้อความ "Rich Menu" */}
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30 animate-slide-in-left">
                <button 
                    onClick={() => setIsDesktopSidebarOpen(true)}
                    className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"
                    title="Open Sidebar"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">
                    Rich Menu
                </h1>
             </div>
        )}

        <div className={`max-w-4xl w-full mx-auto px-4 lg:py-8 transition-all duration-300 ${!isDesktopSidebarOpen ? 'lg:mt-24' : ''}`}>
          
          <div className="mb-10 text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4 lg:hidden">
                <i className="fa-brands fa-line text-green-500 text-4xl"></i>
              </div>
              <p className="text-slate-500 mt-2">เลือกบอทเพื่อจัดการเมนู LINE Official Account</p>
          </div>

          <div className="grid gap-4">
            {bots.length > 0 ? (
              bots.map((bot) => {
                const currentMenu = currentMenus[bot.key];
                const isActive = !!currentMenu;

                return (
                  <div
                    key={bot.key}
                    className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-6"
                  >
                    {/* ====== Left: Avatar + Info ====== */}
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="relative shrink-0">
                        <img
                          src={getAvatarUrl(bot)}
                          alt={bot.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                        />
                        {isActive ? (
                          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-green-500"></div>
                        ) : (
                          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-red-500"></div>
                        )}
                      </div>

                      <div className="text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <h2 className="text-lg font-semibold text-slate-800 group-hover:text-green-600 transition-colors">{bot.name}</h2>
                        </div>
                        <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-2">
                          {isActive ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                ใช้งานอยู่
                              </span>
                              <span className="text-xs text-slate-400">
                                ID: {currentMenu.substring(0, 12)}...
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                              ยังไม่ได้ตั้งค่า
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ====== Right: Action Button ====== */}
                    <Link
                      href={`/manage-richmenu/${bot.key}`}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-green-600 !text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-green-500/30"
                    >
                      <i className="fa-solid fa-gear"></i>
                      จัดการเมนู
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-500 text-lg">ไม่พบบอท</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}