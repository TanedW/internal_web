'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { LogOut, Menu, X, Mail, Briefcase, LayoutGrid, Users } from 'lucide-react';
import './richmenu-home.css';

// ✅ นำเข้า Sidebar จากไฟล์ภายนอก
import Sidebar from "../components/sidebar"; 

export default function RichMenuHome() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- State Rich Menu Logic (คงไว้เดิมเป๊ะ) ---
  const [bots, setBots] = useState([]);
  const [currentMenus, setCurrentMenus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // --- State Sidebar & Role (สำหรับส่งต่อให้ Sidebar Component) ---
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [currentRoles, setCurrentRoles] = useState([]); 

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // --- Helpers (คงไว้เดิมเป๊ะ) ---
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
          } catch (err) { console.error(`Error fetching menu for ${bot.key}:`, err); }
        }
        setCurrentMenus(menusData);
        localStorage.setItem('cachedMenus', JSON.stringify(menusData));
      }
    } catch (error) { console.error('Error fetching bots:', error); }
    finally { setIsRefreshing(false); }
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      
      {/* ✅ เรียกใช้ Sidebar คอมโพเนนต์ภายนอกเพียงจุดเดียว (แทนที่ Mobile/Desktop Sidebar เดิม) */}
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      {/* ================= MAIN CONTENT ================= */}
      {/* ปรับ pl ตามสถานะ Sidebar เพื่อความสวยงาม */}
      <div className={`mt-16 lg:mt-0 pt-0 lg:pt-6 transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30 animate-slide-in-left">
                <button onClick={() => setIsDesktopSidebarOpen(true)} className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300">
                    <Menu size={24} />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Rich Menu</h1>
             </div>
        )}

        {/* เนื้อหาเดิมส่วนที่เหลือ (Bots Grid) ห้ามแก้ไข */}
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
                  <div key={bot.key} className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div className="relative shrink-0">
                        <img src={getAvatarUrl(bot)} alt={bot.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      <div className="text-center sm:text-left">
                        <h2 className="text-lg font-semibold text-slate-800 group-hover:text-green-600 transition-colors">{bot.name}</h2>
                        <div className="mt-1 flex flex-wrap justify-center sm:justify-start gap-2">
                          {isActive ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">ใช้งานอยู่</span>
                              <span className="text-xs text-slate-400">ID: {currentMenu.substring(0, 12)}...</span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">ยังไม่ได้ตั้งค่า</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link href={`/manage-richmenu/${bot.key}`} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-green-600 !text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-green-500/30">
                      <i className="fa-solid fa-gear"></i>จัดการเมนู
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200"><p className="text-slate-500 text-lg">ไม่พบบอท</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}