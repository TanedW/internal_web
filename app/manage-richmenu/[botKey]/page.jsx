'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { LogOut } from 'lucide-react';

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

  const getAvatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Admin')}&background=0D9&color=fff&size=128`;

  // ==========================================
  // HELPER FUNCTIONS (เหมือน PHP)
  // ==========================================

  const getIcon = (name) => {
    const icons = {
      check: <i className="fa-solid fa-check"></i>,
      x: <i className="fa-solid fa-xmark"></i>,
      upload: <i className="fa-solid fa-upload"></i>,
      trash: <i className="fa-solid fa-trash"></i>,
      refresh: <i className="fa-solid fa-sync"></i>,
      image: <i className="fa-regular fa-image"></i>,
      back: <i className="fa-solid fa-arrow-left"></i>,
    };
    return icons[name] || null;
  };

  // ==========================================
  // AUTH & DATA FETCHING
  // ==========================================

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
      const activeId = currentData.currentMenuId || null;
      setCurrentMenuId(activeId);

      const listRes = await fetch(`/api/richmenu/list?botKey=${botKey}`);
      const listData = await listRes.json();

      if (listData.richmenus && Array.isArray(listData.richmenus)) {
        const sorted = [...listData.richmenus].sort((a, b) => {
          if (a.richMenuId === activeId) return -1;
          if (b.richMenuId === activeId) return 1;
          return 0;
        });
        setMenus(sorted);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlert({ type: 'error', message: 'ไม่สามารถดึงข้อมูลได้' });
    }
  }

  // ==========================================
  // DRAG & DROP HANDLER
  // ==========================================

  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;

    const handleDragOver = (e) => {
      e.preventDefault();
      zone.classList.add('php-upload-zone-active');
    };

    const handleDragLeave = () => {
      zone.classList.remove('php-upload-zone-active');
    };

    const handleDrop = (e) => {
      e.preventDefault();
      zone.classList.remove('php-upload-zone-active');
      const files = e.dataTransfer?.files;
      if (files?.length) processFile(files[0]);
    };

    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);

    return () => {
      zone.removeEventListener('dragover', handleDragOver);
      zone.removeEventListener('dragleave', handleDragLeave);
      zone.removeEventListener('drop', handleDrop);
    };
  }, []);

  // ==========================================
  // FILE HANDLERS
  // ==========================================

  function processFile(file) {
    if (file && file.type.includes('image')) {
      setSelectedFile(file);
      setFileDisplay(`เลือกไฟล์: ${file.name}`);
    }
  }

  function handleFileChange(e) {
    processFile(e.target.files?.[0]);
  }

  // ==========================================
  // ACTION HANDLERS (เหมือน PHP)
  // ==========================================

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

    if (!window.confirm('ยืนยันการเปลี่ยนเมนูสำหรับผู้ใช้ทุกคน?')) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('botKey', botKey);
      const dateStr = new Date().toISOString().slice(0, 19);
      const timestamp = dateStr.replace(/[-:]/g, '');
      formData.append('menuName', menuName || `Traffy_${botKey}_${timestamp}`);
      formData.append('menuImage', selectedFile);

      const response = await fetch('/api/richmenu/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const displayName = menuName || `Traffy_${botKey}`;
        setAlert({ type: 'success', message: `สร้างเมนู "${displayName}" สำเร็จ` });
        setMenuName('');
        setSelectedFile(null);
        setFileDisplay('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(fetchData, 1000);
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
    if (!window.confirm('ต้องการเปลี่ยนไปใช้เมนูนี้หรือไม่?')) return;

    try {
      const response = await fetch('/api/richmenu/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'เปลี่ยนเมนูสำเร็จ' });
        setTimeout(fetchData, 500);
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถเปลี่ยนเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' });
    }
  }

  async function handleDelete(menuId) {
    if (!window.confirm('ยืนยันการลบเมนูนี้อย่างถาวร?')) return;

    try {
      const response = await fetch('/api/richmenu/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'ลบเมนูเรียบร้อยแล้ว' });
        setTimeout(fetchData, 500);
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถลบเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' });
    }
  }

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('current_admin_id');
    router.push('/');
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
      
      {/* ==================== PHP THEME STYLES ==================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');

        /* CSS Variables (เหมือน PHP) */
        :root {
          --php-primary: #06C755;
          --php-primary-hover: #05a546;
          --php-bg-card: #FFFFFF;
          --php-text-main: #2C3E50;
          --php-text-sub: #7F8C8D;
          --php-border: #E8ECEF;
          --php-danger: #E74C3C;
          --php-shadow: 0 2px 8px rgba(0,0,0,0.06);
          --php-radius: 12px;
        }

        .php-theme {
          font-family: 'Sarabun', sans-serif;
          color: var(--php-text-main);
        }

        .php-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        /* ALERTS */
        .php-alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          animation: slideDown 0.3s ease-out;
        }
        .php-alert-success { 
          background: #E8F5E9; 
          color: #1B5E20; 
          border: 1px solid #C8E6C9; 
        }
        .php-alert-error { 
          background: #FFEBEE; 
          color: #B71C1C; 
          border: 1px solid #FFCDD2; 
        }
        @keyframes slideDown { 
          from { transform: translateY(-10px); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }

        /* CARDS */
        .php-card {
          background: var(--php-bg-card);
          border-radius: var(--php-radius);
          box-shadow: var(--php-shadow);
          padding: 24px;
          margin-bottom: 24px;
        }
        .php-card-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--php-border);
        }
        .php-card-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--php-text-main);
        }

        /* FORM */
        .php-input-label { 
          display: block; 
          margin-bottom: 8px; 
          font-weight: 500; 
          font-size: 14px; 
          color: var(--php-text-main); 
        }
        .php-form-control {
          width: 100%; 
          padding: 12px; 
          border: 1px solid var(--php-border);
          border-radius: 8px; 
          font-size: 14px; 
          font-family: 'Sarabun', sans-serif; 
          transition: 0.2s; 
          background: #fff;
        }
        .php-form-control:focus { 
          outline: none; 
          border-color: var(--php-primary); 
          box-shadow: 0 0 0 3px rgba(6, 199, 85, 0.1); 
        }

        /* UPLOAD ZONE */
        .php-upload-zone {
          border: 2px dashed var(--php-border); 
          border-radius: var(--php-radius); 
          padding: 40px 20px;
          text-align: center; 
          cursor: pointer; 
          transition: 0.2s; 
          position: relative;
        }
        .php-upload-zone:hover { 
          border-color: var(--php-primary); 
          background: #F9FBF9; 
        }
        .php-upload-zone-active { 
          border-color: var(--php-primary) !important; 
          background: #F9FBF9 !important; 
        }
        .php-upload-text { 
          font-weight: 500; 
          margin-bottom: 4px; 
          display: block; 
        }
        .php-upload-sub { 
          font-size: 12px; 
          color: var(--php-text-sub); 
        }
        .php-file-selected { 
          color: var(--php-primary); 
          font-weight: 600; 
          margin-top: 10px; 
          display: block; 
        }

        /* BUTTONS */
        .php-btn-primary {
          background: var(--php-primary); 
          color: white; 
          border: none; 
          width: 100%; 
          padding: 14px;
          border-radius: 8px; 
          font-size: 15px; 
          font-weight: 500; 
          cursor: pointer; 
          margin-top: 16px;
          transition: background 0.2s; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px;
          font-family: 'Sarabun', sans-serif;
        }
        .php-btn-primary:hover { background: var(--php-primary-hover); }
        .php-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .php-btn-secondary {
          background: transparent; 
          border: 1px solid var(--php-border); 
          color: var(--php-text-sub);
          width: 100%; 
          padding: 12px; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 14px;
          font-weight: 500; 
          transition: 0.2s; 
          margin-top: 20px; 
          display: flex; 
          align-items: center;
          justify-content: center; 
          gap: 8px; 
          font-family: 'Sarabun', sans-serif;
        }
        .php-btn-secondary:hover { 
          background: #fff; 
          border-color: var(--php-primary); 
          color: var(--php-primary); 
        }

        /* MENU LIST */
        .php-menu-list { 
          display: grid; 
          gap: 16px; 
          grid-template-columns: 1fr; 
        }
        @media (min-width: 768px) { 
          .php-menu-list { 
            grid-template-columns: repeat(2, 1fr); 
          } 
        }
        
        .php-menu-item {
          background: #fff; 
          border: 1px solid var(--php-border); 
          border-radius: 10px; 
          padding: 16px;
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
          transition: 0.2s;
        }
        .php-menu-item.active { 
          border-color: var(--php-primary); 
          background: #fff; 
          box-shadow: 0 0 0 1px var(--php-primary); 
        }
        
        .php-menu-status { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
        }
        .php-status-badge {
          font-size: 11px; 
          font-weight: 600; 
          padding: 4px 8px; 
          border-radius: 20px;
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        .php-status-active { 
          background: #E8F5E9; 
          color: var(--php-primary); 
        }
        .php-status-inactive { 
          background: #ECEFF1; 
          color: var(--php-text-sub); 
        }

        .php-menu-details h3 { 
          margin: 0 0 4px 0; 
          font-size: 15px; 
          font-weight: 600; 
        }
        .php-menu-details p { 
          margin: 0; 
          font-size: 12px; 
          color: var(--php-text-sub); 
        }
        .php-menu-id {
          font-family: 'Courier New', monospace; 
          font-size: 11px; 
          background: #F1F2F6;
          padding: 4px 6px; 
          border-radius: 4px; 
          color: #555; 
          margin-top: 6px; 
          display: inline-block; 
          word-break: break-all;
        }

        .php-menu-actions { 
          display: flex; 
          gap: 8px; 
          margin-top: 8px; 
          padding-top: 12px; 
          border-top: 1px solid #f0f0f0; 
        }
        .php-btn-action {
          flex: 1; 
          padding: 8px 12px; 
          border-radius: 6px; 
          font-size: 13px; 
          border: 1px solid transparent;
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 6px;
          transition: 0.2s; 
          font-weight: 500; 
          font-family: 'Sarabun', sans-serif;
        }
        .php-btn-switch { 
          background: #fff; 
          border-color: var(--php-border); 
          color: var(--php-text-main); 
        }
        .php-btn-switch:hover { 
          background: #f8f9fa; 
          border-color: #ccc; 
        }
        .php-btn-delete { 
          background: #fff; 
          border-color: #FFEBEE; 
          color: var(--php-danger); 
        }
        .php-btn-delete:hover { 
          background: #FFEBEE; 
        }
        
        .php-btn-disabled { 
          opacity: 0.5; 
          cursor: default; 
          background: #E8F5E9; 
          border-color: transparent; 
          color: var(--php-primary); 
        }
        
        .php-empty-state { 
          text-align: center; 
          padding: 40px; 
          color: var(--php-text-sub); 
        }

        .php-nav-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            background: #fff;
            padding: 10px 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .php-btn-back {
            text-decoration: none;
            color: var(--php-text-main);
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: 0.2s;
        }
        .php-btn-back:hover { color: var(--php-primary); }
        .php-bot-badge {
            font-size: 13px;
            background: #E8F5E9;
            color: var(--php-primary);
            padding: 4px 10px;
            border-radius: 20px;
            font-weight: 600;
        }
        .php-main-header {
            text-align: center;
            padding: 10px 0 25px 0;
        }
        .php-main-header h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--php-text-main);
        }
        .php-main-header p {
            margin: 0;
            color: var(--php-text-sub);
            font-size: 14px;
        }
      `}</style>

      {/* ================= NAVBAR (UNCHANGED) ================= */}
      {/* Mobile Bottom Nav */}
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
          <Link href="/manage-richmenu" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-900 bg-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path></svg>
            <span className="text-[10px] font-bold">Menu</span>
          </Link>
        </div>
      </div>

      {/* Mobile Top Nav */}
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

      {/* Desktop Nav */}
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

      {/* ================= PHP THEME CONTENT ================= */}
      <div className="mt-16 lg:mt-0 pt-6 php-theme">
        <div className="php-container">
          
          {/* Navigation Bar */}
          <div className="php-nav-bar">
            <Link href="/manage-richmenu" className="php-btn-back">
                {getIcon('back')} กลับหน้าเลือกบอท
            </Link>
            <div className="php-bot-badge">
                กำลังจัดการ: {bot?.name || botKey}
            </div>
          </div>

          {/* Header */}
          <div className="php-main-header">
              <h1>Traffy Rich Menu Manager</h1>
              <p>ระบบจัดการเมนู LINE Official Account</p>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`php-alert ${alert.type === 'success' ? 'php-alert-success' : 'php-alert-error'}`}>
              {getIcon(alert.type === 'success' ? 'check' : 'x')}
              <span>{alert.message}</span>
            </div>
          )}

          {/* Upload Card */}
          <section className="php-card">
            <div className="php-card-header">
                <h2 className="php-card-title">สร้างเมนูใหม่ (Upload New)</h2>
            </div>
            <form onSubmit={handleUpload}>
                <div className="mb-5">
                    <label className="php-input-label">ชื่อเมนู (Menu Name)</label>
                    <input 
                      type="text" 
                      className="php-form-control" 
                      placeholder="ตั้งชื่อเมนู เช่น: เมนูหลัก 2024"
                      value={menuName}
                      onChange={(e) => setMenuName(e.target.value)}
                      disabled={uploading}
                    />
                </div>

                <div className="php-upload-zone" ref={dropZoneRef}>
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      accept=".jpg,.jpeg" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <div className="flex flex-col items-center">
                        <div className="mb-2 text-4xl text-slate-300">{getIcon('image')}</div>
                        <span className="php-upload-text">แตะเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</span>
                        <div className="php-upload-sub">รองรับไฟล์ .jpg ขนาด 2500x843 px (Max 1MB)</div>
                        {fileDisplay && <div className="php-file-selected">{fileDisplay}</div>}
                    </div>
                </div>

                <button type="submit" className="php-btn-primary" disabled={uploading}>
                    {getIcon('upload')}
                    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดและใช้งานทันที'}
                </button>
            </form>
          </section>

          {/* History Card */}
          <section className="php-card">
            <div className="php-card-header">
                <h2 className="php-card-title">ประวัติเมนูของบอทนี้ (History)</h2>
            </div>

            {menus.length > 0 ? (
                <>
                <div className="php-menu-list">
                    {visibleMenus.map((menu) => {
                        const isCurrent = menu.richMenuId === currentMenuId;
                        return (
                            <div key={menu.richMenuId} className={`php-menu-item ${isCurrent ? 'active' : ''}`}>
                                <div className="php-menu-status">
                                    <div className="php-menu-details">
                                        <h3>{menu.name}</h3>
                                        <p>{menu.chatBarText}</p>
                                        <div className="php-menu-id">{menu.richMenuId}</div>
                                    </div>
                                    <span className={`php-status-badge ${isCurrent ? 'php-status-active' : 'php-status-inactive'}`}>
                                        {isCurrent ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                {!isCurrent ? (
                                    <div className="php-menu-actions">
                                        <button onClick={() => handleSwitch(menu.richMenuId)} className="php-btn-action php-btn-switch">
                                            {getIcon('refresh')} ใช้เมนูนี้
                                        </button>
                                        <button onClick={() => handleDelete(menu.richMenuId)} className="php-btn-action php-btn-delete">
                                            {getIcon('trash')} ลบ
                                        </button>
                                    </div>
                                ) : (
                                    <div className="php-menu-actions">
                                        <button disabled className="php-btn-action php-btn-disabled">
                                            {getIcon('check')} ใช้งานอยู่
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {menus.length > 6 && !showAllMenus && (
                    <button onClick={() => setShowAllMenus(true)} className="php-btn-secondary">
                        ดูเพิ่มเติม (อีก {menus.length - 6} รายการ) ▼
                    </button>
                )}
                </>
            ) : (
                <div className="php-empty-state">
                    <div className="mb-2 text-5xl text-slate-300">{getIcon('image')}</div>
                    <p>ไม่พบประวัติเมนูในระบบ</p>
                </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}