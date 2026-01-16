'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';

export default function RichMenuHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bots, setBots] = useState([]);
  const [currentMenus, setCurrentMenus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      
      // โหลดจาก cache ก่อน
      const cachedBots = localStorage.getItem('cachedBots');
      const cachedMenus = localStorage.getItem('cachedMenus');
      
      if (cachedBots) {
        setBots(JSON.parse(cachedBots));
      }
      if (cachedMenus) {
        setCurrentMenus(JSON.parse(cachedMenus));
      }
      
      setLoading(false);
      
      // รีเฟรชข้อมูลในพื้นหลัง
      fetchBotsData();
    } else {
      router.push('/');
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

  const getAvatarUrl = (bot) => {
    if (bot.pictureUrl) return bot.pictureUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(bot.name)}&background=0D9&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24 lg:pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-50 px-4 flex justify-between items-center border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-9 h-9 rounded-full ring ring-offset-2 ring-indigo-50">
              <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName}`} alt="User" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-bold text-slate-800 text-sm truncate max-w-[160px]">{user?.displayName || 'Admin User'}</span>
            <span className="text-[10px] text-indigo-500 font-bold uppercase">SYSTEM ADMIN</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-circle btn-sm hover:bg-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)] bg-white">
        <div className="flex w-full h-16 border-t border-gray-100">
          <Link href="/manage" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            <span className="text-[10px] font-bold">Email</span>
          </Link>
          <Link href="/manage-case" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <span className="text-[10px] font-bold">Case</span>
          </Link>
          <Link href="/manage-richmenu" className="flex-1 flex flex-col items-center justify-center gap-1 text-indigo-600 bg-indigo-50/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path></svg>
            <span className="text-[10px] font-bold">Menu</span>
          </Link>
        </div>
      </div>

      {/* ================= NAVBAR DESKTOP ================= */}
      <div className="hidden lg:block sticky top-0 z-40 font-sans">
        <div className="navbar bg-white/95 backdrop-blur-xl px-6 lg:px-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border-b border-slate-50/50 transition-all py-3">
          <div className="navbar-start">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="avatar">
                <div className="w-11 h-11 rounded-full ring-[3px] ring-primary/20 ring-offset-[3px] ring-offset-white transition-all group-hover:ring-primary/40">
                  <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName}`} alt="User" className="object-cover" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-800 text-[15px] tracking-tight leading-tight">{user?.displayName || 'Admin'}</span>
                <span className="text-[11px] font-bold text-primary/70 uppercase tracking-wider">System Admin</span>
              </div>
            </div>
          </div>

          <div className="navbar-center">
            <ul className="menu menu-horizontal px-1 gap-2 font-medium text-sm bg-slate-50/80 p-1.5 rounded-full border border-slate-100/50">
              <li>
                <Link href="/manage" className="text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-full px-5 py-2 transition-all">
                  จัดการ Email
                </Link>
              </li>
              <li>
                <Link href="/manage-case" className="text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-full px-5 py-2 transition-all">
                  จัดการ Case
                </Link>
              </li>
              <li>
                <Link href="/manage-richmenu" className="!bg-white !text-primary shadow-sm shadow-slate-200/50 rounded-full px-5 py-2 font-bold transition-all transform hover:-translate-y-0.5">
                  จัดการ Menu
                </Link>
              </li>
            </ul>
          </div>

          <div className="navbar-end">
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
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="mt-16 lg:mt-0 pt-0 lg:pt-6">
        <div className="max-w-4xl w-full mx-auto px-4">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <i className="fa-brands fa-line text-green-500 text-4xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-slate-800">Rich Menu Manager</h1>
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
    </div>
  );
}