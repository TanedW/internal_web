'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig'; 
import '@fortawesome/fontawesome-free/css/all.css';
import Sidebar from "../components/sidebar";
import { 
  Menu, 
  X, 
  Settings,   
  Trash2,    
  Plus,     
  CheckCircle,
  AlertCircle,
  Loader2,
  LayoutGrid
} from 'lucide-react';
import './richmenu-home.css';

// --- BotCard Component ---
function BotCard({ bot, currentMenuId, isActive }) {
  const getAvatarUrl = (bot) => {
    if (bot.pictureUrl) return bot.pictureUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(bot.name)}&background=0D9&color=fff&size=128`;
  };

  return (
    <Link href={`/manage-richmenu/${bot.key}`} className="block group cursor-pointer">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group-hover:shadow-md transition-all duration-300 group-hover:border-green-300 group-hover:shadow-green-100">
        <div className="p-5 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4 min-w-[220px]">
            <div className="relative shrink-0">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                 <img src={getAvatarUrl(bot)} alt={bot.name} className="w-full h-full object-cover" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${isActive ? 'bg-green-500' : 'bg-red-500'}`}>
                 {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{bot.name}</h3>
              {isActive ? (
                 <span className="inline-block mt-1 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  ID: {currentMenuId.substring(0, 12)}...
                </span>
              ) : (
                <span className="inline-block mt-1 text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">ยังไม่ได้ตั้งค่า</span>
              )}
            </div>
          </div>
          <div className="flex-1 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}></span>
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">เมนูที่ใช้งานอยู่</h4>
            </div>
            <div className="w-full max-w-[280px] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm relative">
                {isActive ? (
                    <img src={`/api/richmenu/image?botKey=${bot.key}&menuId=${currentMenuId}`} alt="Current Menu" className="max-w-full h-auto" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-2 w-full h-full bg-slate-50 min-h-[80px]">
                     <AlertCircle size={16} />
                     <span className="text-[10px]">ยังไม่ได้เลือกเมนู</span>
                  </div>
                )}
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col justify-center ml-auto">
            <div className="flex items-center justify-center gap-2 bg-slate-900 group-hover:bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm">
              <Settings size={16} />
              <span>จัดการ Menu</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// --- Main Page Component ---
export default function RichMenuHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [bots, setBots] = useState([]);
  const [currentMenus, setCurrentMenus] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [newBotData, setNewBotData] = useState({ name: '', key: '', token: '', pictureUrl: '' });

  const resetConfigForm = () => {
    setNewBotData({ name: '', key: '', token: '', pictureUrl: '' });
    setVerifyError(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
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
        const menusData = {};
        for (const bot of botsData) {
          try {
            const menuRes = await fetch(`/api/richmenu/current?botKey=${bot.key}`);
            const menuData = await menuRes.json();
            menusData[bot.key] = menuData.currentMenuId || null;
          } catch (err) { console.error(err); }
        }
        setCurrentMenus(menusData);
      }
    } catch (error) { console.error(error); } finally { setIsRefreshing(false); }
  }

  const handleVerifyAndAddBot = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const verifyRes = await fetch('/api/richmenu/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newBotData.token })
      });
      const lineInfo = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(lineInfo.message);

      const response = await fetch('/api/richmenu/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_name: lineInfo.name,
          bot_key: lineInfo.key,
          channel_token: newBotData.token,
          picture_url: lineInfo.pictureUrl,
          creator_id: user.uid
        })
      });
      if (!response.ok) throw new Error("ไม่สามารถบันทึกลงฐานข้อมูลได้");

      await fetchBotsData();
      setIsConfigModalOpen(false);
      resetConfigForm();
      alert(`เพิ่มบอท "${lineInfo.name}" เรียบร้อยแล้ว!`);
    } catch (err) { setVerifyError(err.message); } finally { setIsVerifying(false); }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      {/* 1. เรียกใช้ Sidebar Component ที่ Import มา */}
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      {/* 2. ส่วนเนื้อหาหลัก ปรับ Padding ตามสถานะ Sidebar */}
      <main className={`transition-all duration-300 pt-16 lg:pt-0 ${isDesktopSidebarOpen ? "lg:pl-72" : "lg:pl-0"}`}>
        
        {/* Header สำหรับเปิด Sidebar เมื่อปิดอยู่ */}
        {!isDesktopSidebarOpen && (
          <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30">
            <button onClick={() => setIsDesktopSidebarOpen(true)} className="p-2 bg-white rounded-xl shadow-md border border-slate-200">
              <Menu size={24} />
            </button>
          </div>
        )}

        <div className="max-w-4xl w-full mx-auto px-4 py-8">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">จัดการ Menu</h1>
              <p className="text-slate-500 mt-1.5 text-sm font-medium">เลือกบอทเพื่อจัดการเมนู LINE Official Account ของคุณ</p>
            </div>
            
            <button 
              onClick={() => { resetConfigForm(); setIsConfigModalOpen(true); }}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg w-fit">
              <Plus size={18} />
              <span>เพิ่ม/ตั้งค่าบอท</span>
            </button>
          </div>

          <div className="grid gap-4">
            {isRefreshing ? (
              <div className="flex justify-center items-center py-12 text-slate-400">
                <Loader2 className="animate-spin mr-2" /> กำลังโหลดข้อมูล...
              </div>
            ) : (
              bots.map((bot) => (
                <BotCard key={bot.key} bot={bot} currentMenuId={currentMenus[bot.key]} isActive={!!currentMenus[bot.key]} />
              ))
            )}
            
            {!isRefreshing && bots.length === 0 && (
              <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                  <LayoutGrid size={32} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-bold text-slate-700">ไม่พบบอทในระบบ</h3>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Modal สำหรับเพิ่มบอท */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsConfigModalOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">ตั้งค่าบอท</h3>
                    <button onClick={() => setIsConfigModalOpen(false)}><X size={20} /></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <div className="space-y-4">
                          <div>
                              <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Channel Access Token</label>
                              <textarea className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs h-20 outline-none" 
                                  placeholder="วาง Token แล้วกดปุ่มตรวจสอบ..."
                                  value={newBotData.token} 
                                  onChange={(e) => setNewBotData({...newBotData, token: e.target.value})} 
                              />
                          </div>

                          <button 
                            onClick={handleVerifyAndAddBot}
                            disabled={!newBotData.token || isVerifying}
                            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 
                              ${(!newBotData.token || isVerifying) ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-lg'}
                            `}>
                            {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                            {isVerifying ? "กำลังตรวจสอบ..." : "ตรวจสอบ & เพิ่มบอท"}
                          </button>

                          {verifyError && (
                              <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs">
                                  <AlertCircle size={14} /> {verifyError}
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