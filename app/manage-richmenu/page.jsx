'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/firebaseConfig'; // Import db
import { doc, setDoc, serverTimestamp } from "firebase/firestore"; // Import firestore functions
import '@fortawesome/fontawesome-free/css/all.css';
import { 
  LogOut, 
  Menu, 
  X, 
  Mail, 
  Briefcase, 
  LayoutGrid, 
  Users, 
  Settings,   
  Trash2,    
  Plus,     
  CheckCircle,
  AlertCircle,
  Loader2,
  Image 
} from 'lucide-react';
import './richmenu-home.css';

function BotCard({ bot, currentMenuId, isActive }) {
  // ฟังก์ชันดึงรูป Avatar (ยกมาจากไฟล์เดิมเพื่อให้แสดงรูปจาก DB/Fallback ได้)
  const getAvatarUrl = (bot) => {
    if (bot.pictureUrl) return bot.pictureUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(bot.name)}&background=0D9&color=fff&size=128`;
  };

  return (
    <Link href={`/manage-richmenu/${bot.key}`} className="block group cursor-pointer">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group-hover:shadow-md transition-all duration-300 group-hover:border-green-300 group-hover:shadow-green-100">
        <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6">
          
          {/* Left: Bot Info */}
          <div className="flex items-center gap-4 min-w-[220px]">
            <div className="relative shrink-0">
              {/* Avatar - ดึงรูปจาก Database จริง */}
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                 <img 
                    src={getAvatarUrl(bot)} 
                    alt={bot.name} 
                    className="w-full h-full object-cover"
                  />
              </div>
              
              {/* Status Indicator */}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                 {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
              </div>
            </div>
            
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{bot.name}</h3>
              {/* <p className="text-xs text-slate-400 font-mono mt-0.5">{bot.key}</p> */}
              {isActive ? (
                 <span className="inline-block mt-1 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  ID: {currentMenuId.substring(0, 12)}...
                </span>
              ) : (
                <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  ยังไม่ได้ตั้งค่า
                </span>
              )}
            </div>
          </div>

          {/* Middle: Rich Menu Preview (ดึงภาพจาก API จริง) */}
          <div className="flex-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}></span>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                เมนูที่ใช้งานอยู่
              </h4>
            </div>

            <div className="w-full max-w-[280px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm relative">
                {isActive ? (
                    <img
                      src={`/api/richmenu/image?botKey=${bot.key}&menuId=${currentMenuId}`}
                      alt="Current Menu"
                      className="max-w-full h-auto"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-2 w-full h-full bg-slate-50 min-h-[80px]">
                     <AlertCircle size={16} />
                     <span className="text-[10px]">ยังไม่ได้เลือกเมนู</span>
                  </div>
                )}
            </div>
          </div>

          {/* Right: Action Button - Now part of the card link */}
          <div className="w-full md:w-auto flex flex-col justify-center ml-auto">
            <div
              className="flex items-center justify-center gap-2 bg-slate-900 group-hover:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap group-hover:shadow-lg group-hover:shadow-green-500/20"
            >
              <Settings size={16} />
              <span>จัดการ Menu</span>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}

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
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);
  const [currentRoles, setCurrentRoles] = useState([]); 

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;


  // --- State สำหรับระบบ Config Bot ---
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [customBots, setCustomBots] = useState([]); // สำหรับแสดงรายการใน Modal
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [newBotData, setNewBotData] = useState({ name: '', key: '', token: '', pictureUrl: '' });

  // ฟังก์ชัน Reset Form
  const resetConfigForm = () => {
    setNewBotData({ name: '', key: '', token: '', pictureUrl: '' });
    setVerifyError(null);
    setManualEntryMode(false);
  };

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
  // ✅ เพิ่มสิทธิ์สำหรับเมนู ORG
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  const getMenuClass = (targetPath) => {
      const isActive = pathname === targetPath;
      return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
        isActive 
          ? "bg-[#111827] !text-white shadow-lg shadow-slate-300 scale-[1.02]" 
          : "text-slate-900 hover:bg-slate-50 "
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

  const fetchAdmins = async () => {
    if (!API_URL_ADMIN) return;
    const currentAdminId = getCurrentAdminId();
    try {
      const url = currentAdminId ? `${API_URL_ADMIN}?requester_id=${currentAdminId}` : API_URL_ADMIN;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admins");
      const jsonResponse = await res.json();
      const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);
      if (currentAdminId && data.length > 0) {
        const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
        if (myProfile) {
            let roles = [];
            if (Array.isArray(myProfile.roles)) { roles = myProfile.roles; }
            else if (myProfile.role) { roles = [myProfile.role]; }
            setCurrentRoles(roles);
        }
      }
    } catch (error) { console.error("Error loading admins:", error); }
  };

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
    // ดึงข้อมูลบอททั้งหมดจากฐานข้อมูล PostgreSQL ผ่าน API
    const botsRes = await fetch('/api/richmenu/bots');
    const botsData = await botsRes.json();
    
    if (Array.isArray(botsData)) {
      // 1. อัปเดต State bots ด้วยข้อมูลจาก DB โดยตรง
      setBots(botsData);
      
      // 2. ดึงสถานะเมนูของแต่ละบอท (ถ้ามี API แยก)
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
    }
  } catch (error) {
    console.error('Error fetching bots from DB:', error);
  } finally {
    setIsRefreshing(false);
  }
}

  // แก้ไขฟังก์ชัน handleVerifyAndAddBot ในไฟล์ page.jsx
const handleVerifyAndAddBot = async () => {
  setIsVerifying(true);
  setVerifyError(null);

  try {
    if (!newBotData.token) throw new Error("กรุณากรอก Channel Access Token");

    // --- ขั้นตอนที่ 1: ดึงข้อมูลบอทจาก LINE อัตโนมัติ ---
    const verifyRes = await fetch('/api/richmenu/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: newBotData.token })
    });

    const lineInfo = await verifyRes.json();

    if (!verifyRes.ok) throw new Error(lineInfo.message);

    // --- ขั้นตอนที่ 2: บันทึกลงฐานข้อมูล PostgreSQL ---
    const response = await fetch('/api/richmenu/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_name: lineInfo.name,      // ได้จาก LINE อัตโนมัติ
        bot_key: lineInfo.key,        // ได้จาก LINE อัตโนมัติ
        channel_token: newBotData.token,
        picture_url: lineInfo.pictureUrl, // ได้จาก LINE อัตโนมัติ
        creator_id: user.uid
      })
    });

    if (!response.ok) {
      const dbError = await response.json();
      throw new Error(dbError.message || "ไม่สามารถบันทึกลงฐานข้อมูลได้");
    }

    // สำเร็จ: รีโหลดข้อมูลใหม่จาก DB
    await fetchBotsData();
    setIsConfigModalOpen(false);
    resetConfigForm();
    alert(`เพิ่มบอท "${lineInfo.name}" เรียบร้อยแล้ว!`);

  } catch (err) {
    console.error("Error adding bot:", err);
    setVerifyError(err.message);
  } finally {
    setIsVerifying(false);
  }
};

  const handleDeleteCustomBot = async (bot) => {
    // 1. ถามเพื่อยืนยันการลบ
    if (!confirm(`คุณต้องการลบบอท "${bot.name}" ใช่หรือไม่?`)) return;

    try {
      // 2. ลบออกจาก Database ผ่าน API (ถ้ามี ID)
      if (bot.id) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL}/delete-bot`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: bot.id })
        });

        if (!response.ok) throw new Error("ไม่สามารถลบข้อมูลจาก Database ได้");
      }

      // 3. ลบออกจาก LocalStorage
      const savedCustomBots = JSON.parse(localStorage.getItem('custom_bots_config') || '[]');
      const updatedLocalStorage = savedCustomBots.filter(b => b.key !== bot.key);
      localStorage.setItem('custom_bots_config', JSON.stringify(updatedLocalStorage));

      // 4. อัปเดต State ในหน้าจอ (UI)
      setCustomBots(prev => prev.filter(b => b.key !== bot.key)); // ลบใน Modal
      setBots(prev => prev.filter(b => b.key !== bot.key));       // ลบในหน้าหลัก

      alert("ลบบอทเรียบร้อยแล้ว");
    } catch (err) {
      console.error("Delete error:", err);
      alert("เกิดข้อผิดพลาดในการลบ: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('current_admin_id');
      router.push('/');
    } catch (error) { console.error('Logout error:', error); }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      {/* Navbar Mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F4F6F8]/95 backdrop-blur-sm z-40 px-5 flex justify-between items-center border-b border-slate-200/50">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="btn btn-square btn-ghost btn-sm text-slate-800">
                  <Menu size={24} />
              </button>
              <h1 className="font-bold text-slate-800 text-lg">Rich Menu</h1>
           </div>
      </div>

     {/* Mobile Sidebar */}
     {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-6 animate-slide-in-left rounded-r-[2rem]">
                <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"><X size={20} /></button>
                <div className="flex flex-col items-center text-center mb-8 mt-6">
                      <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                            <img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full"/>
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
                    {/* ✅ เพิ่มเมนู ORG Mobile */}
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

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2rem] shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-8 px-6 z-50 overflow-y-auto no-scrollbar transition-all duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
          <button onClick={() => setIsDesktopSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all duration-200"><X size={20} /></button>
          <div className="flex flex-col items-center text-center mb-10 mt-2">
              <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-slate-200 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-50"><img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full"/></div>
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
              {/* ✅ เพิ่มเมนู ORG Desktop */}
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

      <div className={`mt-16 lg:mt-0 pt-0 lg:pt-6 transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30 animate-slide-in-left">
                <button onClick={() => setIsDesktopSidebarOpen(true)} className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"><Menu size={24} /></button>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Rich Menu</h1>
             </div>
        )}

        <div className={`max-w-4xl w-full mx-auto px-4 lg:py-8 transition-all duration-300 ${!isDesktopSidebarOpen ? 'lg:mt-24' : ''}`}>
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">จัดการ Menu</h1>
              <p className="text-slate-500 mt-1.5 text-sm font-medium">เลือกบอทเพื่อจัดการเมนู LINE Official Account ของคุณ</p>
            </div>
            
            <button 
              onClick={() => { resetConfigForm(); setIsConfigModalOpen(true); }}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_25px_-10px_rgba(79,70,229,0.5)] active:scale-95 w-fit">
              <div className="bg-white/20 p-1 rounded-lg">
                <Plus size={18} strokeWidth={3} />
              </div>
              <span>เพิ่ม/ตั้งค่าบอท</span>
            </button>
          </div>

          {/* Bot Card List */}
          <div className="grid gap-4">
            {isRefreshing ? (
              <div className="flex justify-center items-center py-12 text-slate-400">
                <Loader2 className="animate-spin mr-2" /> กำลังโหลดข้อมูล...
              </div>
            ) : (
              bots.map((bot) => {
                // ดึงสถานะเมนูปัจจุบันจาก State currentMenus ของเดิม
                const currentMenuId = currentMenus[bot.key];
                const isActive = !!currentMenuId;
                
                return (
                  <BotCard 
                    key={bot.key}
                    bot={bot}
                    currentMenuId={currentMenuId}
                    isActive={isActive}
                  />
                );
              })
            )}
            
            {/* ส่วน Empty State กรณีไม่มีบอท (จากไฟล์เดิม) */}
            {!isRefreshing && bots.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 text-slate-300">
                      <LayoutGrid size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700">ไม่พบบอทในระบบ</h3>
                  <p className="text-slate-400 text-sm mt-1">เพิ่มบอทของคุณเพื่อเริ่มใช้งาน</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Config Modal (วางไว้นอกสุดของ return) --- */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsConfigModalOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                            <Settings className="w-5 h-5 text-indigo-600" />
                        </div>
                        ตั้งค่าบอท
                    </h3>
                    <button onClick={() => setIsConfigModalOpen(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto bg-slate-50/30">
                    {/* List Custom Bots */}
                    <div className="mb-6 space-y-3">
                        {customBots.map((bot, idx) =>  (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 p-0.5 border border-slate-200 overflow-hidden shrink-0">
                                        <img src={getAvatarUrl(bot)} className="w-full h-full object-cover rounded-md" alt="" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-slate-800 truncate">{bot.name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono tracking-tight truncate max-w-[150px]">{bot.key}</div>
                                    </div>
                                </div>
                                
                                {/* แก้ไขปุ่มตรงนี้ */}
                                <button 
                                    onClick={() => handleDeleteCustomBot(bot)} 
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="ลบบอท"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            ))
                        }
                    </div>

                    {/* Add New Bot Form */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                        <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Plus className="w-4 h-4 text-green-500" />
                            เพิ่มบอทที่มีอยู่แล้ว
                        </div>
                        <div className="space-y-4">
                            {/* ตัวอย่างการปรับ UI ในไฟล์ page.jsx บริเวณ Form เพิ่มบอท */}
                          <div>
                              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Channel Access Token</label>
                              <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-xs font-mono h-20 leading-relaxed transition-all outline-none resize-none" 
                                  placeholder="วาง Token แล้วกดปุ่มตรวจสอบ..."
                                  value={newBotData.token} 
                                  onChange={(e) => setNewBotData({...newBotData, token: e.target.value})} 
                              />
                          </div>

                          {/* แสดงตัวอย่างข้อมูลที่ดึงมาได้ (Optional) */}
                          {newBotData.name && (
                              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 animate-fade-in">
                                  <img src={newBotData.pictureUrl} className="w-10 h-10 rounded-full border" alt="" />
                                  <div>
                                      <div className="text-xs font-bold text-green-700">{newBotData.name}</div>
                                      <div className="text-[10px] text-green-600">{newBotData.key}</div>
                                  </div>
                              </div>
                          )}

                            {manualEntryMode && (
                                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">ชื่อบอท</label>
                                        <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-sm transition-all outline-none" 
                                            value={newBotData.name} onChange={(e) => setNewBotData({...newBotData, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">LINE ID</label>
                                        <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg text-sm font-mono transition-all outline-none" 
                                            value={newBotData.key} onChange={(e) => setNewBotData({...newBotData, key: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <button 
                              onClick={handleVerifyAndAddBot}
                              disabled={!newBotData.token || isVerifying}
                              className={`w-full py-3.5 rounded-2xl mt-2 transition-all shadow-lg flex items-center justify-center gap-2 font-bold text-sm
                                  ${(!newBotData.token || isVerifying) 
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}
                              `}>
                              {isVerifying ? (
                                  <>
                                      <Loader2 size={18} className="animate-spin" />
                                      กำลังตรวจสอบ...
                                  </>
                              ) : (
                                  <>
                                      <CheckCircle size={18} /> 
                                      ตรวจสอบ & เพิ่มบอท
                                  </>
                              )}
                            </button>

                          {/* แสดง Error ถ้ามี */}
                          {verifyError && (
                              <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-medium animate-shake">
                                  <AlertCircle size={14} />
                                  {verifyError}
                              </div>
                          )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      </div>
  );
}