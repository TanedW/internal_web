'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';
import { Menu, X, LayoutGrid, ChevronDown, Save, Smartphone, Upload, Settings } from 'lucide-react';
import '../richmenu-dashboard.css';

// ✅ นำเข้า Sidebar จากไฟล์คอมโพเนนต์ภายนอก
import Sidebar from "../../components/sidebar"; 

// --- Templates Configuration (คงไว้ตามเดิมเป๊ะ) ---
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

  // --- State: Rich Menu Logic ---
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [menuName, setMenuName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDisplay, setFileDisplay] = useState('');
  const [showAllMenus, setShowAllMenus] = useState(false);

  // --- State: Advanced Upload Section ---
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const [chatBarText, setChatBarText] = useState('เมนูหลัก');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[1]);
  const [selectedAreaId, setSelectedAreaId] = useState('a');
  const [actions, setActions] = useState({});

  // --- State Sidebar Toggle ---
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const actionPanelRef = useRef(null);

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
      reader.onload = (e) => setUploadedImage(e.target.result);
      reader.readAsDataURL(file);
      processFile(file); // สำหรับ Logic Upload เดิม
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
    }
  }

  // --- Drag & Drop ---
  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;
    const handleDragOver = (e) => { e.preventDefault(); zone.classList.add('php-upload-zone-active'); };
    const handleDragLeave = () => { zone.classList.remove('php-upload-zone-active'); };
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

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) { setAlert({ type: 'error', message: 'กรุณาเลือกรูปภาพ' }); return; }
    if (!window.confirm('ยืนยันการสร้างเมนูใหม่?')) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('botKey', botKey);
      formData.append('menuName', menuName || `Traffy_${botKey}`);
      formData.append('menuImage', selectedFile);
      const response = await fetch('/api/richmenu/upload', { method: 'POST', body: formData });
      if (response.ok) {
        setAlert({ type: 'success', message: `สร้างเมนูสำเร็จ` });
        setMenuName(''); setSelectedFile(null); setUploadedImage(null);
        setTimeout(fetchData, 1000);
      }
    } catch (error) { setAlert({ type: 'error', message: error.message }); }
    finally { setUploading(false); }
  }

  async function handleSwitch(menuId) {
    if (!window.confirm('ต้องการเปลี่ยนไปใช้เมนูนี้หรือไม่?')) return;
    try {
      const response = await fetch('/api/richmenu/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });
      if (response.ok) { setAlert({ type: 'success', message: 'เปลี่ยนเมนูสำเร็จ' }); fetchData(); }
    } catch (error) { setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' }); }
  }

  async function handleDelete(menuId) {
    if (!window.confirm('ยืนยันการลบเมนูนี้อย่างถาวร?')) return;
    try {
      const response = await fetch('/api/richmenu/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });
      if (response.ok) { setAlert({ type: 'success', message: 'ลบเมนูเรียบร้อยแล้ว' }); fetchData(); }
    } catch (error) { setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' }); }
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  const visibleMenus = showAllMenus ? menus : menus.slice(0, 6);
  const activeMenu = menus.find(m => m.richMenuId === currentMenuId);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ✅ เรียกใช้คอมโพเนนต์ Sidebar ที่แยกออกมา */}
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      {/* ================= MAIN CONTENT ================= */}
      <div className={`mt-16 lg:mt-0 pt-0 lg:pt-6 transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30 animate-slide-in-left">
                <button onClick={() => setIsDesktopSidebarOpen(true)} className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300">
                    <Menu size={24} />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">Rich Menu Manager</h1>
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
                {activeMenu && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">LIVE</span>}
              </div>
              {activeMenu ? (
                <div className="php-current-menu-grid">
                  <div>
                    <div className="php-menu-img-container shadow-md border-emerald-100">
                      <div className="php-menu-img-placeholder">{getIcon('image')}</div>
                      <img src={activeMenu.imageUrl || `/api/richmenu/image?botKey=${botKey}&menuId=${activeMenu.richMenuId}`} alt="Current Menu" className="php-menu-img" />
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
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Chat Bar Text</span>
                      <p className="font-medium text-slate-700 text-lg">"{activeMenu.chatBarText}"</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <p>ยังไม่มีเมนูที่ตั้งค่าเป็น Default</p>
                </div>
              )}
            </section>

            {/* ==================== ADVANCED UPLOAD SECTION ==================== */}
            <section className="php-card transition-all duration-300">
              <div className={`php-upload-header cursor-pointer flex justify-between items-center -m-6 p-6 rounded-t-xl transition-all ${!isUploadExpanded ? '!rounded-b-xl !mb-[-24px]' : 'border-b border-gray-100'}`} onClick={() => setIsUploadExpanded(!isUploadExpanded)}>
                <h2 className="php-card-title flex items-center gap-2 text-base font-semibold m-0 text-slate-700">
                  <i className="fa-solid fa-cloud-arrow-up text-slate-400"></i> สร้างเมนูใหม่ (Upload New)
                </h2>
                <button type="button" className="text-slate-400">{isUploadExpanded ? getIcon('chevronUp') : getIcon('chevronDown')}</button>
              </div>

              {isUploadExpanded && (
                <div className="mt-6 animate-fade-in">
                  <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[750px]">
                    {/* LEFT PANEL */}
                    <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 flex flex-col h-full overflow-y-auto">
                      <div className="p-6 space-y-6 flex-1">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">ชื่อเมนู (Menu Name)</label>
                            <input type="text" value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="เช่น โปรโมชั่น" className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-green-500 outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">ข้อความบนแถบเมนู</label>
                            <input type="text" value={chatBarText} onChange={(e) => setChatBarText(e.target.value)} maxLength={14} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:border-green-500 outline-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">เทมเพลต (Template)</label>
                          <button onClick={() => setIsTemplateModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-green-300 bg-green-50 hover:bg-green-100 transition-all">
                            <div className="text-left font-bold text-green-700 text-sm">{selectedTemplate.name}</div>
                            <ChevronDown size={16} className="text-slate-400" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">รูปภาพพื้นหลัง</label>
                          <div ref={dropZoneRef} className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 bg-green-50 border-2 border-green-300 text-green-700 font-bold text-sm rounded-lg hover:border-green-500 flex items-center justify-center gap-2"><Upload size={16} /> อัปโหลดรูป</button>
                            {uploadedImage && <div className="mt-3 rounded-lg overflow-hidden border border-slate-200"><img src={uploadedImage} alt="Preview" className="w-full h-auto" /></div>}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10">
                        <button onClick={handleUpload} disabled={uploading || !uploadedImage || !menuName} className="w-full bg-[#06C755] hover:bg-[#05b04b] text-white px-4 py-3 rounded-xl text-base font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                          {uploading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Save size={20} />} บันทึก Rich Menu
                        </button>
                      </div>
                    </div>

                    {/* CENTER PANEL */}
                    <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden rounded-xl border border-slate-200 shadow-md">
                      <div className="h-14 bg-white border-b border-slate-200 flex justify-between items-center px-4 shrink-0">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Smartphone size={14} /> Preview & Mapping</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                        <div className="relative w-full max-w-[760px] mx-auto bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                          <div className="relative w-full bg-slate-100" style={{ aspectRatio: `${selectedTemplate.width}/${selectedTemplate.height}` }}>
                            {uploadedImage && <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none" />}
                            {selectedTemplate.areas.map((area) => (
                              <div key={area.id} onClick={() => handleAreaClick(area.id)} className={`absolute cursor-pointer transition-all ${selectedAreaId === area.id ? 'z-20 border-2 border-[#06C755] bg-[#06C755]/10' : 'z-10 border border-white/30 hover:bg-black/10'}`} style={{ left: `${(area.x / selectedTemplate.width) * 100}%`, top: `${(area.y / selectedTemplate.height) * 100}%`, width: `${(area.w / selectedTemplate.width) * 100}%`, height: `${(area.h / selectedTemplate.height) * 100}%` }}>
                                <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedAreaId === area.id ? 'bg-[#06C755] text-white' : 'bg-white/80 text-slate-500'}`}>{area.id.toUpperCase()}</div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-[#f8f8f8] text-slate-500 text-[10px] text-center py-1.5 font-medium border-t border-slate-200">{chatBarText} ▼</div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div ref={actionPanelRef} className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 flex flex-col h-full z-20 shadow-md lg:shadow-none relative">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm"><Settings size={16} className="text-[#06C755]" /> ตั้งค่าการทำงาน (Action)</h3>
                        <p className="text-xs text-slate-500 mt-1">พื้นที่ที่เลือก: <span className="font-bold bg-green-100 text-green-700 px-1.5 rounded uppercase">{selectedAreaId}</span></p>
                      </div>
                      <div className="p-5 flex-1 overflow-y-auto space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-700 uppercase">เลือกรูปแบบ Action</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['link', 'text', 'api'].map(type => (
                              <button key={type} onClick={() => updateAction('type', type)} className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 text-xs transition-all ${currentAction.type === type ? 'bg-green-100 border-green-600 text-green-700' : 'bg-slate-100 border-slate-300'}`}>
                                <i className={`fa-solid fa-${type === 'link' ? 'link' : type === 'text' ? 'keyboard' : 'bolt'}`}></i> {type.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="h-px bg-slate-100"></div>
                        <div className="space-y-4">
                          {currentAction.type === 'link' && <input type="url" value={currentAction.url || ''} onChange={(e) => updateAction('url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-green-500 outline-none" />}
                          {currentAction.type === 'text' && <textarea rows={3} value={currentAction.text || ''} onChange={(e) => updateAction('text', e.target.value)} placeholder="ข้อความที่จะส่ง..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:border-green-500 outline-none" />}
                          {currentAction.type === 'api' && <input type="text" value={currentAction.data || ''} onChange={(e) => updateAction('data', e.target.value)} placeholder="postback data..." className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:border-green-500 outline-none" />}
                        </div>
                      </div>
                      <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button onClick={() => setActions(prev => { const n = { ...prev }; delete n[selectedAreaId]; return n; })} className="w-full py-2 text-xs text-white font-bold bg-red-500 rounded-lg hover:bg-red-600">ล้างค่า (Clear Action)</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Template Selection Modal */}
            {isTemplateModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><LayoutGrid className="text-[#06C755]" /> เลือกรูปแบบ Rich Menu</h3>
                    <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => handleTemplateChange(t)} className={`relative bg-white border-2 rounded-xl p-4 transition-all ${selectedTemplate.id === t.id ? 'border-[#06C755] ring-1 ring-[#06C755]' : 'border-slate-200'}`}>
                          <div className="aspect-[2500/1686] bg-slate-100 rounded-lg mb-3 border border-slate-200 overflow-hidden relative">
                            {t.areas.map((a, i) => <div key={i} className="absolute bg-white border border-slate-300" style={{ left: `${(a.x / t.width) * 100}%`, top: `${(a.y / t.height) * 100}%`, width: `${(a.w / t.width) * 100}%`, height: `${(a.h / t.height) * 100}%` }} />)}
                          </div>
                          <div className="text-left font-bold text-slate-700 text-sm">{t.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== HISTORY SECTION ==================== */}
            <section className="php-card">
              <div className="php-card-header"><h2 className="php-card-title">ประวัติ Rich Menu</h2></div>
              {menus.length > 0 ? (
                <>
                  <div className="php-menu-list">
                    {visibleMenus.map((menu) => {
                      const isCurrent = menu.richMenuId === currentMenuId;
                      return (
                        <div key={menu.richMenuId} className={`php-menu-item ${isCurrent ? 'active' : ''}`}>
                          <div className="php-menu-img-container">
                            <div className="php-menu-img-placeholder">{getIcon('image')}</div>
                            <img src={menu.imageUrl || `/api/richmenu/image?botKey=${botKey}&menuId=${menu.richMenuId}`} alt={menu.name} className="php-menu-img" />
                          </div>
                          <div className="php-menu-status">
                            <div className="php-menu-details">
                              <h3>{menu.name}</h3>
                              <p>{menu.chatBarText}</p>
                              <div className="php-menu-id">{menu.richMenuId}</div>
                            </div>
                            <span className={`php-status-badge ${isCurrent ? 'php-status-active' : 'php-status-inactive'}`}>{isCurrent ? 'Active' : 'Inactive'}</span>
                          </div>
                          {!isCurrent ? (
                            <div className="php-menu-actions">
                              <button onClick={() => handleSwitch(menu.richMenuId)} className="php-btn-action php-btn-switch">{getIcon('refresh')} ใช้เมนูนี้</button>
                              <button onClick={() => handleDelete(menu.richMenuId)} className="php-btn-action php-btn-delete">{getIcon('trash')} ลบ</button>
                            </div>
                          ) : (
                            <div className="php-menu-actions"><button disabled className="php-btn-action php-btn-disabled">{getIcon('check')} ใช้งานอยู่</button></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {menus.length > 6 && !showAllMenus && (
                    <button onClick={() => setShowAllMenus(true)} className="php-btn-secondary">ดูเพิ่มเติม (อีก {menus.length - 6} รายการ) ▼</button>
                  )}
                </>
              ) : (
                <div className="php-empty-state"><p>ไม่พบประวัติเมนูในระบบ</p></div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}