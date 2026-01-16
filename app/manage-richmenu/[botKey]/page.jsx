'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { LogOut } from 'lucide-react'; // เพิ่ม import ไอคอน

export default function RichMenuDashboard() {
  const params = useParams();
  const router = useRouter();
  const botKey = params.botKey;

  const [user, setUser] = useState(null);
  const [bot, setBot] = useState(null);
  const [menus, setMenus] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [menuName, setMenuName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDisplay, setFileDisplay] = useState('');
  const [showAllMenus, setShowAllMenus] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Helper function for Avatar
  const getAvatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Admin')}&background=0D9&color=fff&size=128`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData();
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [botKey, router]);

  async function fetchData() {
    try {
      const botRes = await fetch(`/api/richmenu/bot?key=${botKey}`);
      const botData = await botRes.json();
      
      if (!botData || botData.error) {
        router.push('/manage-richmenu');
        return;
      }
      setBot(botData);

      const currentRes = await fetch(`/api/richmenu/current?botKey=${botKey}`);
      const currentData = await currentRes.json();
      setCurrentMenuId(currentData.currentMenuId || null);

      const listRes = await fetch(`/api/richmenu/list?botKey=${botKey}`);
      const listData = await listRes.json();

      if (listData.richmenus && Array.isArray(listData.richmenus)) {
        const sorted = [...listData.richmenus].sort((a, b) => {
          if (a.richMenuId === currentData.currentMenuId) return -1;
          if (b.richMenuId === currentData.currentMenuId) return 1;
          return 0;
        });
        setMenus(sorted);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlert({ type: 'error', message: 'ไม่สามารถดึงข้อมูลได้' });
    }
  }

  function setupDragDrop() {
    const zone = dropZoneRef.current;
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');

      const files = e.dataTransfer?.files;
      if (files?.length) {
        const file = files[0];
        if (file.type.includes('image')) {
          setSelectedFile(file);
          setFileDisplay(`เลือกไฟล์: ${file.name}`);
        }
      }
    });
  }

  useEffect(() => {
    setupDragDrop();
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileDisplay(`เลือกไฟล์: ${file.name}`);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();

    if (!selectedFile) {
      setAlert({ type: 'error', message: 'กรุณาเลือกรูปภาพ' });
      return;
    }

    if (selectedFile.size > 1000000) {
      setAlert({ type: 'error', message: 'ไฟล์มีขนาดใหญ่เกิน 1MB' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('botKey', botKey);
      formData.append('menuName', menuName || `Traffy_${botKey}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}`);
      formData.append('menuImage', selectedFile);

      const response = await fetch('/api/richmenu/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const displayName = menuName || `Traffy_${botKey}`;
        setAlert({ type: 'success', message: `สร้างเมนู "${displayName}" สำเร็จ` });
        setMenuName('');
        setSelectedFile(null);
        setFileDisplay('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        await new Promise((resolve) => setTimeout(resolve, 1000));
        fetchData();
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถอัปโหลดเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + error.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleSwitch(menuId) {
    if (!confirm('ต้องการเปลี่ยนไปใช้เมนูนี้หรือไม่?')) return;

    try {
      const response = await fetch('/api/richmenu/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'เปลี่ยนเมนูสำเร็จ' });
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchData();
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถเปลี่ยนเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' });
    }
  }

  async function handleDelete(menuId) {
    if (!confirm('ยืนยันการลบเมนูนี้อย่างถาวร?')) return;

    try {
      const response = await fetch('/api/richmenu/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'ลบเมนูเรียบร้อยแล้ว' });
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchData();
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถลบเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' });
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

  const visibleMenus = showAllMenus ? menus : menus.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-32 lg:pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>
      
      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');
        .sarabun-font { font-family: 'Sarabun', sans-serif; }
        .alert { padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; font-size: 14px; animation: slideDown 0.3s ease-out; }
        .alert-success { background: #E8F5E9; color: #1B5E20; border: 1px solid #C8E6C9; }
        .alert-error { background: #FFEBEE; color: #B71C1C; border: 1px solid #FFCDD2; }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .dragover { background: #f0fdf4; border-color: #22c55e !important; }
        .menu-item.active { border: 1px solid #06C755; box-shadow: 0 0 0 1px #06C755; }
      `}</style>

      {/* ================= NAVBAR MOBILE (Bottom) ================= */}
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
          
          {/* Active State (Menu) -> สีเทาเข้ม bg-slate-200 */}
          <Link href="/manage-richmenu" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-900 bg-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path></svg>
            <span className="text-[10px] font-bold">Menu</span>
          </Link>
        </div>
      </div>

       {/* ================= NAVBAR MOBILE (Top) ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-50 px-4 flex justify-between items-center border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="avatar">
                  <div className="w-9 h-9 rounded-full ring ring-offset-2 ring-indigo-50">
                      <img src={user?.photoURL || getAvatarUrl(user?.displayName)} alt="User"/>
                  </div>
              </div>
              <div className="flex flex-col justify-center">
                  <span className="font-bold text-slate-800 text-sm truncate max-w-[160px]">{user?.displayName || "Admin User"}</span>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase">SYSTEM ADMIN</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-circle btn-sm hover:bg-red-50">
                <LogOut size={22} className="text-red-500" />
            </button>
      </div>

      {/* ================= NAVBAR DESKTOP ================= */}
      <div className="hidden lg:block sticky top-0 z-40 font-sans">
        <div className="navbar bg-white/95 backdrop-blur-xl px-6 lg:px-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border-b border-slate-50/50 transition-all py-3">
            <div className="navbar-start">
                <div className="flex items-center gap-3 group cursor-default">
                    <div className="avatar">
                        <div className="w-11 h-11 rounded-full ring-[3px] ring-primary/20 ring-offset-[3px] ring-offset-white transition-all group-hover:ring-primary/40">
                            <img src={user?.photoURL || getAvatarUrl(user?.displayName)} alt="User" className="object-cover"/>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 text-[15px] tracking-tight leading-tight">{user?.displayName || "Admin"}</span>
                        <span className="text-[11px] font-bold text-primary/70 uppercase tracking-wider">System Admin</span>
                    </div>
                </div>
            </div>
            
            <div className="navbar-center">
                <ul className="menu menu-horizontal px-1 gap-3">
                    <li><Link href="/manage" className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-full px-6 py-2.5 font-bold hover:shadow-md hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">จัดการ Email</Link></li>
                    <li><Link href="/manage-case" className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-full px-6 py-2.5 font-bold hover:shadow-md hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">จัดการ Case</Link></li>
                    <li><Link href="/manage-richmenu" className="!bg-slate-900 !text-white shadow-lg shadow-slate-400/50 rounded-full px-6 py-2.5 font-bold hover:!bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">จัดการ Menu</Link></li>
                </ul>
            </div>
            
            <div className="navbar-end">
                <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200">
                    <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                        <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                </button>
            </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="mt-16 lg:mt-0 pt-6">
        <div className="max-w-3xl w-full mx-auto px-4 sarabun-font">
          
          {/* Navigation Back Link */}
          <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
            <Link href="/manage-richmenu" className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center gap-2">
              <i className="fa-solid fa-arrow-left"></i> กลับหน้าเลือกบอท
            </Link>
            {bot && <div className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full">
              กำลังจัดการ: {bot.name}
            </div>}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Traffy Rich Menu Manager</h1>
            <p className="text-slate-500 text-sm">ระบบจัดการเมนู LINE Official Account</p>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`alert mb-6 ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              <i className={`fa-solid ${alert.type === 'success' ? 'fa-check' : 'fa-exclamation-circle'}`}></i>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Upload Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-200">
              สร้างเมนูใหม่ (Upload New)
            </h2>

            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ชื่อเมนู (Menu Name)
                </label>
                <input
                  type="text"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="ตั้งชื่อเมนู เช่น: เมนูหลัก 2024"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  disabled={uploading}
                />
              </div>

              <div
                ref={dropZoneRef}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg"
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="fileInput" className="cursor-pointer block" onClick={() => fileInputRef.current.click()}>
                  <div className="text-4xl mb-3">
                    <i className="fa-regular fa-image text-slate-300"></i>
                  </div>
                  <span className="block text-slate-700 font-medium text-sm">
                    แตะเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง
                  </span>
                  <div className="text-xs text-slate-500 mt-2">
                    รองรับไฟล์ .jpg ขนาด 2500×843 px (Max 1MB)
                  </div>
                  {fileDisplay && (
                    <div className="text-xs text-green-600 font-medium mt-3">
                      ✓ {fileDisplay}
                    </div>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-upload"></i>
                {uploading ? '⏳ กำลังอัปโหลด...' : '📤 อัปโหลด'}
              </button>
            </form>
          </div>

          {/* Menu List Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-200">
              ประวัติเมนู (History)
            </h2>

            {menus.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleMenus.map((menu) => {
                    const isCurrent = menu.richMenuId === currentMenuId;
                    return (
                      <div
                        key={menu.richMenuId}
                        className={`menu-item p-4 rounded-lg border transition-all ${
                          isCurrent ? 'active bg-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 text-sm">{menu.name}</h3>
                            <p className="text-xs text-slate-600 mt-1">{menu.chatBarText}</p>
                            <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded mt-2 font-mono break-all w-fit">
                              {menu.richMenuId}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                            isCurrent ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isCurrent ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {!isCurrent ? (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                            <button
                              onClick={() => handleSwitch(menu.richMenuId)}
                              className="flex-1 bg-white hover:bg-green-50 text-green-600 border border-green-200 py-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                            >
                              <i className="fa-solid fa-sync"></i> ใช้เมนูนี้
                            </button>
                            <button
                              onClick={() => handleDelete(menu.richMenuId)}
                              className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                            >
                              <i className="fa-solid fa-trash"></i> ลบ
                            </button>
                          </div>
                        ) : (
                          <button disabled className="w-full bg-green-100 text-green-600 py-2 rounded text-xs font-medium mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-1">
                            <i className="fa-solid fa-check"></i> ใช้งานอยู่
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {menus.length > 6 && !showAllMenus && (
                  <button
                    onClick={() => setShowAllMenus(true)}
                    className="w-full mt-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                  >
                    ดูเพิ่มเติม (อีก {menus.length - 6} รายการ) ▼
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <i className="fa-regular fa-image text-4xl text-slate-300 mb-3 block"></i>
                <p className="text-slate-500 text-sm">ไม่พบประวัติเมนูในระบบ</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}