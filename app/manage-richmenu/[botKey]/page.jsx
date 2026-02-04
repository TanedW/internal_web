"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import "@fortawesome/fontawesome-free/css/all.css";
import {
  Menu,
  X,
  LayoutGrid,
  ChevronDown,
  Save,
  Smartphone,
  Upload,
  Settings,
  PlusCircle,
  ArrowRightLeft,
  History,
  User,
  Type,
  Zap,
  Globe,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  MousePointer2,
} from "lucide-react";
import "../richmenu-dashboard.css";

// ✅ นำเข้า Sidebar จากไฟล์คอมโพเนนต์ภายนอก
import Sidebar from "../../components/sidebar";

// --- Templates Configuration (คงไว้ตามเดิมเป๊ะ) ---
const CUSTOM_HEIGHT = 1061;
const TOP_ROW_HEIGHT = Math.round(CUSTOM_HEIGHT * 0.275);
const BOTTOM_ROW_HEIGHT = CUSTOM_HEIGHT - TOP_ROW_HEIGHT;

const TEMPLATES = [
  {
    id: "large_6",
    name: "Large: 6 ช่อง (3x2)",
    type: "large",
    areas: [
      { id: "a", x: 0, y: 0, w: 833, h: 843 },
      { id: "b", x: 833, y: 0, w: 834, h: 843 },
      { id: "c", x: 1667, y: 0, w: 833, h: 843 },
      { id: "d", x: 0, y: 843, w: 833, h: 843 },
      { id: "e", x: 833, y: 843, w: 834, h: 843 },
      { id: "f", x: 1667, y: 843, w: 833, h: 843 },
    ],
    width: 2500,
    height: 1686,
    desc: "ขนาดใหญ่ มาตรฐาน",
  },
  {
    id: "large_1_5",
    name: "Custom: 6 ช่อง (สัดส่วน 760x322.5)",
    type: "compact",
    areas: [
      { id: "a", x: 0, y: 0, w: 2500, h: TOP_ROW_HEIGHT },
      { id: "b", x: 0, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: "c", x: 500, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: "d", x: 1000, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: "e", x: 1500, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
      { id: "f", x: 2000, y: TOP_ROW_HEIGHT, w: 500, h: BOTTOM_ROW_HEIGHT },
    ],
    width: 2500,
    height: CUSTOM_HEIGHT,
    desc: "ปรับสัดส่วนตามที่กำหนด (1061px height)",
  },
  {
    id: "large_4",
    name: "Large: 4 ช่อง (2x2)",
    type: "large",
    areas: [
      { id: "a", x: 0, y: 0, w: 1250, h: 843 },
      { id: "b", x: 1250, y: 0, w: 1250, h: 843 },
      { id: "c", x: 0, y: 843, w: 1250, h: 843 },
      { id: "d", x: 1250, y: 843, w: 1250, h: 843 },
    ],
    width: 2500,
    height: 1686,
    desc: "ขนาดใหญ่ ยอดนิยม",
  },
  {
    id: "large_3",
    name: "Large: 3 ช่อง",
    type: "large",
    areas: [
      { id: "a", x: 0, y: 0, w: 2500, h: 843 },
      { id: "b", x: 0, y: 843, w: 1250, h: 843 },
      { id: "c", x: 1250, y: 843, w: 1250, h: 843 },
    ],
    width: 2500,
    height: 1686,
    desc: "เน้นโปรโมชั่นด้านบน",
  },
  {
    id: "compact_2",
    name: "Compact: 2 ช่อง",
    type: "compact",
    areas: [
      { id: "a", x: 0, y: 0, w: 1250, h: 843 },
      { id: "b", x: 1250, y: 0, w: 1250, h: 843 },
    ],
    width: 2500,
    height: 843,
    desc: "ขนาดเล็ก ประหยัดพื้นที่",
  },
  {
    id: "compact_1",
    name: "Compact: 1 ช่อง (เต็ม)",
    type: "compact",
    areas: [{ id: "a", x: 0, y: 0, w: 2500, h: 843 }],
    width: 2500,
    height: 843,
    desc: "ขนาดเล็ก รูปเดียวเต็มจอ",
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
  const [menuName, setMenuName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDisplay, setFileDisplay] = useState("");
  const [showAllMenus, setShowAllMenus] = useState(false);

  // --- State: Advanced Upload Section ---
  const [isUploadExpanded, setIsUploadExpanded] = useState(true);
  const [chatBarText, setChatBarText] = useState("เมนูหลัก");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[1]);
  const [selectedAreaId, setSelectedAreaId] = useState("a");
  const [actions, setActions] = useState({});
  const [imagePreview, setImagePreview] = useState(null); // สำหรับเก็บ URL รูปมาโชว์ตัวอย่าง

  // --- State Sidebar Toggle ---
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // --- ✅ New State: Audit Log Modal ---
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // --- ✅ Refs for Scroll Targets ---
  const uploadSectionRef = useRef(null);
  const historySectionRef = useRef(null);

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
      actionPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const updateAction = (field, value) => {
    setActions((prev) => ({
      ...prev,
      [selectedAreaId]: {
        ...prev[selectedAreaId],
        type: prev[selectedAreaId]?.type || "link",
        [field]: value,
      },
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) {
        setAlert({ type: "error", message: "ขนาดไฟล์ต้องไม่เกิน 1MB" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target.result);
      reader.readAsDataURL(file);
      processFile(file); // สำหรับ Logic Upload เดิม
    }
  };

  const currentArea = selectedTemplate.areas.find(
    (a) => a.id === selectedAreaId,
  );
  const currentAction = actions[selectedAreaId] || {
    type: "link",
    data: "",
    label: "",
  };

  // ==========================================
  // ✅ NEW: SCROLL HANDLERS
  // ==========================================
  const scrollToUpload = () => {
    setIsUploadExpanded(true);
    setTimeout(() => {
      uploadSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const scrollToHistory = () => {
    historySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openAuditLog = () => {
    setIsLogModalOpen(true);
  };

  // --- เพิ่มโค้ดนี้ลงใน RichMenuDashboard ---

  // --- เพิ่มฟังก์ชันนี้เพื่อจัดการการเลือกรูปภาพ ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ ปรับให้ครอบคลุมทั้ง image/jpeg (ซึ่งรวม .jpg และ .jpeg)
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!validTypes.includes(file.type)) {
      alert("รองรับเฉพาะไฟล์ PNG และ JPG/JPEG เท่านั้น");
      return;
    }

    // เช็คขนาดไฟล์ (ไม่เกิน 1MB ตามที่เขียนใน UI)
    if (file.size > 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // 3. ตรวจสอบ Resolution (Optional: เตือนถ้าขนาดไม่ตรงมาตรฐาน LINE)
        const isStandardSize =
          img.width === 2500 && (img.height === 1686 || img.height === 843);
        if (!isStandardSize) {
          console.warn(
            "ขนาดรูปภาพไม่ใช่มาตรฐาน LINE (2500x1686 หรือ 2500x843)",
          );
        }

        // เก็บรูปภาพลง State เพื่อนำไปแสดงในหน้า Preview
        setUploadedImage(event.target.result);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setUploadedImage(file); // สำหรับส่งไป Server
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result); // สำหรับโชว์บนหน้าจอ
    };
    reader.readAsDataURL(file);
  }
};

  // ==========================================
  // MAIN LOGIC
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData();
      } else {
        router.push("/");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [botKey, router]);

  async function fetchData() {
    try {
      const response = await fetch(`/api/richmenu/bots`);
      const botData = await response.json();
      if (!botData || botData.error) {
        router.push("/manage-richmenu");
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
      console.error("Error:", error);
    }
  }

  // --- Drag & Drop ---
  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;
    const handleDragOver = (e) => {
      e.preventDefault();
      zone.classList.add("php-upload-zone-active");
    };
    const handleDragLeave = () => {
      zone.classList.remove("php-upload-zone-active");
    };
    const handleDrop = (e) => {
      e.preventDefault();
      zone.classList.remove("php-upload-zone-active");
      const files = e.dataTransfer?.files;
      if (files?.length) processFile(files[0]);
    };
    zone.addEventListener("dragover", handleDragOver);
    zone.addEventListener("dragleave", handleDragLeave);
    zone.addEventListener("drop", handleDrop);
    return () => {
      zone.removeEventListener("dragover", handleDragOver);
      zone.removeEventListener("dragleave", handleDragLeave);
      zone.removeEventListener("drop", handleDrop);
    };
  }, [isUploadExpanded]);

  function processFile(file) {
    if (file && file.type.includes("image")) {
      setSelectedFile(file);
      setFileDisplay(`เลือกไฟล์: ${file.name}`);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setAlert({ type: "error", message: "กรุณาเลือกรูปภาพ" });
      return;
    }
    // 1. ถามยืนยันก่อนเริ่มกระบวนการ
    const confirmUseNow = window.confirm(
      "คุณต้องการบันทึกและเปลี่ยนมาใช้เมนูนี้ให้กับผู้ใช้ทุกคนทันทีเลยหรือไม่?\n\n- ตกลง: บันทึกและเปลี่ยนเมนูทันที\n- ยกเลิก: บันทึกเก็บไว้ในประวัติเท่านั้น",
    );
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("botKey", botKey);
      formData.append("menuName", menuName || `Traffy_${botKey}`);
      formData.append("menuImage", selectedFile);
      const response = await fetch("/api/richmenu/upload", {
        method: "POST",
        body: formData,
      });
      if (confirmUseNow) {
        // เรียก API switch เมนูทันที
        await fetch("/api/richmenu/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            botKey,
            menuId: newMenuId, // ID ที่ได้จากการสร้างใหม่
            type: "batch",
          }),
        });
        alert("บันทึกและเปลี่ยนเมนูสำเร็จ!");
      } else {
        alert("บันทึกเมนูลงในประวัติเรียบร้อยแล้ว");
      }

      fetchMenus();
      setUploadedImage(null);
      setMenuName("");
    } catch (error) {
      console.error("Upload Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setUploading(false);
    }
  }

  // ตรวจสอบให้แน่ใจว่าเหลือแค่ก้อนนี้ก้อนเดียวในไฟล์
  async function handleSwitch(menuId) {
    // เพิ่มการยืนยันก่อนเปลี่ยน
    if (
      !window.confirm(
        "คุณแน่ใจหรือไม่ที่จะเปลี่ยนไปใช้เมนูนี้ให้กับผู้ใช้ทุกคน?",
      )
    )
      return;

    setLoading(true);
    try {
      const response = await fetch("/api/richmenu/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botKey,
          menuId,
          type: "batch",
        }),
      });

      if (response.ok) {
        alert("เปลี่ยนเมนูสำเร็จ!");
        // อัปเดต UI ให้เมนูที่เลือกกลายเป็น 'ใช้งานอยู่'
        setCurrentMenuId(menuId);
        // โหลดข้อมูลใหม่เพื่อให้สถานะ is_active ในรายการประวัติอัปเดตตาม
        fetchMenus();
      } else {
        const errorData = await response.json();
        alert(
          `เกิดข้อผิดพลาด: ${errorData.error || "ไม่สามารถเปลี่ยนเมนูได้"}`,
        );
      }
    } catch (error) {
      console.error("Switch Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(menuId) {
    if (!window.confirm("ยืนยันการลบเมนูนี้อย่างถาวร?")) return;
    try {
      const response = await fetch("/api/richmenu/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botKey, menuId }),
      });
      if (response.ok) {
        setAlert({ type: "success", message: "ลบเมนูเรียบร้อยแล้ว" });
        fetchData();
      }
    } catch (error) {
      setAlert({ type: "error", message: "เกิดข้อผิดพลาด" });
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );

  const visibleMenus = showAllMenus ? menus : menus.slice(0, 6);
  const activeMenu = menus.find((m) => m.richMenuId === currentMenuId);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link
        href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
        rel="stylesheet"
        type="text/css"
      />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ✅ เรียกใช้คอมโพเนนต์ Sidebar ที่แยกออกมา */}
      <Sidebar
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
      />

      {/* ================= MAIN CONTENT ================= */}
      <div
        className={`mt-16 lg:mt-0 pt-0 lg:pt-6 transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}
      >
        {!isDesktopSidebarOpen && (
          <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30 animate-slide-in-left">
            <button
              onClick={() => setIsDesktopSidebarOpen(true)}
              className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"
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
            <div
              className={`php-nav-bar ${!isDesktopSidebarOpen ? "lg:mt-16" : ""} transition-all duration-300`}
            >
              <Link href="/manage-richmenu" className="php-btn-back">
                {getIcon("back")} กลับหน้าเลือกบอท
              </Link>
            </div>

            {/* ✅ ADDED: Quick Action Buttons (วางตรงนี้ตามที่ขอ) */}
            <div className="php-qa-grid animate-fade-in-up">
              {/* ปุ่ม 1: เพิ่มเมนูใหม่ */}
              <button onClick={scrollToUpload} className="php-qa-btn">
                <div className="php-qa-content">
                  <h3>เพิ่มเมนูใหม่</h3>
                  <p>Upload และสร้าง Rich Menu ใหม่</p>
                </div>
                <div className="php-qa-icon green">
                  <PlusCircle size={20} />
                </div>
              </button>

              {/* ปุ่ม 2: เปลี่ยน Rich Menu */}
              <button onClick={scrollToHistory} className="php-qa-btn">
                <div className="php-qa-content">
                  <h3>เปลี่ยน Rich menu</h3>
                  <p>สลับเมนูที่ใช้งานอยู่ปัจจุบัน</p>
                </div>
                <div className="php-qa-icon blue">
                  <ArrowRightLeft size={20} />
                </div>
              </button>

              {/* ปุ่ม 3: ประวัติ */}
              <button onClick={openAuditLog} className="php-qa-btn">
                <div className="php-qa-content">
                  <h3>ประวัติการใช้งาน</h3>
                  <p>ดูบันทึก Audit Log</p>
                </div>
                <div className="php-qa-icon amber">
                  <History size={20} />
                </div>
              </button>
            </div>

            {/* Alert */}
            {alert && (
              <div
                className={`php-alert ${alert.type === "success" ? "php-alert-success" : "php-alert-error"}`}
              >
                {getIcon(alert.type === "success" ? "check" : "x")}
                <span>{alert.message}</span>
              </div>
            )}

            {/* ==================== ADVANCED UPLOAD SECTION ==================== */}
            <section
              ref={uploadSectionRef}
              className="php-card transition-all duration-300"
            >
              <div
                className={`php-upload-header cursor-pointer flex justify-between items-center -m-6 p-6 rounded-t-xl transition-all ${!isUploadExpanded ? "!rounded-b-xl !mb-[-24px]" : "border-b border-gray-100"}`}
                onClick={() => setIsUploadExpanded(!isUploadExpanded)}
              >
                <h2 className="php-card-title flex items-center gap-2 text-base font-semibold m-0 text-slate-700">
                  <i className="fa-solid fa-cloud-arrow-up text-slate-400"></i>{" "}
                  สร้างเมนูใหม่ (Upload New)
                </h2>
                <button type="button" className="text-slate-400">
                  {isUploadExpanded
                    ? getIcon("chevronUp")
                    : getIcon("chevronDown")}
                </button>
              </div>

              {isUploadExpanded && (
                <div className="mt-6 animate-fade-in">
                  <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[750px]">
                    {/* LEFT PANEL */}
                    <div className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 flex flex-col h-full overflow-y-auto">
                      <div className="p-4 space-y-4 flex-1">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">
                              ชื่อเมนู (Menu Name)
                            </label>
                            <div className="php-input-group">
                              <input
                                type="text"
                                value={menuName}
                                onChange={(e) => setMenuName(e.target.value)}
                                placeholder="เช่น โปรโมชั่น"
                                className="php-input-field"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">
                              ข้อความบนแถบเมนู
                            </label>
                            <div className="php-input-group">
                              <input
                                type="text"
                                value={chatBarText}
                                onChange={(e) => setChatBarText(e.target.value)}
                                maxLength={14}
                                className="php-input-field"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            เทมเพลต (Template)
                          </label>
                          <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="php-template-selector"
                          >
                            <div className="php-template-name">
                              {selectedTemplate.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-normal">
                                เปลี่ยน
                              </span>
                              <ChevronDown
                                size={16}
                                className="text-slate-400"
                              />
                            </div>
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            รูปภาพ Rich Menu
                          </label>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="php-upload-zone relative border-2 border-dashed border-slate-200 rounded-xl hover:border-[#06C755] transition-colors"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleImageChange} // เชื่อมต่อฟังก์ชันเลือกรูป
                            />
                              <div className="relative group">
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                  <p className="text-white text-xs font-medium">
                                    เปลี่ยนรูปภาพ
                                  </p>
                                </div>
                              </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png"
                              onChange={handleImageUpload}
                            />
                            <div className="php-upload-icon-wrapper">
                              <Upload size={24} />
                            </div>
                            <div className="php-upload-text">
                              <div className="php-upload-title">
                                คลิกเพื่ออัปโหลดรูปภาพ
                              </div>
                              <div className="php-upload-subtitle">
                                JPG, JPEG, PNG (สูงสุด 1MB)
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                2500x1686 หรือ 2500x843 px
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="action-settings-card animate-in fade-in slide-in-from-top-4">
                          {/* ส่วนหัว */}
                          <div className="action-settings-header">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                              <Settings size={16} className="text-[#06C755]" />
                              ตั้งค่า Action สำหรับช่อง:{" "}
                              <span className="text-green-600 uppercase">
                                {selectedAreaId}
                              </span>
                            </h3>
                            <button
                              onClick={() =>
                                setActions((prev) => {
                                  const n = { ...prev };
                                  delete n[selectedAreaId];
                                  return n;
                                })
                              }
                              className="text-[10px] text-red-500 hover:underline font-medium"
                            >
                              ล้างค่าช่องนี้
                            </button>
                          </div>

                          {/* ส่วนเนื้อหา */}
                          <div className="action-settings-body space-y-5">
                            {/* Selector Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => updateAction("type", "link")}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all ${currentAction.type === "link" ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                              >
                                <LinkIcon size={18} /> Link
                              </button>
                              <button
                                onClick={() => updateAction("type", "text")}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all ${currentAction.type === "text" ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                              >
                                <Type size={18} /> Text
                              </button>
                              <button
                                onClick={() => updateAction("type", "api")}
                                className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-xs font-bold transition-all ${currentAction.type === "api" ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                              >
                                <Zap size={18} /> API
                              </button>
                            </div>

                            {/* Input Fields */}
                            <div className="pt-2">
                              {currentAction.type === "link" && (
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Globe size={12} /> เว็บไซต์ปลายทาง (URL)
                                  </label>
                                  <input
                                    type="url"
                                    value={currentAction.url || ""}
                                    onChange={(e) =>
                                      updateAction("url", e.target.value)
                                    }
                                    placeholder="https://example.com"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-green-500 outline-none transition-all"
                                  />
                                </div>
                              )}

                              {currentAction.type === "text" && (
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Type size={12} /> ข้อความที่จะส่ง
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={currentAction.text || ""}
                                    onChange={(e) =>
                                      updateAction("text", e.target.value)
                                    }
                                    placeholder="พิมพ์ข้อความที่ต้องการ..."
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-green-500 outline-none transition-all resize-none"
                                  />
                                </div>
                              )}

                              {currentAction.type === "api" && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                      <Code size={12} /> Postback Data
                                    </label>
                                    <input
                                      type="text"
                                      value={currentAction.data || ""}
                                      onChange={(e) =>
                                        updateAction("data", e.target.value)
                                      }
                                      placeholder="action=buy&id=123"
                                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:border-green-500 outline-none"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                                      ข้อความแสดงผล (Display Text)
                                    </label>
                                    <input
                                      type="text"
                                      value={currentAction.displayText || ""}
                                      onChange={(e) =>
                                        updateAction(
                                          "displayText",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="กำลังทำรายการ..."
                                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-green-500 outline-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10">
                        <button
                          onClick={handleUpload} // ตรวจสอบว่าเรียกฟังก์ชันนี้
                          disabled={uploading || !uploadedImage || !menuName}
                          className={`w-full text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 
                          ${uploading || !uploadedImage || !menuName ? "bg-slate-300" : "bg-[#06C755] hover:bg-[#05b04b]"}`}
                        >
                          {uploading ? "กำลังบันทึก..." : "บันทึก Rich Menu"}
                        </button>
                      </div>
                    </div>

                    {/* CENTER PANEL */}
                    {/* <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden rounded-xl border border-slate-200 shadow-md">
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
                    </div> */}

                    {/* RIGHT PANEL */}
                    <div className="canvas-container">
                      {/* Toolbar */}
                      <div className="canvas-toolbar">
                        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <Smartphone size={14} /> Preview (Mobile Fit)
                        </span>
                      </div>
                      {/* Canvas Area - ปรับลด padding-top/bottom เพื่อให้ไม่กินที่ */}
                      <div className="canvas-viewport flex justify-center items-center py-4 bg-slate-50/50">
                        <div className="mobile-frame shadow-xl overflow-hidden flex flex-col bg-white">
                          {/* Status Bar - ปรับขนาด Text ให้เล็กลงอีกนิด */}
                          <div className="bg-[#071a2b] text-white p-2 flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1">
                              <span>13:11</span>
                            </div>
                            <div className="font-medium opacity-80">
                              Official Account
                            </div>
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-white/20"></div>
                            </div>
                          </div>

                          {/* Chat Background - ลดขนาดตัวหนังสือแชท */}
                          <div className="flex-1 bg-[#849fc2] relative p-3">
                            <div className="bg-white rounded-xl rounded-tl-none p-2 max-w-[85%] text-[11px] mb-3 shadow-sm leading-relaxed">
                              ยินดีต้อนรับ! เลือกเมนูด้านล่างได้เลยครับ
                            </div>
                          </div>
                          {/* Rich Menu Canvas */}
                          <div className="relative w-full border-t border-slate-200">
                            <div
                              className="relative w-full bg-slate-100"
                              style={{
                                // เช็คว่าถ้าเป็นภาพกว้างพิเศษ (Compact) ให้ใช้สัดส่วน 2500/843
                                // หรือจะใช้ค่าจาก selectedTemplate.width / selectedTemplate.height ก็ได้ถ้าคุณตั้งค่า Template ไว้ตรงกัน
                                aspectRatio: uploadedImage
                                  ? 2500 / 843
                                  : selectedTemplate.width /
                                    selectedTemplate.height,
                                maxHeight: "250px", // จำกัดความสูงไว้ไม่ให้ยาวเกินไปสำหรับหน้าจอ Mobile Preview
                              }}
                            >
                              {uploadedImage ? (
                                <img
                                  src={uploadedImage}
                                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                                  alt="Rich Menu"
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                  <ImageIcon size={48} />
                                  <span className="text-xs mt-2">
                                    ยังไม่มีรูปภาพ
                                  </span>
                                </div>
                              )}

                              {selectedTemplate.areas.map((area) => {
                                const isSelected = selectedAreaId === area.id;
                                const hasAction =
                                  actions[area.id]?.type &&
                                  actions[area.id]?.type !== "no_action";

                                const left =
                                  (area.x / selectedTemplate.width) * 100;
                                const top =
                                  (area.y / selectedTemplate.height) * 100;
                                const width =
                                  (area.w / selectedTemplate.width) * 100;
                                const height =
                                  (area.h / selectedTemplate.height) * 100;

                                return (
                                  <div
                                    key={area.id}
                                    onClick={() => setSelectedAreaId(area.id)}
                                    className={`area-grid-item ${isSelected ? "active" : ""}`}
                                    style={{
                                      left: `${left}%`,
                                      top: `${top}%`,
                                      width: `${width}%`,
                                      height: `${height}%`,
                                    }}
                                  >
                                    <div className="area-badge">
                                      {area.id.toUpperCase()}
                                    </div>

                                    {hasAction && (
                                      <div className="has-action-icon">
                                        <Check size={10} strokeWidth={4} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Chat Bar */}
                            <div className="php-chatbar border-t border-slate-200 bg-white text-[#2c3e50] font-medium py-3 text-center">
                              {chatBarText || "เมนูหลัก"}{" "}
                              <span className="text-[10px] ml-1">▼</span>
                            </div>
                          </div>

                          {/* Home Indicator */}
                          <div className="h-6 bg-white flex justify-center items-center">
                            <div className="w-24 h-1 bg-slate-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>

                      {/* Tooltip ด้านล่าง */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs text-slate-500 flex items-center gap-2 shadow-md border border-slate-100">
                        <MousePointer2 size={12} /> คลิกที่ช่องเพื่อกำหนด Action
                      </div>
                    </div>
                  </div>
                  {/* <div ref={actionPanelRef} className="w-full lg:w-80 bg-white rounded-xl border border-slate-200 flex flex-col h-full z-20 shadow-md lg:shadow-none relative">
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
                    </div> */}
                </div>
              )}
            </section>

            {/* Template Selection Modal */}
            {isTemplateModalOpen && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <LayoutGrid className="text-slate-400" /> เลือกรูปแบบ Rich
                      Menu
                    </h3>
                    <button
                      onClick={() => setIsTemplateModalOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-full"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto bg-slate-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateChange(t)}
                          className={`relative bg-white border-2 rounded-xl p-4 transition-all ${
                            selectedTemplate.id === t.id
                              ? "border-slate-400 php-template-card-active"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {/* ส่วนแสดงตัวอย่างกรอบสีเทา */}
                          <div className="php-template-preview mb-3">
                            {t.areas.map((a, i) => (
                              <div
                                key={i}
                                className="php-template-area-border"
                                style={{
                                  left: `${(a.x / t.width) * 100}%`,
                                  top: `${(a.y / t.height) * 100}%`,
                                  width: `${(a.w / t.width) * 100}%`,
                                  height: `${(a.h / t.height) * 100}%`,
                                }}
                              >
                                {a.id.toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-slate-700 text-sm">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {t.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ✅ NEW: Audit Log Modal (เพิ่มใหม่) */}
            {isLogModalOpen && (
              <div
                className="php-modal-overlay"
                onClick={() => setIsLogModalOpen(false)}
              >
                <div
                  className="php-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="php-modal-header">
                    <h3>
                      <Settings size={20} className="text-amber-500" />{" "}
                      ประวัติการใช้งาน (Audit Log)
                    </h3>
                    <button
                      onClick={() => setIsLogModalOpen(false)}
                      className="php-modal-close"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="php-modal-body">
                    {/* Mock Data */}
                    {[
                      {
                        user: "Admin 1",
                        action: "เปลี่ยน Rich Menu Active",
                        detail: "Promotion_Feb -> Main_Menu",
                        time: "10 นาทีที่แล้ว",
                      },
                      {
                        user: "Admin 2",
                        action: "อัปโหลดเมนูใหม่",
                        detail: "Promotion_March_2024",
                        time: "2 ชั่วโมงที่แล้ว",
                      },
                      {
                        user: "System",
                        action: "ลบเมนูเก่า",
                        detail: "Test_Menu_v1",
                        time: "เมื่อวาน, 14:30",
                      },
                      {
                        user: "Admin 1",
                        action: "เข้าสู่ระบบ",
                        detail: "Login via Firebase",
                        time: "เมื่อวาน, 09:00",
                      },
                    ].map((log, index) => (
                      <div key={index} className="php-log-item">
                        <div className="php-log-icon">
                          <User size={18} />
                        </div>
                        <div className="php-log-info">
                          <div className="php-log-top">
                            <span className="php-log-user">{log.user}</span>
                            <span className="php-log-time">{log.time}</span>
                          </div>
                          <div className="php-log-action">{log.action}</div>
                          <div className="php-log-detail">{log.detail}</div>
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "12px",
                        fontStyle: "italic",
                      }}
                    >
                      (ข้อมูลจำลอง - ระบบ Audit Log ยังไม่เปิดใช้งานจริง)
                    </div>
                  </div>
                  <div className="php-modal-footer">
                    <button
                      onClick={() => setIsLogModalOpen(false)}
                      className="php-btn-close-modal"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== เปลี่ยน Rich Menu ==================== */}
            {/* ค้นหาบรรทัดประมาณที่ 840 ในไฟล์ page.jsx */}
            <section ref={historySectionRef} className="php-card">
              <div className="php-card-header">
                <h2 className="php-card-title flex items-center gap-2">
                  <History size={18} /> เปลี่ยน Rich Menu
                </h2>
              </div>

              {/* วางโค้ดใหม่ทับตรงนี้แทนที่ของเดิมทั้งหมดจนถึงส่วนแสดง Error/Empty State */}
              {menus.length > 0 ? (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleMenus.map((menu) => {
                    const isCurrent = menu.richMenuId === currentMenuId;
                    const displayImageUrl =
                      menu.image_url ||
                      `/api/richmenu/image?botKey=${botKey}&menuId=${menu.richMenuId}`;

                    return (
                      <div
                        key={menu.richMenuId}
                        className={`rich-menu-card ${isCurrent ? "active-border" : ""}`}
                      >
                        <div className="relative aspect-[2500/843] bg-slate-50 overflow-hidden border-b border-slate-100">
                          <img
                            src={displayImageUrl}
                            alt={menu.name}
                            className="w-full h-full object-contain p-1"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/2500x843?text=No+Image";
                            }}
                          />
                          {isCurrent && (
                            <div className="absolute top-1 right-1 bg-[#06C755] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                              ใช้งานอยู่
                            </div>
                          )}
                        </div>

                        <div className="p-2 space-y-2">
                          <div>
                            <h3 className="font-bold text-[12px] text-slate-800 truncate leading-tight">
                              {menu.menu_name || menu.name}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-mono truncate">
                              ID: {menu.richMenuId}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 pt-1">
                            {isCurrent ? (
                              <button
                                disabled
                                className="btn-menu-disabled text-[11px] py-1"
                              >
                                <Check size={12} /> ใช้งานอยู่
                              </button>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => handleSwitch(menu.richMenuId)}
                                  className="btn-menu-switch text-[11px] py-1"
                                >
                                  ใช้เมนูนี้
                                </button>
                                <button
                                  onClick={() => handleDelete(menu.richMenuId)}
                                  className="btn-menu-delete text-[11px] py-1"
                                >
                                  ลบ
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="php-empty-state py-10 text-center">
                  <ImageIcon
                    className="mx-auto text-slate-300 mb-2"
                    size={48}
                  />
                  <p className="text-slate-500">ไม่พบประวัติเมนูในระบบ</p>
                </div>
              )}

              {/* ส่วนปุ่ม ดูเพิ่มเติม / แสดงน้อยลง */}
              {menus.length > 6 && (
                <div className="mt-4 flex justify-center pb-4 px-4">
                  <button
                    onClick={() => setShowAllMenus(!showAllMenus)}
                    className="php-btn-secondary"
                  >
                    {showAllMenus ? (
                      <>
                        แสดงน้อยลง
                        <ChevronDown
                          size={12}
                          className="rotate-180 transition-transform"
                        />
                      </>
                    ) : (
                      <>ดูเพิ่มเติม ({menus.length - 6}) ▼</>
                    )}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
