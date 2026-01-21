'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { LogOut, Menu, X, Mail, Briefcase, LayoutGrid, ArrowLeft } from 'lucide-react'; 

export default function RichMenuDashboard() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const botKey = params.botKey;

  // --- State: Auth & Data ---
  const [user, setUser] = useState(null);
  const [bot, setBot] = useState(null);
  const [menus, setMenus] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- State: Rich Menu Logic ---
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [menuName, setMenuName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDisplay, setFileDisplay] = useState('');
  const [showAllMenus, setShowAllMenus] = useState(false);
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  
  // --- State: Sidebar & Role ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State สำหรับ Desktop Sidebar (Toggle)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  
  // ✅ State สำหรับ Toggle การแสดง Role (Sidebar)
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  const [currentRoles, setCurrentRoles] = useState([]);
  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // ==========================================
  // SIDEBAR HELPERS
  // ==========================================
  
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
      // Logic: Highlight if path starts with target
      const isActive = pathname === targetPath || (targetPath === '/manage-richmenu' && pathname.includes('/manage-richmenu'));
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

  // ==========================================
  // DASHBOARD HELPERS
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
      chevronUp: <i className="fa-solid fa-chevron-up"></i>,
      chevronDown: <i className="fa-solid fa-chevron-down"></i>,
    };
    return icons[name] || null;
  };

  // ==========================================
  // MAIN LOGIC
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData();
        fetchAdmins();
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

  // --- Drag & Drop ---
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
  }, [isUploadExpanded]);

  function processFile(file) {
    if (file && file.type.includes('image')) {
      setSelectedFile(file);
      setFileDisplay(`เลือกไฟล์: ${file.name}`);
    }
  }

  function handleFileChange(e) {
    processFile(e.target.files?.[0]);
  }

  // --- Handlers ---
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
  const activeMenu = menus.find(m => m.richMenuId === currentMenuId);

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
              <h1 className="font-bold text-slate-800 text-lg">Rich Menu Manager</h1>
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
        
        {/* ✅ ปุ่ม Open Sidebar (Desktop) + ข้อความ "Rich Menu Manager" */}
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
                    Rich Menu Manager
                </h1>
             </div>
        )}

        <div className="php-theme">
          <div className="php-container">
            
            {/* Navigation Bar inside Content */}
            <div className={`php-nav-bar ${!isDesktopSidebarOpen ? 'lg:mt-16' : ''} transition-all duration-300`}>
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

            {/* ==================== CURRENT MENU STATUS CARD ==================== */}
            <section className="php-card php-current-menu-card">
              <div className="php-card-header flex justify-between items-center">
                <h2 className="php-card-title flex items-center gap-2">
                  <i className="fa-solid fa-star text-emerald-500"></i>
                  เมนูที่ใช้งานอยู่ (Current Menu)
                </h2>
                {activeMenu && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                    LIVE
                  </span>
                )}
              </div>
              {activeMenu ? (
                <div className="php-current-menu-grid">
                  {/* Image Column */}
                  <div>
                    <div className="php-menu-img-container shadow-md border-emerald-100">
                      <div className="php-menu-img-placeholder">
                        {getIcon('image')}
                      </div>
                      <img 
                        src={activeMenu.imageUrl || `/api/richmenu/image?botKey=${botKey}&menuId=${activeMenu.richMenuId}`}
                        alt="Current Menu"
                        className="php-menu-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                  {/* Details Column */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{activeMenu.name}</h3>
                      <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <i className="fa-regular fa-id-card"></i>
                        <span className="font-mono text-xs">{activeMenu.richMenuId}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-500">
                        <i className="fa-solid fa-quote-right fa-2x"></i>
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Chat Bar Text</span>
                      <p className="font-medium text-slate-700 text-lg">"{activeMenu.chatBarText}"</p>
                    </div>

                    <div className="php-current-status-info">
                      <i className="fa-solid fa-circle-check flex-shrink-0 mt-0.5"></i>
                      <div>
                        <strong>สถานะปกติ:</strong> เมนูนี้กำลังแสดงผลให้กับผู้ใช้งาน LINE ทุกคนที่ไม่ได้ถูกกำหนดเมนูเฉพาะบุคคล
                      </div>
                    </div>
                  </div>
                </div>
              ) : ((
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <div className="text-4xl mb-3 text-slate-300">{getIcon('image')}</div>
                  <p className="font-medium">ยังไม่มีเมนูที่ตั้งค่าเป็น Default</p>
                  <p className="text-sm text-slate-400 mt-1">กรุณาเลือกเมนูจากประวัติด้านล่าง หรืออัปโหลดใหม่</p>
                </div>
              ))}
            </section>

            {/* ==================== UPLOAD SECTION ==================== */}
            <section className="php-card transition-all duration-300">
              <div 
                className={`php-upload-header cursor-pointer select-none flex justify-between items-center -m-6 p-6 rounded-t-xl transition-all duration-300
                  ${!isUploadExpanded ? '!rounded-b-xl !mb-[-24px]' : 'border-b border-gray-100'}`} 
                onClick={() => setIsUploadExpanded(!isUploadExpanded)}
              >
                <h2 className="php-card-title flex items-center gap-2 text-base font-semibold m-0 text-slate-700">
                  <i className="fa-solid fa-cloud-arrow-up text-slate-400"></i>
                  สร้างเมนูใหม่ (Upload New)
                </h2>
                <button className="text-slate-400 hover:text-slate-600 transition-colors" type="button">
                  {isUploadExpanded ? getIcon('chevronUp') : getIcon('chevronDown')}
                </button>
              </div>
              
              {isUploadExpanded && (
                <form onSubmit={handleUpload} className="mt-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row gap-6 items-stretch">
                    
                    <div className="flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <label className="php-input-label">ชื่อเมนู (Menu Name)</label>
                        <input 
                          type="text" 
                          className="php-form-control" 
                          placeholder="ตั้งชื่อเมนู เช่น: โปรโมชั่น ม.ค. 67"
                          value={menuName}
                          onChange={(e) => setMenuName(e.target.value)}
                          disabled={uploading}
                        />
                      </div>
                      
                      <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-md border border-blue-100">
                        <i className="fa-solid fa-circle-info mr-2"></i>
                        ขนาดไฟล์แนะนำ: <strong>2500 x 843 px</strong> (JPEG Only, Max 1MB)
                      </div>

                      <button type="submit" className="php-btn-primary mt-auto" disabled={uploading}>
                        {getIcon('upload')}
                        {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดและใช้งานทันที'}
                      </button>
                    </div>

                    <div className="flex-1">
                      <label className="php-input-label">รูปภาพ (Image)</label>
                      <div 
                        className="php-upload-zone relative h-full flex flex-col justify-center items-center py-6 min-h-[160px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl hover:bg-green-50 hover:border-green-400 transition-colors group" 
                        ref={dropZoneRef}
                      >
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          accept=".jpg,.jpeg" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                        
                        {selectedFile ? (
                          <div className="text-center relative z-0">
                            <div className="text-4xl text-emerald-500 mb-2">
                              {getIcon('image')}
                            </div>
                            <span className="font-semibold text-slate-700 block mb-1">เลือกไฟล์แล้ว</span>
                            <div className="php-file-selected text-xs max-w-[200px] truncate mx-auto bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                              {selectedFile.name}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">แตะเพื่อเปลี่ยนรูป</p>
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 group-hover:text-slate-600 transition-colors relative z-0">
                            <div className="text-3xl mb-2">{getIcon('image')}</div>
                            <span className="php-upload-text text-sm font-medium">เลือกรูปภาพ หรือลากไฟล์มาวาง</span>
                            <span className="text-xs opacity-70 block mt-1">รองรับ .jpg เท่านั้น</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </section>

            {/* ==================== HISTORY SECTION ==================== */}
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
                          <div className="php-menu-img-container">
                            <div className="php-menu-img-placeholder">
                              {getIcon('image')}
                            </div>
                            <img 
                              src={menu.imageUrl || `/api/richmenu/image?botKey=${botKey}&menuId=${menu.richMenuId}`}
                              alt={menu.name}
                              className="php-menu-img"
                              onError={(e) => { 
                                e.target.style.display = 'none'; 
                              }}
                            />
                          </div>

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

      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* ==================== PHP THEME STYLES ==================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');

        /* CSS Variables */
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

        /* UPLOAD ZONE - COMPACT VERSION */
        .php-upload-zone {
          border: 2px dashed var(--php-border); 
          border-radius: var(--php-radius); 
          padding: 20px;
          text-align: center; 
          cursor: pointer; 
          transition: 0.2s; 
          position: relative;
          background: #FAFAFA;
        }
        .php-upload-zone:hover { 
          border-color: var(--php-primary); 
          background: #F0FDF4; 
        }
        .php-upload-zone-active { 
          border-color: var(--php-primary) !important; 
          background: #F0FDF4 !important; 
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
          margin-top: 8px; 
          font-size: 13px;
          display: block; 
          background: #E8F5E9;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        /* BUTTONS */
        .php-btn-primary {
          background: var(--php-primary); 
          color: white; 
          border: none; 
          width: 100%; 
          padding: 12px;
          border-radius: 8px; 
          font-size: 15px; 
          font-weight: 500; 
          cursor: pointer; 
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

        /* Image Preview Styles */
        .php-menu-img-container {
            width: 100%;
            aspect-ratio: 2.96; 
            background-color: #f8f9fa;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #eee;
            position: relative;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .php-menu-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            position: relative;
            z-index: 2;
        }
        .php-menu-img-placeholder {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: #d1d5db;
            z-index: 1;
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
            cursor: pointer;
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

        /* Current Menu Card Styles */
        .php-current-menu-card {
          border-top: 4px solid #10b981 !important;
        }
        .php-current-menu-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .php-current-menu-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .php-current-status-info {
          background: #ecfdf5;
          border: 1px solid #d1fae5;
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
          color: #047857;
          margin-top: 12px;
        }

        /* Upload Section Toggle */
        .php-upload-header {
          cursor: pointer;
          user-select: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: -24px -24px 0 -24px;
          padding: 24px;
          border-radius: 12px 12px 0 0;
          transition: 0.2s;
        }
        .php-upload-header:hover {
          background: #f9fafb;
        }
        .php-upload-icon {
          color: #9ca3af;
          transition: 0.2s;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1000px; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}