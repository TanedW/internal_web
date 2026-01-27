'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { LogOut, Menu, X, Mail, Briefcase, LayoutGrid, Users, ChevronDown, ChevronUp, Check, Settings, AlertCircle, CheckCircle, Upload, Smartphone, Move, Save } from 'lucide-react';
import '../richmenu-dashboard.css';

// --- Templates Configuration (from Document 2) ---
const CUSTOM_HEIGHT = 1061;
const TOP_ROW_HEIGHT = Math.round(CUSTOM_HEIGHT * 0.275);
const BOTTOM_ROW_HEIGHT = CUSTOM_HEIGHT - TOP_ROW_HEIGHT;

const TEMPLATES = [
  {
    id: 'large_6',
    name: 'Large: 6 ช่อง (3x2)',
    type: 'large',
    areas: [
      { id: 'a', x: 0, y: 0, w: 833, h: 843 }, { id: 'b', x: 833, y: 0, w: 834, h: 843 }, { id: 'c', x: 1667, y: 0, w: 833, h: 843 },
      { id: 'd', x: 0, y: 843, w: 833, h: 843 }, { id: 'e', x: 833, y: 843, w: 834, h: 843 }, { id: 'f', x: 1667, y: 843, w: 833, h: 843 },
    ],
    width: 2500, height: 1686,
    desc: "ขนาดใหญ่ มาตรฐาน"
  },
  {
    id: 'large_1_5',
    name: 'Custom: 6 ช่อง (สัดส่วน 760x322.5)',
    type: 'compact',
    areas: [
      { id: 'a', x: 0, y: 0, w: 2500, h: TOP_ROW_HEIGHT },
      { id: 'b', x: 0, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: 'c', x: 500, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: 'd', x: 1000, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: 'e', x: 1500, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: 'f', x: 2000, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
    ],
    width: 2500, height: CUSTOM_HEIGHT,
    desc: "ปรับสัดส่วนตามที่กำหนด (1061px height)"
  },
  {
    id: 'large_4',
    name: 'Large: 4 ช่อง (2x2)',
    type: 'large',
    areas: [
      { id: 'a', x: 0, y: 0, w: 1250, h: 843 }, { id: 'b', x: 1250, y: 0, w: 1250, h: 843 },
      { id: 'c', x: 0, y: 843, w: 1250, h: 843 }, { id: 'd', x: 1250, y: 843, w: 1250, h: 843 },
    ],
    width: 2500, height: 1686,
    desc: "ขนาดใหญ่ ยอดนิยม"
  },
  {
    id: 'large_3',
    name: 'Large: 3 ช่อง',
    type: 'large',
    areas: [
      { id: 'a', x: 0, y: 0, w: 2500, h: 843 },
      { id: 'b', x: 0, y: 843, w: 1250, h: 843 }, { id: 'c', x: 1250, y: 843, w: 1250, h: 843 },
    ],
    width: 2500, height: 1686,
    desc: "เน้นโปรโมชั่นด้านบน"
  },
  {
    id: 'compact_2',
    name: 'Compact: 2 ช่อง',
    type: 'compact',
    areas: [
      { id: 'a', x: 0, y: 0, w: 1250, h: 843 }, { id: 'b', x: 1250, y: 0, w: 1250, h: 843 },
    ],
    width: 2500, height: 843,
    desc: "ขนาดเล็ก ประหยัดพื้นที่"
  },
  {
    id: 'compact_1',
    name: 'Compact: 1 ช่อง (เต็ม)',
    type: 'compact',
    areas: [
      { id: 'a', x: 0, y: 0, w: 2500, h: 843 },
    ],
    width: 2500, height: 843,
    desc: "ขนาดเล็ก รูปเดียวเต็มจอ"
  },
];

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

  // --- State: Rich Menu Logic (Old) ---
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [menuName, setMenuName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDisplay, setFileDisplay] = useState('');
  const [showAllMenus, setShowAllMenus] = useState(false);

  // --- State: Advanced Upload Section (from Document 2) ---
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const [chatBarText, setChatBarText] = useState('เมนูหลัก');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[1]);
  const [selectedAreaId, setSelectedAreaId] = useState('a');
  const [actions, setActions] = useState({});

  // --- State: Sidebar & Role ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);
  const [currentRoles, setCurrentRoles] = useState([]);

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const actionPanelRef = useRef(null);

  // Centralized color system
  const COLORS = {
    primary: '#06C755',
    primaryHover: '#05a546',
    textMain: '#2C3E50',
  };

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
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  const getMenuClass = (targetPath) => {
    const isActive = pathname === targetPath || (targetPath === '/manage-richmenu' && pathname.includes('/manage-richmenu'));
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
  // ADVANCED UPLOAD HANDLERS (from Document 2)
  // ==========================================

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    setSelectedAreaId(template.areas[0].id);
    setIsTemplateModalOpen(false);
  };

  const handleAreaClick = (areaId) => {
    setSelectedAreaId(areaId);
    if (window.innerWidth < 1024 && actionPanelRef.current) {
      actionPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const updateAction = (field, value) => {
    setActions(prev => ({
      ...prev,
      [selectedAreaId]: {
        ...prev[selectedAreaId],
        type: prev[selectedAreaId]?.type || 'link',
        [field]: value
      }
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) {
        setAlert({ type: 'error', message: 'ขนาดไฟล์ต้องไม่เกิน 1MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentArea = selectedTemplate.areas.find(a => a.id === selectedAreaId);
  const currentAction = actions[selectedAreaId] || { type: 'link', data: '', label: '' };

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
                  <img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full" />
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
                <Link href="/manage-org" className={getMenuClass('/manage-org')}>
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
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-10 mt-2">
          <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-slate-200 mb-4">
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
              <img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full" />
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
      <div className={`mt-16 lg:mt-0 pt-0 lg:pt-6 transition-all duration-300 pb-24 ${
        isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>

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
              ) : (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <div className="text-4xl mb-3 text-slate-300">{getIcon('image')}</div>
                  <p className="font-medium">ยังไม่มีเมนูที่ตั้งค่าเป็น Default</p>
                  <p className="text-sm text-slate-400 mt-1">กรุณาเลือกเมนูจากประวัติด้านล่าง หรืออัปโหลดใหม่</p>
                </div>
              )}
            </section>

            {/* ==================== ADVANCED UPLOAD SECTION (from Document 2) ==================== */}
            {/* Template Selection Modal */}
            {isTemplateModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <LayoutGrid className="text-[#06C755]" /> เลือกรูปแบบ Rich Menu
                    </h3>
                    <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateChange(t)}
                          className={`group relative bg-white border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                            selectedTemplate.id === t.id ? 'border-[#06C755] ring-1 ring-[#06C755]' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="aspect-[2500/1686] bg-slate-100 rounded-lg mb-3 border border-slate-200 overflow-hidden relative">
                            {t.areas.map((a, i) => (
                              <div
                                key={i}
                                className="absolute bg-white border border-slate-300"
                                style={{
                                  left: `${(a.x / t.width) * 100}%`,
                                  top: `${(a.y / t.height) * 100}%`,
                                  width: `${(a.w / t.width) * 100}%`,
                                  height: `${(a.h / t.height) * 100}%`
                                }}
                              />
                            ))}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm group-hover:text-[#06C755]">{t.name}</div>
                            <div className="text-xs text-slate-400 mt-1">{t.desc}</div>
                          </div>
                          {selectedTemplate.id === t.id && (
                            <div className="absolute top-3 right-3 bg-[#06C755] text-white p-1 rounded-full shadow-sm">
                              <Check size={14} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                <div className="mt-6 animate-fade-in">
                  {/* Editor Section with Left Panel, Center Canvas, Right Action Panel */}
                  <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[750px]">

                    {/* 1. LEFT PANEL: Settings & Template */}
                    <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 flex flex-col h-full overflow-y-auto z-20 shadow-md lg:shadow-none relative">
                      <div className="p-6 space-y-6 flex-1">

                        {/* Basic Info */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">ชื่อเมนู (Menu Name)</label>
                            <input
                              type="text"
                              value={menuName}
                              onChange={(e) => setMenuName(e.target.value)}
                              placeholder="เช่น โปรโมชั่นเดือนมกราคม"
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">ข้อความบนแถบเมนู (Chat Bar Text)</label>
                            <input
                              type="text"
                              value={chatBarText}
                              onChange={(e) => setChatBarText(e.target.value)}
                              placeholder="เช่น คลิกเพื่อดูเมนู"
                              maxLength={14}
                              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                            />
                            <div className="text-[10px] text-slate-400 text-right">{chatBarText.length}/14</div>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Template Button */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">เทมเพลต (Template)</label>
                          <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-green-300 bg-green-50 hover:border-green-500 hover:bg-green-100 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg border-2 border-green-400 flex items-center justify-center group-hover:bg-green-200 group-hover:border-green-500">
                                <LayoutGrid size={20} className="text-green-600 group-hover:text-green-700" />
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-bold text-green-700 group-hover:text-green-800">{selectedTemplate.name}</div>
                                <div className="text-[10px] text-green-600">คลิกเพื่อเปลี่ยนรูปแบบ</div>
                              </div>
                            </div>
                            <ChevronDown size={16} className="text-slate-400" />
                          </button>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">รูปภาพพื้นหลัง (Background Image)</label>
                          <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-bold bg-slate-200 text-slate-600 px-1.5 rounded">File</span> JPG, PNG, JPEG
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-bold bg-slate-200 text-slate-600 px-1.5 rounded">Size</span> Max 1 MB
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-bold bg-slate-200 text-slate-600 px-1.5 rounded">Dim</span> 2500x1686 px, 2500x843 px
                              </div>
                            </div>

                            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={handleFileSelect} />

                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-2.5 bg-green-50 border-2 border-green-300 text-green-700 font-bold text-sm rounded-lg hover:bg-green-100 hover:border-green-500 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                            >
                              <Upload size={16} /> อัปโหลดรูป
                            </button>

                            {uploadedImage && (
                              <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                                <img src={uploadedImage} alt="Preview" className="w-full h-auto" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white text-xs font-bold">เปลี่ยนรูป</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* SAVE BUTTON */}
                      <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <button
                          onClick={handleUpload}
                          disabled={uploading || !uploadedImage || !menuName}
                          className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white px-4 py-3 rounded-xl text-base font-bold shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Save size={20} />}
                          บันทึก Rich Menu
                        </button>
                      </div>
                    </div>

                    {/* 2. CENTER PANEL: Visual Editor */}
                    <div className="flex-1 bg-slate-100 flex flex-col relative overflow-hidden rounded-xl border border-slate-200 shadow-md">
                      <div className="h-14 bg-white border-b border-slate-200 flex justify-between items-center px-4 shrink-0">
                        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Smartphone size={14} /> Preview & Mapping
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto bg-slate-200/50 p-4 lg:p-8">
                        <div className="relative w-full max-w-[760px] mx-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">

                          {/* RICH MENU AREA */}
                          <div className="relative w-full bg-slate-100" style={{ aspectRatio: `${selectedTemplate.width}/${selectedTemplate.height}` }}>

                            {uploadedImage ? (
                              <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                <i className="fa-regular fa-image text-4xl mb-2"></i>
                                <span className="text-xs">ยังไม่มีรูปภาพ</span>
                              </div>
                            )}

                            {/* GRID OVERLAY */}
                            {selectedTemplate.areas.map((area) => {
                              const isSelected = selectedAreaId === area.id;
                              const hasAction = actions[area.id]?.data || actions[area.id]?.url;

                              const leftPct = (area.x / selectedTemplate.width) * 100;
                              const topPct = (area.y / selectedTemplate.height) * 100;
                              const widthPct = (area.w / selectedTemplate.width) * 100;
                              const heightPct = (area.h / selectedTemplate.height) * 100;

                              return (
                                <div
                                  key={area.id}
                                  onClick={() => handleAreaClick(area.id)}
                                  className={`
                                    absolute cursor-pointer transition-all duration-200 group
                                    ${isSelected ? 'z-20 border-2 border-[#06C755] bg-[#06C755]/10' : 'z-10 border border-white/30 hover:bg-black/10'}
                                  `}
                                  style={{
                                    left: `${leftPct}%`,
                                    top: `${topPct}%`,
                                    width: `${widthPct}%`,
                                    height: `${heightPct}%`,
                                  }}
                                >
                                  <div className={`
                                    absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm
                                    ${isSelected ? 'bg-[#06C755] text-white' : 'bg-white/80 text-slate-500'}
                                  `}>
                                    {area.id.toUpperCase()}
                                  </div>

                                  {hasAction && (
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded-full shadow-sm">
                                      <Check size={10} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Chat Bar */}
                          <div className="bg-[#f8f8f8] text-slate-500 text-[10px] text-center py-1.5 font-medium border-t border-slate-200 cursor-default">
                            {chatBarText} ▼
                          </div>
                        </div>

                        <div className="text-center mt-4 mb-2">
                          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs text-slate-500 shadow-sm pointer-events-none">
                            <i className="fa-solid fa-arrow-pointer"></i> คลิกที่ช่องเพื่อกำหนด Action
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. RIGHT PANEL: Action Properties */}
                    <div ref={actionPanelRef} className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 flex flex-col h-full z-20 shadow-md lg:shadow-none relative">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                          <Settings size={16} className="text-[#06C755]" />
                          ตั้งค่าการทำงาน (Action)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          พื้นที่ที่เลือก: <span className="font-bold bg-green-100 text-green-700 px-1.5 rounded uppercase">{selectedAreaId}</span>
                        </p>
                      </div>

                      <div className="p-5 flex-1 overflow-y-auto space-y-6">

                        {/* Action Type Selector */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">เลือกรูปแบบ Action</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => updateAction('type', 'link')}
                              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 text-xs font-medium transition-all ${currentAction.type === 'link' ? 'bg-green-100 border-green-600 text-green-700 shadow-sm' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:border-slate-400'}`}
                            >
                              <i className="fa-solid fa-link"></i> Link
                            </button>
                            <button
                              onClick={() => updateAction('type', 'text')}
                              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 text-xs font-medium transition-all ${currentAction.type === 'text' ? 'bg-green-100 border-green-600 text-green-700 shadow-sm' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:border-slate-400'}`}
                            >
                              <i className="fa-solid fa-keyboard"></i> Text
                            </button>
                            <button
                              onClick={() => updateAction('type', 'api')}
                              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 text-xs font-medium transition-all ${currentAction.type === 'api' ? 'bg-green-100 border-green-600 text-green-700 shadow-sm' : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:border-slate-400'}`}
                            >
                              <i className="fa-solid fa-bolt"></i> API
                            </button>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Dynamic Inputs */}
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">

                          {currentAction.type === 'link' && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><i className="fa-solid fa-globe text-xs"></i> ปลายทาง (URL)</label>
                              <input
                                type="url"
                                value={currentAction.url || ''}
                                onChange={(e) => updateAction('url', e.target.value)}
                                placeholder="https://myshop.com/promo"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                              />
                              <p className="text-[10px] text-slate-400">เมื่อกด จะเปิดลิ้งก์นี้ใน Browser</p>
                            </div>
                          )}

                          {currentAction.type === 'text' && (
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><i className="fa-solid fa-keyboard text-xs"></i> ข้อความที่จะส่ง</label>
                              <textarea
                                rows={3}
                                value={currentAction.text || ''}
                                onChange={(e) => updateAction('text', e.target.value)}
                                placeholder="เช่น สอบถามโปรโมชั่น"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                              />
                              <p className="text-[10px] text-slate-400">ข้อความนี้จะถูกส่งแทนลูกค้า</p>
                            </div>
                          )}

                          {currentAction.type === 'api' && (
                            <>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><i className="fa-solid fa-code text-xs"></i> Postback Data</label>
                                <input
                                  type="text"
                                  value={currentAction.data || ''}
                                  onChange={(e) => updateAction('data', e.target.value)}
                                  placeholder="action=buy&item=101"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-slate-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">ข้อความแสดงผล</label>
                                <input
                                  type="text"
                                  value={currentAction.displayText || ''}
                                  onChange={(e) => updateAction('displayText', e.target.value)}
                                  placeholder="กำลังทำรายการ..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-400">ส่ง Data ไปที่ Webhook พร้อมโชว์ข้อความนี้</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Clear Action Button */}
                      <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                        <button
                          onClick={() => setActions(prev => {
                            const n = { ...prev };
                            delete n[selectedAreaId];
                            return n;
                          })}
                          className="w-full py-2 text-xs text-white font-bold bg-red-500 border border-red-600 rounded-lg hover:bg-red-600 hover:border-red-700 transition-all shadow-sm hover:shadow-md"
                        >
                          ล้างค่า (Clear Action)
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </section>

            {/* ==================== HISTORY SECTION ==================== */}
            <section className="php-card">
              <div className="php-card-header">
                <h2 className="php-card-title">ประวัติ Rich Menu</h2>
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
    </div>
  );
}
