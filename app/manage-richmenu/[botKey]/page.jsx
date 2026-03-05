"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import "@fortawesome/fontawesome-free/css/all.css";
import Swal from "sweetalert2";
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
  Users,
  Type,
  Zap,
  Globe,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  CheckCircle,
  MousePointer2,
  Star,
  Pencil,
  Trash2,
  Loader2,
  Plus,
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
  const API = process.env.NEXT_PUBLIC_RICHMENU_DASHBOARD_API_URL;

  // --- State: Auth & Data ---
  const [user, setUser] = useState(null);
  const [bot, setBot] = useState(null);
  const [menus, setMenus] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- State: Rich Menu Logic ---
  const [uploading, setUploading] = useState(false);
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
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState("all");

  // --- ✅ New State: JSON Viewer Modal ---
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [selectedJsonData, setSelectedJsonData] = useState(null);

  // --- ✅ Segment State ---
  const [segments, setSegments] = useState([]);
  const [segmentFormModal, setSegmentFormModal] = useState(null); // null | { mode:'create'|'edit', data? }
  const [assignMenuModal, setAssignMenuModal] = useState(null);   // null | segment object
  const [usersModal, setUsersModal] = useState(null);             // null | segment object
  const [segmentUsers, setSegmentUsers] = useState([]);
  const [segmentUsersLoading, setSegmentUsersLoading] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserDisplayName, setNewUserDisplayName] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [segmentForm, setSegmentForm] = useState({ name: "", description: "", is_default: false });
  const [savingSegment, setSavingSegment] = useState(false);
  const [assigningMenu, setAssigningMenu] = useState(false);
  const [assignSelectedMenuId, setAssignSelectedMenuId] = useState("");

  // --- ✅ Flow Builder State ---
  const [flowSteps, setFlowSteps] = useState([]); // [{id, stateName, nextStateName, eventType, msgType, postbackData, actions:[]}]
  const [expandedFlowStep, setExpandedFlowStep] = useState(null);
  const [addingFlowAction, setAddingFlowAction] = useState(null); // stepId ที่กำลังเพิ่ม action
  const [newFlowAction, setNewFlowAction] = useState({
    order: 1,
    type: "text",
    payload: "",
  });
  const [showNewFlowStep, setShowNewFlowStep] = useState(false);
  const [selectedFlowStepId, setSelectedFlowStepId] = useState(null);
  const [newFlowStep, setNewFlowStep] = useState({
    stateName: "",
    nextStateName: "",
    eventType: "postback",
    msgType: "text",
    postbackData: "",
  });
  const [apiDisplayText, setApiDisplayText] = useState("");
  const [jsonError, setJsonError] = useState(""); // ✅ JSON validation error
  // compat: keep these so mappedAreas / upload still works
  const [apiStates, setApiStates] = useState([]);
  const [apiActionList, setApiActionList] = useState([]);
  const [areaFlowMap, setAreaFlowMap] = useState({});

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

  const resetUploadForm = () => {
    setUploading(false); // ✅ reset ปุ่มบันทึกให้กดได้ใหม่
    setMenuName("");
    setSelectedFile(null);
    setFileDisplay("");
    setUploadedImage(null);
    setActions({});
    setChatBarText("เมนูหลัก");
    setFlowSteps([]);
    setSelectedFlowStepId(null);
    setExpandedFlowStep(null);
    setAreaFlowMap({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    historySectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
    url: "", // เพิ่ม
    text: "", // เพิ่ม
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

  const openAuditLog = async () => {
    setIsLogModalOpen(true);
    setAuditLoading(true);
    try {
      const res = await fetch(
        `${API}?action=audit_logs&botKey=${encodeURIComponent(botKey)}`,
      );
      const data = await res.json();
      setAuditLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (!validTypes.includes(file.type)) {
      await Swal.fire({
        icon: "warning",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "รองรับเฉพาะไฟล์ PNG และ JPG/JPEG เท่านั้น",
      });
      return;
    }

    if (file.size > 1024 * 1024) {
      await Swal.fire({
        icon: "warning",
        title: "ไฟล์ใหญ่เกินไป",
        text: "ขนาดไฟล์ต้องไม่เกิน 1MB",
      });
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
        setSelectedFile(file);
        setFileDisplay(`เลือกไฟล์: ${file.name}`);
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
        setSelectedFile(file);
        setFileDisplay(`เลือกไฟล์: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const mappedAreas = selectedTemplate.areas.map((area) => {
    const action = actions[area.id] || {
      type: "link",
      url: "",
      text: "",
      data: "",
      label: "",
    };

    let lineActionType = action.type;
    if (action.type === "link") lineActionType = "uri";
    else if (action.type === "text") lineActionType = "message";
    else if (action.type === "api") lineActionType = "postback";

    const linkedStepIds = areaFlowMap[area.id] || [];
    const linkedSteps = flowSteps.filter((s) => linkedStepIds.includes(s.id));
    const triggerStep = linkedSteps[0];

    // ✅ label ต้องยาว 1-20 ตัวอักษร ห้ามว่าง
    const rawLabel = action.label || action.displayText || "เมนู";
    const safeLabel = rawLabel.substring(0, 20) || "เมนู";

    return {
      bounds: { x: area.x, y: area.y, width: area.w, height: area.h },
      action: {
        type: lineActionType,
        label: safeLabel,
        ...(action.type === "link" && {
          // ✅ ถ้า url ว่าง ใส่ fallback URL จริงๆ เพราะ LINE ไม่รับ uri ว่าง
          uri: action.url || "https://line.me",
        }),
        ...(action.type === "text" && {
          text: action.text || "เมนู",
        }),
        ...(action.type === "api" && {
          data: JSON.stringify({
            para: "go-to",
            "selected-value": {
              stateName: triggerStep?.stateName || "standby",
              eventType: triggerStep?.eventType || "postback",
              postbackData:
                triggerStep?.postbackData || action.data || "default",
            },
          }),
          displayText: action.displayText || action.label || "เมนู",
        }),
      },
      _flowStepIds: linkedStepIds,
    };
  });

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
      if (!botKey) {
        router.push("/manage-richmenu");
        return;
      }

      const [currentRes, listRes] = await Promise.all([
        fetch(`${API}?action=current&botKey=${botKey}`),
        fetch(`${API}?action=list&botKey=${botKey}`),
      ]);

      const [currentData, listData] = await Promise.all([
        currentRes.json(),
        listRes.json(),
      ]);

      const activeId = currentData.currentMenuId || null;
      setCurrentMenuId(activeId);

      if (listData.richmenus && Array.isArray(listData.richmenus)) {
        const sorted = [...listData.richmenus].sort((a, b) => {
          if (a.richMenuId === activeId) return -1;
          if (b.richMenuId === activeId) return 1;
          return 0;
        });
        setMenus(sorted);
      }

      // โหลด segments ด้วย
      fetchSegments();
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function fetchSegments() {
    try {
      const res = await fetch(`${API}?action=list_segments&botKey=${encodeURIComponent(botKey)}`);
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (err) {
      console.error("[fetchSegments]", err);
    }
  }

  async function fetchSegmentUsers(segmentId) {
    setSegmentUsersLoading(true);
    try {
      const res = await fetch(`${API}?action=segment_detail&botKey=${encodeURIComponent(botKey)}&segmentId=${segmentId}`);
      const data = await res.json();
      setSegmentUsers(data.users || []);
    } catch { setSegmentUsers([]); }
    finally { setSegmentUsersLoading(false); }
  }

  async function handleSaveSegment() {
    if (!segmentForm.name.trim()) return;
    setSavingSegment(true);
    try {
      const isEdit = segmentFormModal?.mode === "edit";
      const body = isEdit
        ? { segmentId: segmentFormModal.data.id, ...segmentForm, adminEmail: user?.email }
        : { botKey: decodeURIComponent(botKey), ...segmentForm, adminEmail: user?.email };
      const res = await fetch(`${API}?action=${isEdit ? "update_segment" : "create_segment"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSegmentFormModal(null);
        setSegmentForm({ name: "", description: "", is_default: false });
        fetchSegments();
      } else {
        await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: data.error });
      }
    } finally { setSavingSegment(false); }
  }

  async function handleDeleteSegment(segment) {
    const confirm = await Swal.fire({
      title: `ลบ Segment "${segment.name}"?`,
      text: "Segment จะถูกซ่อน แต่ข้อมูล user ยังคงอยู่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;
    await fetch(`${API}?action=delete_segment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segmentId: segment.id, adminEmail: user?.email }),
    });
    fetchSegments();
  }

  async function handleAssignSegmentMenu() {
    if (!assignSelectedMenuId || !assignMenuModal) return;
    setAssigningMenu(true);
    try {
      const menu = menus.find((m) => m.richMenuId === assignSelectedMenuId);
      const res = await fetch(`${API}?action=assign_segment_menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: assignMenuModal.id,
          richMenuId: assignSelectedMenuId,
          richMenuName: menu?.name || assignSelectedMenuId,
          botKey: decodeURIComponent(botKey),
          adminEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignMenuModal(null);
        setAssignSelectedMenuId("");
        await Swal.fire({ icon: "success", title: "สำเร็จ!", text: data.message, timer: 1500, showConfirmButton: false });
        fetchSegments();
      } else {
        await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: data.error });
      }
    } finally { setAssigningMenu(false); }
  }

  async function handleAddSegmentUser() {
    if (!newUserId.trim() || !usersModal) return;
    setAddingUser(true);
    try {
      const res = await fetch(`${API}?action=add_segment_users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segmentId: usersModal.id,
          botKey: decodeURIComponent(botKey),
          users: [{ lineUserId: newUserId.trim(), displayName: newUserDisplayName.trim() || null }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUserId("");
        setNewUserDisplayName("");
        fetchSegmentUsers(usersModal.id);
      }
    } finally { setAddingUser(false); }
  }

  async function handleRemoveSegmentUser(lineUserId) {
    const confirm = await Swal.fire({
      title: "ลบ user ออกจาก segment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;
    await fetch(`${API}?action=remove_segment_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segmentId: usersModal.id, botKey: decodeURIComponent(botKey), lineUserId }),
    });
    fetchSegmentUsers(usersModal.id);
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

    // ✅ เพิ่มส่วนนี้ใหม่ - ตรวจสอบ botKey ก่อน
    if (!botKey) {
      await Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "ไม่พบ Bot Key กรุณาตรวจสอบ URL",
      });
      console.error("botKey is missing:", botKey);
      return;
    }

    if (!selectedFile) {
      await Swal.fire({
        icon: "warning",
        title: "แจ้งเตือน",
        text: "กรุณาเลือกรูปภาพ",
      });
      return;
    }

    // 1. ถามยืนยันการใช้งาน
    // 1. ถามยืนยันการใช้งานด้วย SweetAlert2
    const confirmResult = await Swal.fire({
      title: "ยืนยันการบันทึกเมนู",
      text: "คุณต้องการเปลี่ยนมาใช้เมนูนี้ทันทีหรือไม่?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: "#06C755",
      denyButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง - เปลี่ยนใช้ทันที",
      denyButtonText: "บันทึกไว้เท่านั้น",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    // ถ้ากดยกเลิก ไม่ทำอะไร
    if (confirmResult.isDismissed) {
      return;
    }

    // เก็บค่าว่าจะเปลี่ยนใช้ทันทีหรือไม่
    const confirmUseNow = confirmResult.isConfirmed;

    setUploading(true);
    try {
      // ✅ Decode botKey ก่อนส่ง
      const decodedBotKey = decodeURIComponent(botKey);

      console.log("=== UPLOAD DEBUG ===");
      console.log("📌 Original botKey:", botKey); // %40vui7526q
      console.log("📌 Decoded botKey:", decodedBotKey); // @vui7526q

      // ✅ Validate areas ก่อนส่ง
      if (!mappedAreas || mappedAreas.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "แจ้งเตือน",
          text: "กรุณาสร้างพื้นที่คลิกอย่างน้อย 1 พื้นที่",
        });
        setUploading(false);
        return;
      }

      // ✅ Validate แต่ละ area ว่ามี action หรือไม่
      const hasInvalidArea = mappedAreas.some(
        (area) => !area.action || !area.action.type,
      );

      if (hasInvalidArea) {
        await Swal.fire({
          icon: "warning",
          title: "แจ้งเตือน",
          text: "พื้นที่บางพื้นที่ยังไม่ได้กำหนด Action",
        });
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("botKey", decodedBotKey); // ✅ ใช้ decoded

      // ✅ เพิ่มบรรทัดนี้ใหม่ - Debug log
      console.log("📌 botKey being sent:", botKey);

      formData.append("menuName", menuName || `Menu_${botKey}`);
      formData.append("menuImage", selectedFile);
      // ส่ง Firebase UID ของผู้ใช้ที่ล็อกอินอยู่
      if (user?.email) {
        formData.append("creatorId", user.email); // ✅ ส่ง email แทน uid เพื่อ lookup ใน admin_system
      }

      // ✅ เพิ่มส่วนนี้: ส่งโครงสร้างปุ่ม (Action) ที่ตั้งค่าจากหน้าเว็บไปที่ API
      // mappedAreas คือ State ที่เก็บ Array ของตำแหน่งปุ่มและ Action ต่างๆ (Link, Postback, Text)
      const lineAreas = mappedAreas.map(({ _flowStepIds, ...area }) => area);
      formData.append("areas", JSON.stringify(lineAreas));

      // ✅ เพิ่ม: ส่งข้อความแถบเมนู (Chat Bar Text) และขนาดของ template
      formData.append("chatBarText", chatBarText || "เมนูหลัก");
      formData.append(
        "size",
        JSON.stringify({
          width: selectedTemplate.width,
          height: selectedTemplate.height,
        }),
      );

      console.log("Sending data:", {
        botKey,
        menuName: menuName || `Menu_${botKey}`,
        areasCount: mappedAreas.length,
        chatBarText: chatBarText || "เมนูหลัก",
        templateSize: `${selectedTemplate.width}x${selectedTemplate.height}`,
      });

      const response = await fetch(`${API}?action=upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      console.log("API Response:", result);
      console.log("Response Status:", response.status);

      if (!response.ok) {
        const errorMsg =
          result.error ||
          result.message ||
          result.details ||
          "ไม่สามารถอัปโหลดได้";
        console.error("API Error Details:", result);
        throw new Error(errorMsg);
      }

      // ดึง richMenuId ที่เพิ่งสร้างสำเร็จมาจาก API response
      const newMenuId = result.richMenuId;

      if (!newMenuId) {
        throw new Error("ไม่ได้รับ richMenuId จาก API");
      }

      // ✅ บันทึก flow (state + action-list) ลง DB ถ้ามี flowSteps
      console.log(
        "[save_flow] flowSteps ที่จะส่ง:",
        JSON.stringify(flowSteps, null, 2),
      );
      if (flowSteps && flowSteps.length > 0) {
        try {
          const saveFlowRes = await fetch(`${API}?action=save_flow`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              botKey: decodeURIComponent(botKey),
              botName: bot?.bot_name || botKey,
              flowSteps,
              areaFlowMap,
            }),
          });
          const saveFlowData = await saveFlowRes.json();
          console.log(
            "[save_flow]",
            saveFlowData.message || saveFlowData.error,
          );
        } catch (flowErr) {
          console.warn("[save_flow] error:", flowErr.message);
        }
      }

      // 2. ถ้ากดยืนยันว่าจะใช้ทันที และเราได้ ID ใหม่มาแล้ว
      if (confirmUseNow && newMenuId) {
        try {
          // ✅ เรียก API เปลี่ยนเมนู (ใช้ GET แทน POST)
          const cleanBotKey = decodeURIComponent(botKey);
          const queryParams = new URLSearchParams({
            botKey: cleanBotKey,
            menuId: newMenuId,
            type: "batch",
            adminId: user?.email || "",   // ✅ ส่ง email เพื่อ lookup admin_system
          });

          const switchResponse = await fetch(
            `${API}?action=switch&${queryParams.toString()}`,
            {
              method: "GET",
            },
          );

          const switchData = await switchResponse.json();

          // ✅ ตรวจสอบว่าเปลี่ยนสำเร็จหรือไม่
          if (!switchResponse.ok) {
            throw new Error(switchData.error || "ไม่สามารถเปลี่ยนเมนูได้");
          }

          // ✅ แสดง Success และรีเฟรชข้อมูล
          await Swal.fire({
            icon: "success",
            title: "สำเร็จ!",
            text: "บันทึกและเปิดใช้งานเมนูใหม่สำเร็จ!",
            timer: 1500,
            showConfirmButton: false,
          });

          // ✅ รีเฟรชข้อมูลและฟอร์ม
          fetchData();
          resetUploadForm();
        } catch (switchError) {
          console.error("Switch menu error:", switchError);
          await Swal.fire({
            icon: "warning",
            title: "บันทึกสำเร็จ แต่เปลี่ยนเมนูไม่สำเร็จ",
            text: "เมนูถูกบันทึกแล้ว แต่ไม่สามารถเปลี่ยนเป็นเมนูหลักได้ กรุณาเปลี่ยนด้วยตนเองในหน้าประวัติ",
            confirmButtonText: "ตกลง",
          });

          // ✅ รีเฟรชข้อมูลและฟอร์ม แม้ว่าจะเปลี่ยนเมนูไม่สำเร็จ
          fetchData();
          resetUploadForm();
        }
      } else {
        // ✅ แค่บันทึก ไม่เปลี่ยนเมนู
        await Swal.fire({
          icon: "success",
          title: "สำเร็จ!",
          text: "บันทึกเมนูเรียบร้อยแล้ว (สามารถเปิดใช้งานภายหลังได้จากส่วนประวัติ)",
          timer: 1500,
          showConfirmButton: false,
        });

        // ✅ รีเฟรชข้อมูลและฟอร์ม
        fetchData();
        resetUploadForm();
      }
    } catch (error) {
      setUploading(false);
      console.error("Upload Error:", error);
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถอัปโหลดได้",
      });
    }
  }

  // ฟังก์ชันสำหรับเปลี่ยน Rich Menu
  const handleSwitch = async (menuId, type = "batch") => {
    const result = await Swal.fire({
      title: "ยืนยันการเปลี่ยนเมนู?",
      text: "คุณต้องการเปลี่ยนไปใช้เมนูนี้ทันทีหรือไม่?",
      icon: "question",
      showConfirmButton: true,
      showCancelButton: true,
      showDenyButton: false,
      confirmButtonColor: "#06C755",
      cancelButtonColor: "#d33",
      confirmButtonText: "ตกลง",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const cleanBotKey = decodeURIComponent(botKey);

      const queryParams = new URLSearchParams({
        botKey: cleanBotKey,
        menuId: menuId,
        type: type,
        adminId: user?.email || "",  // ✅ ส่ง email เพื่อ lookup admin_system
      });

      const response = await fetch(
        `${API}?action=switch&${queryParams.toString()}`,
        {
          method: "GET",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ไม่สามารถเปลี่ยนเมนูได้");
      }

      // ✅ เปลี่ยนสำเร็จ - แสดง success และ re-fetch data
      await Swal.fire({
        icon: "success",
        title: "สำเร็จ!",
        text: "เปลี่ยนเมนูเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchData();
    } catch (error) {
      console.error("Error switching menu:", error);
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message,
      });
    }
  };

  const handleViewJson = async (menuId) => {
    try {
      const res = await fetch(
        `${API}?action=details&botKey=${botKey}&menuId=${menuId}`,
      );
      const data = await res.json();

      if (res.ok) {
        // เก็บข้อมูล JSON และเปิด modal
        setSelectedJsonData(data);
        setIsJsonModalOpen(true);
      } else {
        await Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: data.error || "ดึงข้อมูลไม่สำเร็จ",
        });
      }
    } catch (err) {
      console.error("Fetch JSON error:", err);
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เกิดข้อผิดพลาดในการเชื่อมต่อ API",
      });
    }
  };

  async function handleDelete(menuId) {
    try {
      const result = await Swal.fire({
        title: "ยืนยันการลบเมนู?",
        text: "การลบจะไม่สามารถกู้คืนได้",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        confirmButtonText: "ลบเมนู",
        cancelButtonText: "ยกเลิก",
      });

      if (!result.isConfirmed) return;

      console.log("Deleting menu:", { botKey, menuId }); // Debug

      const API_URL = process.env.NEXT_PUBLIC_RICHMENU_DASHBOARD_API_URL;
      const response = await fetch(`${API_URL}?action=delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botKey, menuId, current_admin_id: user?.email }), // ✅ ส่ง email
      });

      const data = await response.json();
      console.log("Delete response:", data); // Debug

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "ลบเมนูสำเร็จ!",
          showConfirmButton: false,
          timer: 1500,
        });
        fetchData(); // รีเฟรชข้อมูล
      } else {
        throw new Error(data.error || data.details || "ลบเมนูไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Delete error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถลบเมนูได้",
      });
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

              {/* ปุ่ม 4: Segments */}
              <button onClick={() => document.getElementById("segment-section")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="php-qa-btn">
                <div className="php-qa-content">
                  <h3>จัดการ Segments</h3>
                  <p>แบ่งกลุ่ม user ตามจังหวัด/ประเภท</p>
                </div>
                <div className="php-qa-icon" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                  <Users size={20} />
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
                        {/* ==================== ACTION SETTINGS CARD (New UI) ==================== */}
                        <div
                          className="bg-white rounded-[12px] animate-in fade-in slide-in-from-top-4"
                          style={{
                            boxShadow:
                              "0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px #E8ECEF",
                          }}
                        >
                          {/* Header */}
                          <div className="p-4 border-b border-slate-300 flex justify-between items-center bg-white">
                            <h3 className="font-semibold text-[#2C3E50] flex items-center gap-2 text-sm">
                              <Settings size={16} className="text-[#06C755]" />
                              จัดการ Action:{" "}
                              <span className="text-[#06C755] font-bold uppercase tracking-tight">
                                Area {selectedAreaId}
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
                              className="text-[10px] text-[#E74C3C] hover:underline font-medium"
                            >
                              ล้างค่า
                            </button>
                          </div>

                          <div className="p-5 space-y-5">
                            {/* Action Type Selector */}
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                ประเภท Action
                              </p>
                              <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <button
                                  onClick={() => updateAction("type", "link")}
                                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 text-xs font-bold transition-all border-r border-slate-200
                                    ${
                                      currentAction.type === "link"
                                        ? "bg-[#F0FFF4] text-[#06C755] shadow-inner"
                                        : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                    }`}
                                >
                                  <LinkIcon size={16} />
                                  <span>Link</span>
                                  {currentAction.type === "link" && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
                                  )}
                                </button>
                                <button
                                  onClick={() => updateAction("type", "text")}
                                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 text-xs font-bold transition-all border-r border-slate-200
                                    ${
                                      currentAction.type === "text"
                                        ? "bg-[#F0FFF4] text-[#06C755] shadow-inner"
                                        : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                    }`}
                                >
                                  <Type size={16} />
                                  <span>Text</span>
                                  {currentAction.type === "text" && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
                                  )}
                                </button>
                                <button
                                  onClick={() => updateAction("type", "api")}
                                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 text-xs font-bold transition-all
                                    ${
                                      currentAction.type === "api"
                                        ? "bg-[#F0FFF4] text-[#06C755] shadow-inner"
                                        : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                    }`}
                                >
                                  <Zap size={16} />
                                  <span>API</span>
                                  {currentAction.type === "api" && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#06C755]" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* ===== LINK MODE ===== */}
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
                                  className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-[#06C755] outline-none transition-all font-medium"
                                />
                              </div>
                            )}

                            {/* ===== TEXT MODE ===== */}
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
                                  className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-[#06C755] outline-none transition-all resize-none font-medium"
                                />
                              </div>
                            )}

                            {/* ===== API MODE — FLOW BUILDER ===== */}
                            {currentAction.type === "api" &&
                              (() => {
                                // ---- helpers ----
                                const FLOW_COLORS = [
                                  {
                                    bg: "#EFF6FF",
                                    border: "#3B82F6",
                                    dot: "#3B82F6",
                                    tag: "#DBEAFE",
                                    tagText: "#1D4ED8",
                                  },
                                  {
                                    bg: "#F0FDF4",
                                    border: "#22C55E",
                                    dot: "#22C55E",
                                    tag: "#DCFCE7",
                                    tagText: "#15803D",
                                  },
                                  {
                                    bg: "#FFF7ED",
                                    border: "#F97316",
                                    dot: "#F97316",
                                    tag: "#FFEDD5",
                                    tagText: "#C2410C",
                                  },
                                  {
                                    bg: "#FDF4FF",
                                    border: "#A855F7",
                                    dot: "#A855F7",
                                    tag: "#F3E8FF",
                                    tagText: "#7E22CE",
                                  },
                                  {
                                    bg: "#FFF1F2",
                                    border: "#F43F5E",
                                    dot: "#F43F5E",
                                    tag: "#FFE4E6",
                                    tagText: "#BE123C",
                                  },
                                ];
                                const getFlowColor = (i) =>
                                  FLOW_COLORS[i % FLOW_COLORS.length];

                                function addFlowStep() {
                                  if (!newFlowStep.stateName.trim()) return;
                                  const id = Date.now();
                                  const updated = [
                                    ...flowSteps,
                                    { ...newFlowStep, id, actions: [] },
                                  ];
                                  setFlowSteps(updated);
                                  setExpandedFlowStep(id);
                                  setNewFlowStep({
                                    stateName: "",
                                    nextStateName: "",
                                    eventType: "postback",
                                    msgType: "text",
                                    postbackData: "",
                                  });
                                  setShowNewFlowStep(false);
                                  if (!selectedFlowStepId) {
                                    setSelectedFlowStepId(id);
                                    const sel = updated.find(
                                      (s) => s.id === id,
                                    );
                                    updateAction(
                                      "data",
                                      sel?.postbackData || sel?.stateName || "",
                                    );
                                    setApiStates(updated);
                                  }
                                }

                                function removeFlowStep(id) {
                                  const updated = flowSteps.filter(
                                    (s) => s.id !== id,
                                  );
                                  setFlowSteps(updated);
                                  setApiStates(updated);
                                  if (selectedFlowStepId === id) {
                                    setSelectedFlowStepId(null);
                                    updateAction("data", "");
                                  }
                                }

                                function addFlowActionToStep(stepId) {
                                  // rich-menu-unlink ไม่ต้องการ payload
                                  const needsJson = [
                                    "flex",
                                    "bubble",
                                    "calling",
                                    "switch",
                                  ].includes(newFlowAction.type);
                                  const payload = newFlowAction.payload.trim();

                                  if (
                                    newFlowAction.type !== "rich-menu-unlink" &&
                                    !payload
                                  )
                                    return;

                                  // ✅ Validate + auto-format JSON สำหรับ type ที่ต้องใช้ JSON
                                  let finalPayload = payload;
                                  if (needsJson && payload) {
                                    try {
                                      const parsed = JSON.parse(payload);
                                      finalPayload = JSON.stringify(parsed); // compact ก่อนเก็บ
                                      setJsonError("");
                                    } catch (e) {
                                      setJsonError(
                                        `JSON ไม่ถูกต้อง: ${e.message}`,
                                      );
                                      return; // ❌ ห้าม save ถ้า JSON ผิด
                                    }
                                  } else {
                                    setJsonError("");
                                  }

                                  const updated = flowSteps.map((s) => {
                                    if (s.id !== stepId) return s;
                                    return {
                                      ...s,
                                      actions: [
                                        ...s.actions,
                                        {
                                          id: Date.now(),
                                          ...newFlowAction,
                                          payload: finalPayload,
                                        },
                                      ],
                                    };
                                  });
                                  setFlowSteps(updated);
                                  setApiStates(updated);
                                  setApiActionList(
                                    updated.flatMap((s) =>
                                      s.actions.map((a) => ({
                                        actionID: a.id,
                                        order: a.order,
                                        actionType: a.type,
                                        payload: a.payload,
                                        action: s.id,
                                      })),
                                    ),
                                  );
                                  setAddingFlowAction(null);
                                  setNewFlowAction({
                                    order: 1,
                                    type: "text",
                                    payload: "",
                                  });
                                }

                                function removeFlowAction(stepId, actionId) {
                                  const updated = flowSteps.map((s) => {
                                    if (s.id !== stepId) return s;
                                    return {
                                      ...s,
                                      actions: s.actions.filter(
                                        (a) => a.id !== actionId,
                                      ),
                                    };
                                  });
                                  setFlowSteps(updated);
                                  setApiStates(updated);
                                  setApiActionList(
                                    updated.flatMap((s) =>
                                      s.actions.map((a) => ({
                                        actionID: a.id,
                                        order: a.order,
                                        actionType: a.type,
                                        payload: a.payload,
                                        action: s.id,
                                      })),
                                    ),
                                  );
                                }

                                function selectFlowStep(id) {
                                  setSelectedFlowStepId(id);
                                  const sel = flowSteps.find(
                                    (s) => s.id === id,
                                  );
                                  updateAction(
                                    "data",
                                    sel?.postbackData || sel?.stateName || "",
                                  );
                                }

                                function linkFlowStepToArea(stepId) {
                                  setAreaFlowMap((prev) => ({
                                    ...prev,
                                    [selectedAreaId]: (
                                      prev[selectedAreaId] || []
                                    ).includes(stepId)
                                      ? prev[selectedAreaId].filter(
                                          (id) => id !== stepId,
                                        ) // toggle off
                                      : [
                                          ...(prev[selectedAreaId] || []),
                                          stepId,
                                        ], // toggle on
                                  }));
                                }

                                const actionTypeLabel = {
                                  text: "💬 TEXT",
                                  flex: "🃏 FLEX",
                                  calling: "⚙️ CALLING",
                                };

                                return (
                                  <div className="space-y-3">
                                    {/* Display Text */}
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Type
                                          size={12}
                                          className="text-[#06C755]"
                                        />{" "}
                                        Display Text (ข้อความในแชท)
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
                                        placeholder="ข้อความที่แสดงเมื่อ User กดปุ่ม..."
                                        className="w-full px-3 py-2.5 bg-[#f8fafc] border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-[#06C755] outline-none font-medium"
                                      />
                                      <p className="text-[9px] text-slate-400 italic ml-1">
                                        * หากเว้นว่าง ระบบจะแสดงค่า Default ตาม
                                        Action Type
                                      </p>
                                    </div>

                                    <div
                                      style={{
                                        height: 1,
                                        background: "#E2E8F0",
                                      }}
                                    />

                                    {/* Flow Header */}
                                    <div className="flex items-center justify-between">
                                      <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Zap size={12} /> Flow การสนทนา
                                      </label>
                                      <button
                                        onClick={() =>
                                          setShowNewFlowStep(!showNewFlowStep)
                                        }
                                        className="text-[10px] font-bold flex items-center gap-0.5"
                                        style={{
                                          color: showNewFlowStep
                                            ? "#EF4444"
                                            : "#06C755",
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                        }}
                                      >
                                        <PlusCircle size={10} />{" "}
                                        {showNewFlowStep
                                          ? "ยกเลิก"
                                          : "เพิ่ม State"}
                                      </button>
                                    </div>

                                    {/* New Step Form */}
                                    {showNewFlowStep && (
                                      <div className="p-3 bg-[#f8fafc] border border-dashed border-slate-300 rounded-xl space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                                              Current State
                                            </span>
                                            <input
                                              value={newFlowStep.stateName}
                                              onChange={(e) =>
                                                setNewFlowStep((p) => ({
                                                  ...p,
                                                  stateName: e.target.value,
                                                }))
                                              }
                                              placeholder="เช่น standby"
                                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#06C755]"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <span className="text-[9px] text-[#06C755] font-bold uppercase">
                                              Next State →
                                            </span>
                                            <input
                                              value={newFlowStep.nextStateName}
                                              onChange={(e) =>
                                                setNewFlowStep((p) => ({
                                                  ...p,
                                                  nextStateName: e.target.value,
                                                }))
                                              }
                                              placeholder="เช่น blind-person"
                                              className="w-full px-2 py-1.5 bg-white border border-green-200 rounded-lg text-xs outline-none focus:border-[#06C755]"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                                              Event Type
                                            </span>
                                            <select
                                              value={newFlowStep.eventType}
                                              onChange={(e) =>
                                                setNewFlowStep((p) => ({
                                                  ...p,
                                                  eventType: e.target.value,
                                                }))
                                              }
                                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                            >
                                              <option value="postback">
                                                postback
                                              </option>
                                              <option value="message">
                                                message
                                              </option>
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase">
                                              Msg Type
                                            </span>
                                            <select
                                              value={newFlowStep.msgType}
                                              onChange={(e) =>
                                                setNewFlowStep((p) => ({
                                                  ...p,
                                                  msgType: e.target.value,
                                                }))
                                              }
                                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                            >
                                              <option value="text">text</option>
                                              <option value="image">
                                                image
                                              </option>
                                              <option value="video">
                                                video
                                              </option>
                                              <option value="audio">
                                                audio
                                              </option>
                                              <option value="location">
                                                location
                                              </option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                                            Postback Data
                                          </span>
                                          <input
                                            value={newFlowStep.postbackData}
                                            onChange={(e) =>
                                              setNewFlowStep((p) => ({
                                                ...p,
                                                postbackData: e.target.value,
                                              }))
                                            }
                                            placeholder="เช่น blind-person"
                                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#06C755]"
                                          />
                                        </div>
                                        <button
                                          onClick={addFlowStep}
                                          className="w-full py-2 bg-[#06C755] text-white text-xs font-bold rounded-lg hover:bg-[#05a546]"
                                        >
                                          ✓ สร้าง State
                                        </button>
                                      </div>
                                    )}

                                    {/* Empty state */}
                                    {flowSteps.length === 0 &&
                                      !showNewFlowStep && (
                                        <div className="text-center py-4 text-[11px] text-slate-300">
                                          ยังไม่มี State — กด{" "}
                                          <b className="text-[#06C755]">
                                            + เพิ่ม State
                                          </b>{" "}
                                          เพื่อเริ่มต้น
                                        </div>
                                      )}

                                    {/* Steps */}
                                    <div className="space-y-2">
                                      {flowSteps.map((step, idx) => {
                                        const color = getFlowColor(idx);
                                        const isExpanded =
                                          expandedFlowStep === step.id;
                                        const isSelected =
                                          selectedFlowStepId === step.id;
                                        const isAddingHere =
                                          addingFlowAction === step.id;

                                        return (
                                          <div
                                            key={step.id}
                                            style={{
                                              border: `1.5px solid ${isSelected ? color.dot : color.border}`,
                                              borderRadius: 12,
                                              overflow: "hidden",
                                              boxShadow: isSelected
                                                ? `0 0 0 3px ${color.dot}25`
                                                : "none",
                                            }}
                                          >
                                            {/* Step header */}
                                            <div
                                              style={{
                                                background: color.bg,
                                                padding: "8px 10px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                cursor: "pointer",
                                              }}
                                              onClick={() =>
                                                setExpandedFlowStep(
                                                  isExpanded ? null : step.id,
                                                )
                                              }
                                            >
                                              <div
                                                style={{
                                                  width: 20,
                                                  height: 20,
                                                  borderRadius: "50%",
                                                  background: color.dot,
                                                  color: "white",
                                                  fontSize: 9,
                                                  fontWeight: 800,
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  flexShrink: 0,
                                                }}
                                              >
                                                {idx + 1}
                                              </div>

                                              <div
                                                style={{ flex: 1, minWidth: 0 }}
                                              >
                                                <div
                                                  style={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: "#1E293B",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 3,
                                                    flexWrap: "wrap",
                                                  }}
                                                >
                                                  <span
                                                    style={{
                                                      display: "inline-block",
                                                      padding: "1px 5px",
                                                      borderRadius: 4,
                                                      fontSize: 9,
                                                      fontWeight: 700,
                                                      background: color.tag,
                                                      color: color.tagText,
                                                    }}
                                                  >
                                                    {step.stateName}
                                                  </span>
                                                  <span
                                                    style={{
                                                      color: "#94A3B8",
                                                      fontSize: 8,
                                                    }}
                                                  >
                                                    →
                                                  </span>
                                                  <span
                                                    style={{
                                                      display: "inline-block",
                                                      padding: "1px 5px",
                                                      borderRadius: 4,
                                                      fontSize: 9,
                                                      fontWeight: 700,
                                                      background: "#F1F5F9",
                                                      color: "#475569",
                                                    }}
                                                  >
                                                    {step.nextStateName || "—"}
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    fontSize: 8,
                                                    color: "#94A3B8",
                                                    marginTop: 1,
                                                  }}
                                                >
                                                  {step.eventType} ·{" "}
                                                  {step.msgType} ·{" "}
                                                  {step.actions.length} action
                                                  {step.actions.length !== 1
                                                    ? "s"
                                                    : ""}
                                                </div>
                                              </div>

                                              <button
                                                onClick={() =>
                                                  linkFlowStepToArea(step.id)
                                                }
                                                className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-all ${
                                                  (
                                                    areaFlowMap[
                                                      selectedAreaId
                                                    ] || []
                                                  ).includes(step.id)
                                                    ? "bg-[#06C755] text-white border-[#06C755]"
                                                    : "border-slate-300 text-slate-600 hover:border-[#06C755]"
                                                }`}
                                              >
                                                {(
                                                  areaFlowMap[selectedAreaId] ||
                                                  []
                                                ).includes(step.id)
                                                  ? "✓ใช้"
                                                  : "เลือก"}
                                              </button>

                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  removeFlowStep(step.id);
                                                }}
                                                style={{
                                                  background: "none",
                                                  border: "none",
                                                  cursor: "pointer",
                                                  color: "#CBD5E1",
                                                  fontSize: 12,
                                                  padding: 2,
                                                  flexShrink: 0,
                                                }}
                                              >
                                                ✕
                                              </button>

                                              <span
                                                style={{
                                                  color: "#94A3B8",
                                                  fontSize: 9,
                                                  flexShrink: 0,
                                                  transform: isExpanded
                                                    ? "rotate(180deg)"
                                                    : "none",
                                                  display: "inline-block",
                                                  transition: "transform 0.15s",
                                                }}
                                              >
                                                ▼
                                              </span>
                                            </div>

                                            {/* Expanded body */}
                                            {isExpanded && (
                                              <div
                                                style={{
                                                  padding: "10px",
                                                  background: "white",
                                                  borderTop: `1px solid ${color.border}20`,
                                                }}
                                              >
                                                {/* postback data */}
                                                {step.postbackData && (
                                                  <div
                                                    style={{
                                                      display: "inline-flex",
                                                      alignItems: "center",
                                                      gap: 3,
                                                      padding: "2px 6px",
                                                      background: "#0F172A",
                                                      borderRadius: 5,
                                                      fontSize: 8,
                                                      fontFamily: "monospace",
                                                      color: "#94A3B8",
                                                      marginBottom: 8,
                                                    }}
                                                  >
                                                    <span
                                                      style={{
                                                        color: "#64748B",
                                                      }}
                                                    >
                                                      data:
                                                    </span>
                                                    <span
                                                      style={{
                                                        color: "#38BDF8",
                                                      }}
                                                    >
                                                      {step.postbackData}
                                                    </span>
                                                  </div>
                                                )}

                                                {/* Action list */}
                                                <div className="space-y-1.5">
                                                  {step.actions.length ===
                                                    0 && (
                                                    <div
                                                      style={{
                                                        fontSize: 9,
                                                        color: "#CBD5E1",
                                                        textAlign: "center",
                                                        padding: "6px 0",
                                                      }}
                                                    >
                                                      ยังไม่มีคำสั่ง
                                                    </div>
                                                  )}
                                                  {[...step.actions]
                                                    .sort(
                                                      (a, b) =>
                                                        a.order - b.order,
                                                    )
                                                    .map((action) => (
                                                      <div
                                                        key={action.id}
                                                        style={{
                                                          display: "flex",
                                                          alignItems:
                                                            "flex-start",
                                                          gap: 6,
                                                          padding: "6px 8px",
                                                          background: "#F8FAFC",
                                                          border:
                                                            "1px solid #E2E8F0",
                                                          borderRadius: 7,
                                                        }}
                                                      >
                                                        <span
                                                          style={{
                                                            fontSize: 8,
                                                            fontWeight: 700,
                                                            color: "#94A3B8",
                                                            background:
                                                              "#E2E8F0",
                                                            borderRadius: 3,
                                                            padding: "1px 4px",
                                                            flexShrink: 0,
                                                          }}
                                                        >
                                                          #{action.order}
                                                        </span>
                                                        <div
                                                          style={{
                                                            flex: 1,
                                                            minWidth: 0,
                                                          }}
                                                        >
                                                          <div
                                                            style={{
                                                              fontSize: 8,
                                                              fontWeight: 700,
                                                              color: color.dot,
                                                              marginBottom: 1,
                                                            }}
                                                          >
                                                            {actionTypeLabel[
                                                              action.type
                                                            ] || action.type}
                                                          </div>
                                                          <div
                                                            style={{
                                                              fontSize: 9,
                                                              color: "#475569",
                                                              wordBreak:
                                                                "break-all",
                                                              fontFamily:
                                                                action.type ===
                                                                "flex"
                                                                  ? "monospace"
                                                                  : "inherit",
                                                              maxHeight: 48,
                                                              overflow:
                                                                "hidden",
                                                            }}
                                                          >
                                                            {action.payload}
                                                          </div>
                                                        </div>
                                                        <button
                                                          onClick={() =>
                                                            removeFlowAction(
                                                              step.id,
                                                              action.id,
                                                            )
                                                          }
                                                          style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "#CBD5E1",
                                                            fontSize: 11,
                                                            flexShrink: 0,
                                                          }}
                                                        >
                                                          ✕
                                                        </button>
                                                      </div>
                                                    ))}
                                                </div>

                                                {/* Add action */}
                                                {isAddingHere ? (
                                                  <div
                                                    style={{
                                                      marginTop: 8,
                                                      padding: 10,
                                                      background: "#F8FAFC",
                                                      border:
                                                        "1px dashed #CBD5E1",
                                                      borderRadius: 8,
                                                    }}
                                                    className="space-y-2"
                                                  >
                                                    <div className="grid grid-cols-4 gap-2">
                                                      <div className="col-span-1 space-y-1">
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                          Order
                                                        </span>
                                                        <input
                                                          type="number"
                                                          value={
                                                            newFlowAction.order
                                                          }
                                                          onChange={(e) =>
                                                            setNewFlowAction(
                                                              (p) => ({
                                                                ...p,
                                                                order: Number(
                                                                  e.target
                                                                    .value,
                                                                ),
                                                              }),
                                                            )
                                                          }
                                                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#06C755]"
                                                        />
                                                      </div>
                                                      <div className="col-span-3 space-y-1">
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                          Action Type
                                                        </span>
                                                        <select
                                                          value={
                                                            newFlowAction.type
                                                          }
                                                          onChange={(e) =>
                                                            setNewFlowAction(
                                                              (p) => ({
                                                                ...p,
                                                                type: e.target
                                                                  .value,
                                                              }),
                                                            )
                                                          }
                                                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                                                        >
                                                          <option value="text">
                                                            💬 TEXT (ข้อความ)
                                                          </option>
                                                          <option value="flex">
                                                            🃏 FLEX (การ์ด)
                                                          </option>
                                                          <option value="calling">
                                                            ⚙️ CALLING (ระบบ)
                                                          </option>
                                                          <option value="quick-reply">
                                                            💭 quick-reply
                                                          </option>
                                                          <option value="rich-menu-unlink">
                                                            👇🏻 rich-menu-unlink
                                                          </option>
                                                        </select>
                                                      </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                      {/* Header row: label + Format button */}
                                                      <span className="text-[9px] text-slate-400 font-bold uppercase flex justify-between items-center">
                                                        Payload / Message
                                                        {[
                                                          "flex",
                                                          "bubble",
                                                          "calling",
                                                          "switch",
                                                        ].includes(
                                                          newFlowAction.type,
                                                        ) && (
                                                          <button
                                                            onClick={() => {
                                                              try {
                                                                const pretty =
                                                                  JSON.stringify(
                                                                    JSON.parse(
                                                                      newFlowAction.payload,
                                                                    ),
                                                                    null,
                                                                    2,
                                                                  );
                                                                setNewFlowAction(
                                                                  (p) => ({
                                                                    ...p,
                                                                    payload:
                                                                      pretty,
                                                                  }),
                                                                );
                                                                setJsonError(
                                                                  "",
                                                                );
                                                              } catch (e) {
                                                                setJsonError(
                                                                  `JSON ไม่ถูกต้อง: ${e.message}`,
                                                                );
                                                              }
                                                            }}
                                                            className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded text-[7px] font-bold transition-colors"
                                                          >
                                                            {"{ }"} Format JSON
                                                          </button>
                                                        )}
                                                      </span>

                                                      {/* rich-menu-unlink: ไม่ต้องกรอก */}
                                                      {newFlowAction.type ===
                                                      "rich-menu-unlink" ? (
                                                        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 font-medium">
                                                          🙈 Rich Menu ของ User
                                                          จะถูกซ่อนอัตโนมัติ
                                                          ไม่ต้องกรอกข้อมูลเพิ่ม
                                                        </div>
                                                      ) : (
                                                        <>
                                                          <textarea
                                                            value={
                                                              newFlowAction.payload
                                                            }
                                                            onChange={(e) => {
                                                              const val =
                                                                e.target.value;
                                                              setNewFlowAction(
                                                                (p) => ({
                                                                  ...p,
                                                                  payload: val,
                                                                }),
                                                              );
                                                              // live validate JSON types
                                                              if (
                                                                [
                                                                  "flex",
                                                                  "bubble",
                                                                  "calling",
                                                                  "switch",
                                                                ].includes(
                                                                  newFlowAction.type,
                                                                ) &&
                                                                val.trim()
                                                              ) {
                                                                try {
                                                                  JSON.parse(
                                                                    val,
                                                                  );
                                                                  setJsonError(
                                                                    "",
                                                                  );
                                                                } catch (err) {
                                                                  setJsonError(
                                                                    `JSON ไม่ถูกต้อง: ${err.message}`,
                                                                  );
                                                                }
                                                              } else {
                                                                setJsonError(
                                                                  "",
                                                                );
                                                              }
                                                            }}
                                                            placeholder={
                                                              newFlowAction.type ===
                                                              "text"
                                                                ? "พิมพ์ข้อความที่ต้องการส่งหา User..."
                                                                : newFlowAction.type ===
                                                                      "flex" ||
                                                                    newFlowAction.type ===
                                                                      "bubble"
                                                                  ? '{\n  "type": "bubble",\n  "body": {\n    "type": "box",\n    "layout": "vertical",\n    "contents": []\n  }\n}'
                                                                  : newFlowAction.type ===
                                                                      "calling"
                                                                    ? '{\n  "url": "https://api.example.com/hook",\n  "method": "POST",\n  "body": {}\n}'
                                                                    : newFlowAction.type ===
                                                                        "switch"
                                                                      ? '{"richMenuId": "richmenu-xxxxxxxxxxxx"}'
                                                                      : "พิมพ์ข้อความ หรือ JSON..."
                                                            }
                                                            className={`w-full px-2 py-1.5 bg-white border rounded-lg text-[10px] font-mono outline-none min-h-[72px] resize-y focus:border-[#06C755] transition-colors ${
                                                              jsonError
                                                                ? "border-red-400 bg-red-50"
                                                                : "border-slate-200"
                                                            }`}
                                                          />

                                                          {/* JSON error */}
                                                          {jsonError && (
                                                            <div className="flex items-start gap-1 px-2 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                                                              <span className="text-red-500 text-[9px] flex-shrink-0 mt-0.5">
                                                                ✕
                                                              </span>
                                                              <span className="text-[9px] text-red-600 font-mono break-all">
                                                                {jsonError}
                                                              </span>
                                                            </div>
                                                          )}

                                                          {/* JSON ok badge */}
                                                          {!jsonError &&
                                                            [
                                                              "flex",
                                                              "bubble",
                                                              "calling",
                                                              "switch",
                                                            ].includes(
                                                              newFlowAction.type,
                                                            ) &&
                                                            newFlowAction.payload.trim() && (
                                                              <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-bold">
                                                                <span>✓</span>
                                                                <span>
                                                                  JSON ถูกต้อง
                                                                </span>
                                                              </div>
                                                            )}

                                                          {/* Hint texts */}
                                                          {newFlowAction.type ===
                                                            "calling" && (
                                                            <p className="text-[8px] text-slate-400 italic">
                                                              * ระบบจะเรียก API
                                                              ก่อนส่งข้อความ
                                                              (url, method,
                                                              headers?, body?)
                                                            </p>
                                                          )}
                                                          {newFlowAction.type ===
                                                            "switch" && (
                                                            <p className="text-[8px] text-slate-400 italic">
                                                              * เปลี่ยน Rich
                                                              Menu เฉพาะ User
                                                              คนนี้ (ไม่กระทบ
                                                              User อื่น)
                                                            </p>
                                                          )}
                                                          {(newFlowAction.type ===
                                                            "flex" ||
                                                            newFlowAction.type ===
                                                              "bubble") && (
                                                            <p className="text-[8px] text-slate-400 italic">
                                                              * วาง JSON จาก{" "}
                                                              <a
                                                                href="https://developers.line.biz/flex-simulator/"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-indigo-500 underline"
                                                              >
                                                                LINE Flex
                                                                Message
                                                                Simulator
                                                              </a>
                                                            </p>
                                                          )}
                                                        </>
                                                      )}
                                                    </div>

                                                    <div className="flex gap-1.5">
                                                      <button
                                                        onClick={() =>
                                                          addFlowActionToStep(
                                                            step.id,
                                                          )
                                                        }
                                                        disabled={!!jsonError}
                                                        className={`flex-1 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${
                                                          jsonError
                                                            ? "bg-slate-300 cursor-not-allowed"
                                                            : "bg-[#06C755] hover:bg-[#05a546]"
                                                        }`}
                                                      >
                                                        ✓ บันทึก Action
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          setAddingFlowAction(
                                                            null,
                                                          );
                                                          setJsonError("");
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg"
                                                      >
                                                        ยกเลิก
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => {
                                                      setAddingFlowAction(
                                                        step.id,
                                                      );
                                                      setNewFlowAction({
                                                        order:
                                                          step.actions.length +
                                                          1,
                                                        type: "text",
                                                        payload: "",
                                                      });
                                                    }}
                                                    style={{
                                                      marginTop: 8,
                                                      width: "100%",
                                                      padding: "6px 0",
                                                      background: "none",
                                                      border: `1.5px dashed ${color.border}`,
                                                      borderRadius: 7,
                                                      color: color.dot,
                                                      fontSize: 9,
                                                      fontWeight: 700,
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    + เพิ่มคำสั่ง
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Flow preview */}
                                    {flowSteps.length > 1 && (
                                      <div
                                        style={{
                                          padding: "8px 10px",
                                          background: "#0F172A",
                                          borderRadius: 8,
                                          fontSize: 8,
                                          fontFamily: "monospace",
                                          color: "#64748B",
                                        }}
                                      >
                                        <div
                                          style={{
                                            color: "#475569",
                                            fontWeight: 700,
                                            marginBottom: 4,
                                            fontSize: 7,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                          }}
                                        >
                                          Flow Preview
                                        </div>
                                        {flowSteps.map((s, i) => (
                                          <div
                                            key={s.id}
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 3,
                                              marginBottom:
                                                i < flowSteps.length - 1
                                                  ? 3
                                                  : 0,
                                            }}
                                          >
                                            <span style={{ color: "#38BDF8" }}>
                                              {s.stateName}
                                            </span>
                                            {s.nextStateName && (
                                              <>
                                                <span
                                                  style={{ color: "#475569" }}
                                                >
                                                  →
                                                </span>
                                                <span
                                                  style={{ color: "#86EFAC" }}
                                                >
                                                  {s.nextStateName}
                                                </span>
                                              </>
                                            )}
                                            <span style={{ color: "#475569" }}>
                                              ({s.actions.length} actions)
                                            </span>
                                            {selectedFlowStepId === s.id && (
                                              <span
                                                style={{ color: "#FCD34D" }}
                                              >
                                                ← active
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
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
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 20,
                    maxWidth: 780,
                    width: "95vw",
                    maxHeight: "92vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
                    fontFamily: "inherit",
                  }}
                >
                  {/* ── Header ── */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #06C755 0%, #05a546 100%)",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          borderRadius: 10,
                          padding: "7px 8px",
                          display: "flex",
                        }}
                      >
                        <History size={18} color="#fff" />
                      </div>
                      <div>
                        <div
                          style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 15,
                          }}
                        >
                          ประวัติการใช้งาน
                        </div>

                      </div>
                    </div>
                    <button
                      onClick={() => setIsLogModalOpen(false)}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                        cursor: "pointer",
                        color: "#fff",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* ── Stats Bar (horizontal scroll on mobile) ── */}
                  <div
                    style={{
                      background: "#fff",
                      padding: "10px 12px",
                      display: "flex",
                      gap: 6,
                      borderBottom: "1px solid #E8ECEF",
                      flexShrink: 0,
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {[
                      {
                        key: "all",
                        label: "ทั้งหมด",
                        color: "#06C755",
                        bg: "#F0FFF4",
                        count: auditLogs.length,
                      },
                      {
                        key: "MENU_UPLOAD",
                        label: "สร้างเมนู",
                        color: "#3B82F6",
                        bg: "#EFF6FF",
                        count: auditLogs.filter(
                          (l) => l.action === "MENU_UPLOAD",
                        ).length,
                      },
                      {
                        key: "MENU_SWITCH",
                        label: "เปลี่ยนเมนู",
                        color: "#F59E0B",
                        bg: "#FFFBEB",
                        count: auditLogs.filter(
                          (l) => l.action === "MENU_SWITCH",
                        ).length,
                      },
                      {
                        key: "MENU_DELETE",
                        label: "ลบเมนู",
                        color: "#EF4444",
                        bg: "#FEF2F2",
                        count: auditLogs.filter(
                          (l) => l.action === "MENU_DELETE",
                        ).length,
                      },
                      {
                        key: "add_bot",
                        label: "เพิ่มบอท",
                        color: "#8B5CF6",
                        bg: "#F5F3FF",
                        count: auditLogs.filter((l) => l.action === "add_bot")
                          .length,
                      },
                      {
                        key: "delete_bot",
                        label: "ลบบอท",
                        color: "#DC2626",
                        bg: "#FFF1F2",
                        count: auditLogs.filter(
                          (l) => l.action === "delete_bot",
                        ).length,
                      },
                    ].map((f) => {
                      const active = auditFilter === f.key;
                      return (
                        <button
                          key={f.key}
                          onClick={() => setAuditFilter(f.key)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            padding: "6px 12px",
                            borderRadius: 10,
                            cursor: "pointer",
                            border: active
                              ? `2px solid ${f.color}`
                              : "2px solid transparent",
                            background: active ? f.bg : "#F8FAFC",
                            transition: "all 0.15s",
                            flexShrink: 0,
                            minWidth: 62,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: active ? f.color : "#94A3B8",
                              lineHeight: 1,
                            }}
                          >
                            {f.count}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: active ? f.color : "#94A3B8",
                              marginTop: 2,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {f.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Log Rows (card layout — mobile friendly) ── */}
                  <div
                    style={{
                      overflowY: "auto",
                      flex: 1,
                      background: "#fff",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {auditLoading ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "60px 0",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            border: "3px solid #06C755",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                        <span style={{ fontSize: 13, color: "#94A3B8" }}>
                          กำลังโหลดประวัติ...
                        </span>
                      </div>
                    ) : (
                      (() => {
                        const filtered =
                          auditFilter === "all"
                            ? auditLogs
                            : auditLogs.filter((l) => l.action === auditFilter);

                        if (filtered.length === 0) {
                          return (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "60px 0",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  background: "#F1F5F9",
                                  borderRadius: 16,
                                  padding: 20,
                                }}
                              >
                                <History size={36} color="#CBD5E1" />
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  color: "#94A3B8",
                                  fontWeight: 600,
                                }}
                              >
                                ยังไม่มีประวัติในหมวดนี้
                              </span>
                            </div>
                          );
                        }

                        const actionConfig = {
                          add_bot: {
                            label: "เพิ่มบอท",
                            color: "#8B5CF6",
                            bg: "#F5F3FF",
                            dot: "#8B5CF6",
                          },
                          delete_bot: {
                            label: "ลบบอท",
                            color: "#DC2626",
                            bg: "#FFF1F2",
                            dot: "#DC2626",
                          },
                          MENU_UPLOAD: {
                            label: "สร้างเมนู",
                            color: "#3B82F6",
                            bg: "#EFF6FF",
                            dot: "#3B82F6",
                          },
                          MENU_UPLOAD_FAILED: {
                            label: "สร้างเมนูล้มเหลว",
                            color: "#F97316",
                            bg: "#FFF7ED",
                            dot: "#F97316",
                          },
                          MENU_SWITCH: {
                            label: "เปลี่ยนเมนู",
                            color: "#F59E0B",
                            bg: "#FFFBEB",
                            dot: "#F59E0B",
                          },
                          MENU_SWITCH_FAILED: {
                            label: "เปลี่ยนเมนูล้มเหลว",
                            color: "#F97316",
                            bg: "#FFF7ED",
                            dot: "#F97316",
                          },
                          MENU_DELETE: {
                            label: "ลบเมนู",
                            color: "#EF4444",
                            bg: "#FEF2F2",
                            dot: "#EF4444",
                          },
                          MENU_DELETE_FAILED: {
                            label: "ลบเมนูล้มเหลว",
                            color: "#F97316",
                            bg: "#FFF7ED",
                            dot: "#F97316",
                          },
                          MENU_SAVE_FLOW: {
                            label: "บันทึก Flow",
                            color: "#06B6D4",
                            bg: "#ECFEFF",
                            dot: "#06B6D4",
                          },
                        };

                        return filtered.map((log, i) => {
                          const cfg = actionConfig[log.action] || {
                            label: log.action,
                            color: "#64748B",
                            bg: "#F8FAFC",
                            dot: "#94A3B8",
                          };
                          // ✅ created_at จาก backend เป็น ISO string +07:00 แล้ว
                          // parse ตรงๆ ไม่ต้องแปลง timezone อีก
                          const createdAt = new Date(log.created_at);
                          const dateStr = createdAt.toLocaleDateString("th-TH", {
                            day: "numeric", month: "short", year: "numeric",
                          });
                          const timeStr = createdAt.toLocaleTimeString("th-TH", {
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                            hour12: false,
                          });

                          return (
                            <div
                              key={log.id || i}
                              style={{
                                padding: "12px 16px",
                                borderBottom: "1px solid #F1F5F9",
                                borderLeft: `3px solid ${cfg.dot}`,
                                background: "#fff",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F8FAFC")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#fff")
                              }
                            >
                              {/* Row 1: Badge + Timestamp */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 6,
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    background: cfg.bg,
                                    color: cfg.color,
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: "50%",
                                      background: cfg.dot,
                                    }}
                                  />
                                  {cfg.label}
                                </span>
                                <div style={{ textAlign: "right" }}>
                                  <div
                                    style={{
                                      color: "#475569",
                                      fontSize: 11,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {dateStr}
                                  </div>
                                  <div
                                    style={{
                                      color: "#94A3B8",
                                      fontSize: 10,
                                      fontFamily: "monospace",
                                    }}
                                  >
                                    {timeStr}
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: Detail */}
                              {log.menu_name && (
                                <div
                                  style={{
                                    color: "#2C3E50",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    marginBottom: 2,
                                  }}
                                >
                                  {log.menu_name}
                                </div>
                              )}
                              {log.detail && (
                                <div
                                  style={{
                                    color: "#64748B",
                                    fontSize: 11,
                                    lineHeight: 1.5,
                                    marginBottom: 4,
                                  }}
                                >
                                  {log.detail}
                                </div>
                              )}
                              {log.action?.startsWith("MENU_SWITCH") && (log.menu_id_from || log.menu_id_to) && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                    {/* เมนูเดิม */}
                                    <div style={{ display: "flex", flexDirection: "column", background: "#F1F5F9", borderRadius: 6, padding: "4px 10px", flex: "1 1 120px" }}>
                                      <span style={{ fontSize: 9, color: "#94A3B8", marginBottom: 2 }}>เมนูเดิม</span>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                                        {log.menu_name_from || log.menu_id_from || "—"}
                                      </span>
                                    </div>
                                    {/* arrow */}
                                    <span style={{ color: "#CBD5E1", fontSize: 18, flexShrink: 0 }}>→</span>
                                    {/* เมนูใหม่ */}
                                    <div style={{ display: "flex", flexDirection: "column", background: "#F0FFF4", borderRadius: 6, padding: "4px 10px", flex: "1 1 120px" }}>
                                      <span style={{ fontSize: 9, color: "#06C755", marginBottom: 2 }}>เมนูใหม่</span>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>
                                        {log.menu_name_to || log.menu_id_to || "—"}
                                      </span>
                                    </div>
                                  </div>
                                )}

                              {/* Row 3: Admin */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginTop: 4,
                                }}
                              >
                                {log.admin_avatar ? (
                                  <img
                                    src={log.admin_avatar}
                                    alt=""
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      border: "1.5px solid #E2E8F0",
                                      flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      background:
                                        "linear-gradient(135deg, #06C755, #05a546)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <User size={10} color="#fff" />
                                  </div>
                                )}
                                <span
                                  style={{
                                    color: "#64748B",
                                    fontSize: 10,
                                    fontWeight: 600,
                                  }}
                                >
                                  {log.admin_name || log.bot_name || "—"}
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>

                  {/* ── Footer ── */}
                  <div
                    style={{
                      background: "#F8FAFC",
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid #E8ECEF",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "#94A3B8", fontSize: 11 }}>
                      {auditFilter === "all"
                        ? auditLogs.length
                        : auditLogs.filter((l) => l.action === auditFilter)
                            .length}{" "}
                      รายการ
                    </span>
                    <button
                      onClick={() => setIsLogModalOpen(false)}
                      style={{
                        background: "#06C755",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 24px",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== JSON Viewer Modal ==================== */}
            {isJsonModalOpen && selectedJsonData && (
              <div
                className="php-modal-overlay"
                onClick={() => setIsJsonModalOpen(false)}
              >
                <div
                  className="php-json-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="php-modal-header">
                    <h3>
                      <Code size={18} /> รายละเอียด JSON Structure
                    </h3>
                    <button
                      onClick={() => setIsJsonModalOpen(false)}
                      className="php-modal-close"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* ส่วนแสดงข้อมูลสรุป */}
                  <div className="php-json-summary">
                    <div className="php-json-info-row">
                      <span className="php-json-label">ชื่อเมนู:</span>
                      <span className="php-json-value">
                        {selectedJsonData.name}
                      </span>
                    </div>
                    <div className="php-json-info-row">
                      <span className="php-json-label">Rich Menu ID:</span>
                      <span className="php-json-value-mono">
                        {selectedJsonData.richMenuId}
                      </span>
                    </div>
                    <div className="php-json-info-row">
                      <span className="php-json-label">ขนาด:</span>
                      <span className="php-json-value">
                        {selectedJsonData.size?.width} ×{" "}
                        {selectedJsonData.size?.height} px
                      </span>
                    </div>
                    <div className="php-json-info-row">
                      <span className="php-json-label">จำนวนปุ่ม:</span>
                      <span className="php-json-value">
                        {selectedJsonData.areas?.length || 0} ช่อง
                      </span>
                    </div>
                    <div className="php-json-info-row">
                      <span className="php-json-label">Chat Bar Text:</span>
                      <span className="php-json-value">
                        {selectedJsonData.chatBarText || "-"}
                      </span>
                    </div>
                  </div>

                  {/* ส่วนแสดง JSON แบบ Code Block */}
                  <div className="php-modal-body">
                    <div className="php-json-header">
                      <span className="php-json-title">
                        JSON Structure (Full)
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(selectedJsonData, null, 2),
                          );
                          Swal.fire({
                            icon: "success",
                            title: "คัดลอกแล้ว!",
                            showConfirmButton: false,
                            timer: 1000,
                          });
                        }}
                        className="php-copy-btn"
                      >
                        <i className="fa-regular fa-copy"></i> คัดลอก JSON
                      </button>
                    </div>
                    <pre className="php-json-code">
                      {JSON.stringify(selectedJsonData, null, 2)}
                    </pre>
                  </div>

                  <div className="php-modal-footer">
                    <button
                      onClick={() => setIsJsonModalOpen(false)}
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
                      `${API}?action=image&botKey=${botKey}&menuId=${menu.richMenuId}`;

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
                              e.target.onerror = null;
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2500' height='843' viewBox='0 0 2500 843'%3E%3Crect width='2500' height='843' fill='%23F1F5F9'/%3E%3Crect x='1' y='1' width='2498' height='841' fill='none' stroke='%23E2E8F0' stroke-width='2'/%3E%3Ctext x='1250' y='400' font-family='sans-serif' font-size='60' fill='%2394A3B8' text-anchor='middle'%3ENo Image%3C/text%3E%3Ctext x='1250' y='480' font-family='sans-serif' font-size='36' fill='%23CBD5E1' text-anchor='middle'%3E2500 x 843%3C/text%3E%3C/svg%3E`;
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
                              <>
                                <button
                                  disabled
                                  className="btn-menu-disabled text-[11px] py-1"
                                >
                                  <Code size={12} /> ใช้งานอยู่
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleViewJson(menu.richMenuId)
                                    }
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-colors"
                                    title="ดูโครงสร้าง JSON"
                                  >
                                    <Code size={16} />
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDelete(menu.richMenuId)
                                    }
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  ></button>
                                </div>
                              </>
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
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleViewJson(menu.richMenuId)
                                    }
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-colors"
                                    title="ดูโครงสร้าง JSON"
                                  >
                                    <Code size={16} />
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDelete(menu.richMenuId)
                                    }
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                  ></button>
                                </div>
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

            {/* ==================== SEGMENT SECTION ==================== */}
            <section id="segment-section" className="php-card">
              <div className="php-card-header flex justify-between items-center">
                <h2 className="php-card-title flex items-center gap-2">
                  <Users size={18} /> จัดการ Segments
                </h2>
                <button
                  onClick={() => {
                    setSegmentForm({ name: "", description: "", is_default: false });
                    setSegmentFormModal({ mode: "create" });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
                >
                  <Plus size={14} /> สร้าง Segment
                </button>
              </div>

              {segments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold">ยังไม่มี Segment</p>
                  <p className="text-sm mt-1">กดปุ่ม "สร้าง Segment" เพื่อเริ่มต้นแบ่งกลุ่ม user</p>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segments.map((seg) => (
                    <div
                      key={seg.id}
                      className={`bg-white rounded-2xl border-2 shadow-sm ${seg.is_default ? "border-green-300" : "border-slate-200"}`}
                    >
                      {/* Card Header */}
                      <div className="p-4 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${seg.is_default ? "bg-green-100" : "bg-violet-100"}`}>
                            {seg.is_default
                              ? <Star size={16} className="text-green-600" />
                              : <LayoutGrid size={16} className="text-violet-600" />
                            }
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm truncate">{seg.name}</span>
                              {seg.is_default && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Default</span>
                              )}
                            </div>
                            {seg.description && (
                              <p className="text-[10px] text-slate-400 truncate">{seg.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setSegmentForm({ name: seg.name, description: seg.description || "", is_default: seg.is_default });
                              setSegmentFormModal({ mode: "edit", data: seg });
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteSegment(seg)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="px-4 pb-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Users size={11} /> {seg.user_count} user</span>
                        {seg.active_rich_menu_name
                          ? <span className="flex items-center gap-1 text-green-600 font-medium truncate"><CheckCircle size={11} />{seg.active_rich_menu_name}</span>
                          : <span className="text-amber-500">ยังไม่ได้ assign เมนู</span>
                        }
                      </div>

                      {/* Buttons */}
                      <div className="px-4 pb-4 flex gap-2">
                        <button
                          onClick={() => { setAssignSelectedMenuId(seg.active_rich_menu_id || ""); setAssignMenuModal(seg); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-900 hover:bg-violet-700 text-white text-[11px] font-bold rounded-xl transition-colors"
                        >
                          <ArrowRightLeft size={12} /> Assign เมนู
                        </button>
                        <button
                          onClick={() => { setUsersModal(seg); fetchSegmentUsers(seg.id); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold rounded-xl transition-colors"
                        >
                          <Users size={12} /> จัดการ User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* ==================== SEGMENT FORM MODAL ==================== */}
      {segmentFormModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSegmentFormModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">{segmentFormModal.mode === "edit" ? "แก้ไข Segment" : "สร้าง Segment ใหม่"}</h3>
              <button onClick={() => setSegmentFormModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">ชื่อ Segment *</label>
                <input
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  placeholder="เช่น กรุงเทพ, เชียงใหม่, VIP"
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm outline-none focus:border-violet-500 focus:bg-violet-50/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">คำอธิบาย</label>
                <input
                  value={segmentForm.description}
                  onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                  placeholder="อธิบายกลุ่มนี้..."
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm outline-none focus:border-violet-500 focus:bg-violet-50/30"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={segmentForm.is_default}
                  onChange={(e) => setSegmentForm({ ...segmentForm, is_default: e.target.checked })}
                  className="w-5 h-5 accent-green-500 border-2 border-slate-400 rounded cursor-pointer shrink-0"
                />
                <div>
                  <div className="text-sm font-bold text-slate-700">ตั้งเป็น Default Segment</div>
                  <div className="text-xs text-slate-400">เมนูของ segment นี้จะเป็น LINE default menu</div>
                </div>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setSegmentFormModal(null)} className="flex-1 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">ยกเลิก</button>
              <button
                onClick={handleSaveSegment}
                disabled={!segmentForm.name.trim() || savingSegment}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                {savingSegment ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {savingSegment ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ASSIGN MENU MODAL ==================== */}
      {assignMenuModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAssignMenuModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-slate-800">Assign เมนูให้ Segment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{assignMenuModal.name}</p>
              </div>
              <button onClick={() => setAssignMenuModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {menus.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-8">ไม่มีเมนูในระบบ กรุณาอัปโหลดเมนูก่อน</p>
              )}
              {menus.map((menu) => {
                const isSelected = menu.richMenuId === assignSelectedMenuId;
                const isCurrent = menu.richMenuId === assignMenuModal.active_rich_menu_id;
                return (
                  <button
                    key={menu.richMenuId}
                    onClick={() => setAssignSelectedMenuId(menu.richMenuId)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? "border-violet-400 bg-violet-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="w-16 h-6 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      {menu.image_url && <img src={menu.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 truncate">{menu.name}</span>
                        {isCurrent && <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded-full">ใช้อยู่</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{menu.richMenuId}</p>
                    </div>
                    {isSelected && <CheckCircle size={16} className="text-violet-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={() => setAssignMenuModal(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600">ยกเลิก</button>
              <button
                onClick={handleAssignSegmentMenu}
                disabled={!assignSelectedMenuId || assigningMenu}
                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                {assigningMenu ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightLeft size={15} />}
                {assigningMenu ? "กำลัง Assign..." : "Assign เมนูนี้"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MANAGE USERS MODAL ==================== */}
      {usersModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setUsersModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-slate-800">จัดการ Users</h3>
                <p className="text-xs text-slate-500">{usersModal.name} — {segmentUsers.length} user</p>
              </div>
              <button onClick={() => setUsersModal(null)}><X size={20} className="text-slate-400" /></button>
            </div>

            {/* Add user input */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <p className="text-xs font-bold text-slate-600 mb-2">เพิ่ม User</p>
              <div className="flex gap-2">
                <input
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="LINE userId (Uxxxxxxxxxx)"
                  className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-violet-500 font-mono"
                />
                <input
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                  placeholder="ชื่อ (ไม่บังคับ)"
                  className="w-28 px-3 py-2 border-2 border-slate-300 rounded-xl text-xs outline-none focus:border-violet-500"
                />
                <button
                  onClick={handleAddSegmentUser}
                  disabled={!newUserId.trim() || addingUser}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  {addingUser ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  เพิ่ม
                </button>
              </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto">
              {segmentUsersLoading ? (
                <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-violet-500" /></div>
              ) : segmentUsers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">ยังไม่มี user ใน segment นี้</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {segmentUsers.map((u) => (
                    <div key={u.id} className="px-6 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {u.display_name || <span className="text-slate-400 italic text-xs">ไม่ทราบชื่อ</span>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">{u.line_user_id}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{u.source}</span>
                        <button
                          onClick={() => handleRemoveSegmentUser(u.line_user_id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setUsersModal(null)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold">ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}