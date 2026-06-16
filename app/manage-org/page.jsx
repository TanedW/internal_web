//manage-org/page.jsx

'use client';

import React, { useEffect, useState, useRef, useMemo } from "react";
import Sidebar from "../components/sidebar"; 
import { 
 Building2, Upload, Image as ImageIcon, 
 CheckCircle2, AlertCircle, Loader2, Search,
 ChevronRight, ChevronLeft, MousePointerClick, Copy, 
 QrCode, Trash2, FileSpreadsheet, ShieldCheck,
 RefreshCcw, X, ImageOff, Download, Info,
 Maximize2, Save, Plus, PencilLine,
 UserCheck, Mail, Phone, Shield, Check,
 MoveVertical, Type,
 Clock, Edit3, RefreshCw, FileText, ArrowRight, Filter, MoreVertical, Activity, Settings2,
 History, Eye, UserCircle2, ArrowLeft
 } from "lucide-react";

// Mock Data
const TIMELINE_DATA = [
 { id: 1, type: "edit", action: "แก้ไขข้อมูลพื้นฐาน", detail: "เปลี่ยนชื่อหน่วยงานจาก 'อบต. เดิม' เป็น 'เทศบาลนครนนทบุรี'", user: "ธนกฤต แอดมิน", time: "10 นาทีที่แล้ว", status: "success" },
 { id: 2, type: "security", action: "อัปเดตสิทธิ์การเข้าถึง", detail: "เปิดใช้งานการส่งออกไฟล์ CSV สำหรับเจ้าหน้าที่ระดับ Manager", user: "ศิริลักษณ์ ระบบ", time: "2 ชั่วโมงที่แล้ว", status: "warning" },
 { id: 3, type: "restore", action: "กู้คืนสถานะหน่วยงาน", detail: "กู้คืนข้อมูลหลังจากถูกระงับใช้งานชั่วคราว", user: "Super Admin", time: "เมื่อวานนี้, 14:30", status: "info" },
 { id: 4, type: "delete", action: "ลบรูปภาพโลโก้เก่า", detail: "นำไฟล์ logo_v1_deprecated.png ออกจากระบบ", user: "ธนกฤต แอดมิน", time: "2 วันที่แล้ว", status: "danger" }
];

const getTypeStyles = (type) => {
 switch (type) {
   case 'edit': return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <Edit3 size={16} strokeWidth={2.5} />, border: 'border-indigo-100' };
   case 'security': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <ShieldCheck size={16} strokeWidth={2.5} />, border: 'border-amber-100' };
   case 'restore': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <RefreshCw size={16} strokeWidth={2.5} />, border: 'border-emerald-100' };
   case 'delete': return { bg: 'bg-rose-50', text: 'text-rose-600', icon: <Trash2 size={16} strokeWidth={2.5} />, border: 'border-rose-100' };
   default: return { bg: 'bg-slate-50', text: 'text-slate-600', icon: <FileText size={16} strokeWidth={2.5} />, border: 'border-slate-100' };
 }
};

const fileToBase64 = (file) => {
 return new Promise((resolve, reject) => {
   const reader = new FileReader();
   reader.readAsDataURL(file); 
   reader.onload = () => resolve(reader.result);
   reader.onerror = (error) => reject(error);
 });
};

export default function ManageOrgPage() {
 const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
 const [isSearching, setIsSearching] = useState(false);
 const [searchId, setSearchId] = useState("");
 const [cases, setCases] = useState([]); 
 const [orgId, setOrgId] = useState("");                       
 const [orgName, setOrgName] = useState("");
 const [logoPreview, setLogoPreview] = useState(null);
 const [qrReportUrl, setQrReportUrl] = useState("");
 const [staffCode, setStaffCode] = useState("-");
 const [adminCode, setAdminCode] = useState("-");
 const [isCsvEnabled, setIsCsvEnabled] = useState(false);
 const [isOfficial, setIsOfficial] = useState(false);
  
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [showQrModal, setShowQrModal] = useState(false); 
 const [galleryMode, setGalleryMode] = useState('logo'); 
 const [activeQrInfo, setActiveQrInfo] = useState(null);
 const [deleteReason, setDeleteReason] = useState("");
  
 const [qrList, setQrList] = useState([]); 
 const [showQrEditor, setShowQrEditor] = useState(false);
 const [selectedFrame, setSelectedFrame] = useState("none");
 const [qrText, setQrText] = useState("สแกนเพื่อแจ้งเหตุ");
 const [textSize, setTextSize] = useState(20);
 const [textPos, setTextPos] = useState(380);
 const [newQrFile, setNewQrFile] = useState(null);

 const [originalSettings, setOriginalSettings] = useState({ frame: "none", text: "สแกนเพื่อแจ้งเหตุ", size: 20, pos: 380 });

 const isQrModified = useMemo(() => {
   return (
     selectedFrame !== originalSettings.frame ||
     qrText !== originalSettings.text ||
     textSize !== originalSettings.size ||
     textPos !== originalSettings.pos ||
     newQrFile !== null 
   );
 }, [selectedFrame, qrText, textSize, textPos, originalSettings, newQrFile]);
  
 const [showMobileEditPanel, setShowMobileEditPanel] = useState(true);
 const [showMobileTimeline, setShowMobileTimeline] = useState(false); 
 const editPanelRef = useRef(null);
 const staffScrollRef = useRef(null);
 const qrScrollRef = useRef(null);

 const [staffScrollPos, setStaffScrollPos] = useState({ left: true, right: false });
 const [qrScrollPos, setQrScrollPos] = useState({ left: true, right: false });
 const [showNameHistory, setShowNameHistory] = useState(false);

 const [updateModal, setUpdateModal] = useState({ show: false, type: "", title: "", newValue: null, reason: "" });
 const [showPhotoActionMenu, setShowPhotoActionMenu] = useState(false);
 const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

 const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 
 const API_URL_MANAGE = process.env.NEXT_PUBLIC_DB_MANAGE_ORG_API_URL || "";
 const uploadApiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL;
 const STORAGE_BASE_URL = "https://storage.googleapis.com/traffy_public_bucket/";
  const [auditLogs, setAuditLogs] = useState([]);
  const [photoHistory, setPhotoHistory] = useState([]); // 🟢 State เก็บประวัติรูปภาพ
  const [csvHistory, setCsvHistory] = useState([]); // 🟢 State เก็บประวัติ CSV
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // 🟢 2. ฟังก์ชันดึงและแปลง Log สำหรับหน้าจัดการหน่วยงาน
  const fetchAuditLogs = async (targetOrgId) => {
    if (!targetOrgId) return;
    setIsLoadingLogs(true);
    try {
      const logsUrl = `${process.env.NEXT_PUBLIC_LOGGING_API}&target_id=eq.${targetOrgId}`;
      const response = await fetch(logsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LOGING_JWT_TOKEN}`
        }
      });

      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();

      const formattedLogs = data.map((log, index) => {
        let uiType = 'default';
        let actionText = 'อัปเดตข้อมูลหน่วยงาน';
        let detailText = log.reason || log.payload?.description || 'มีการปรับปรุงข้อมูลในระบบ';

        const act = log.action?.toUpperCase() || "";

        // แยกประเภทตาม Action ที่กำหนดใน manage_org.js
        if (act === 'GROUP_SOFT_DELETE') {
          uiType = 'delete';
          actionText = 'ลบหน่วยงาน';
        } else if (act === 'GROUP_RESTORE') {
          uiType = 'restore';
          actionText = 'กู้คืนหน่วยงาน';
        } else if (act === 'GROUP_UPDATE_INFO') {
          const actionsPerformed = log.payload?.actions_performed || [];
          
          if (actionsPerformed.includes('switch official') || actionsPerformed.includes('switch download_csv')) {
            uiType = 'security';
            actionText = 'อัปเดตสิทธิ์หน่วยงาน';
          } else if (actionsPerformed.includes('change name') || actionsPerformed.includes('change photo')) {
            uiType = 'edit';
            actionText = 'แก้ไขข้อมูลพื้นฐาน';
          } else {
            uiType = 'edit';
          }
          
          if (actionsPerformed.includes('change photo')) {
            const photoChanges = log.payload?.status_changes?.photo;
            if (photoChanges && photoChanges.old_value !== photoChanges.new_value) {
                detailText = (
                    <div className="flex flex-col gap-2 mt-1">
                        <span>เปลี่ยนรูปโปรไฟล์จาก:</span>
                        {photoChanges.old_value ? (
                            <img 
                                src={`https://storage.googleapis.com/traffy_public_bucket/${photoChanges.old_value}`} 
                                alt="old preview" 
                                className="w-24 h-24 object-contain rounded-lg border border-slate-200 shadow-sm bg-white p-1" 
                            />
                        ) : (
                            <span className="text-slate-400 italic">ไม่มีรูปโปรไฟล์เดิม</span>
                        )}
                        <span>เป็น:</span>
                        {photoChanges.new_value ? (
                            <img 
                                src={`https://storage.googleapis.com/traffy_public_bucket/${photoChanges.new_value}`} 
                                alt="preview" 
                                className="w-24 h-24 object-contain rounded-lg border border-slate-200 shadow-sm bg-white p-1" 
                            />
                        ) : (
                            <span className="text-slate-400 italic">ไม่มีรูปโปรไฟล์ใหม่</span>
                        )}
                        {log.reason && (
                            <div className="mt-1 p-2 bg-slate-100 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-700">เหตุผล: </span>
                                <span className="text-slate-600">{log.reason}</span>
                            </div>
                        )}
                    </div>
                );
            }
          } else if (actionsPerformed.includes('switch download_csv')) {
            const csvChanges = log.payload?.status_changes?.download_csv;
            if (csvChanges) {
                const oldStatus = csvChanges.old_status === 'true' || csvChanges.old_status === true;
                const newStatus = csvChanges.new_status === 'true' || csvChanges.new_status === true;
                
                detailText = (
                    <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">สิทธิ์ดาวน์โหลด CSV จาก:</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${oldStatus ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-600'}`}>
                                {oldStatus ? 'ปิด' : 'ปิด'}
                            </span>
                            <span className="text-slate-500">เป็น:</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${newStatus ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-600'}`}>
                                {newStatus ? 'เปิด' : 'ปิด'}
                            </span>
                        </div>
                        {log.reason && (
                            <div className="mt-1 p-2 bg-slate-100 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-700">เหตุผล: </span>
                                <span className="text-slate-600">{log.reason}</span>
                            </div>
                        )}
                    </div>
                );
            }
          } else if (actionsPerformed.includes('switch official')) {
             const officialChanges = log.payload?.status_changes?.official_group || log.payload?.status_changes?.official;
             if (officialChanges) {
                 const oldStatus = officialChanges.old_status === 'true' || officialChanges.old_status === true || officialChanges.old_value === 'true' || officialChanges.old_value === true;
                 const newStatus = officialChanges.new_status === 'true' || officialChanges.new_status === true || officialChanges.new_value === 'true' || officialChanges.new_value === true;

                 detailText = (
                    <div className="flex flex-col gap-2 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">สถานะ Official จาก:</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${oldStatus ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-600'}`}>
                                {oldStatus ? 'เปิด' : 'ปิด'}
                            </span>
                            <span className="text-slate-500">เป็น:</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${newStatus ? 'bg-green-100 text-green-700' : 'bg-red-200 text-red-600'}`}>
                                {newStatus ? 'เปิด' : 'ปิด'}
                            </span>
                        </div>
                        {log.reason && (
                            <div className="mt-1 p-2 bg-slate-100 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-700">เหตุผล: </span>
                                <span className="text-slate-600">{log.reason}</span>
                            </div>
                        )}
                    </div>
                );
             }
          }else if (actionsPerformed.includes('change name')) {
             const nameChanges = log.payload?.status_changes?.name;
             if (nameChanges) {
                detailText = (
                    <div className="flex flex-col gap-2 mt-1">
                        <div className="flex flex-col gap-1 text-[12px]">
                            <div><span className="text-slate-500">เปลี่ยนชื่อจาก:</span> <span className="line-through text-slate-400">{nameChanges.old_value || '-'}</span></div>
                            <div><span className="text-slate-500">เป็น:</span> <span className="font-bold text-indigo-600">{nameChanges.new_value || '-'}</span></div>
                        </div>
                        {log.reason && (
                            <div className="mt-1 p-2 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                                <span className="font-bold text-slate-700">เหตุผล: </span>
                                <span className="text-slate-600">{log.reason}</span>
                            </div>
                        )}
                    </div>
                );
             }
          } else if (actionsPerformed.length > 0 && !log.reason) {
            const translatedActions = actionsPerformed.map(a => {
              if (a === 'change name') return 'เปลี่ยนชื่อ';
              if (a === 'change photo') return 'เปลี่ยนรูปโปรไฟล์';
              if (a === 'switch official') return 'ปรับสถานะ Official';
              if (a === 'switch download_csv') return 'ปรับสิทธิ์ดาวน์โหลด CSV';
              return a;
            });
            detailText = `รายการที่แก้ไข: ${translatedActions.join(', ')}`;
          }
        }

        return {
          id: log.id || `log-${index}`,
          type: uiType,
          action: actionText,
          detail: detailText,
          user: log.actor_name || 'System Admin',
          time: log.created_at ? new Date(log.created_at).toLocaleString('th-TH') : 'ไม่ระบุเวลา'
        };
      });

      setAuditLogs(formattedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setAuditLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 🟢 3. ฟังก์ชันดึง Photo History จาก API
  const fetchPhotoHistory = async (targetOrgId) => {
    if (!targetOrgId) return;
    
    try {
        const url = `${process.env.NEXT_PUBLIC_LOGGING_API}&target_id=eq.${targetOrgId}&action=eq.GROUP_UPDATE_INFO&order=created_at.desc&select=created_at,actor_name,reason,new_photo:payload->status_changes->photo->>new_value,old_photo:payload->status_changes->photo->>old_value`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LOGING_JWT_TOKEN}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch photo history");
        const data = await response.json();

        const formattedHistory = data
            .filter(log => log.new_photo)
            .map((log, index) => ({
                id: `history-${index}`,
                url: log.new_photo.startsWith("http") ? log.new_photo : STORAGE_BASE_URL + log.new_photo,
                user: log.actor_name || "ระบบ",
                date: new Date(log.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
                time: new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                reason: log.reason || "อัปเดตรูปโปรไฟล์หน่วยงาน"
            }));

        setPhotoHistory(formattedHistory);
    } catch (error) {
        console.error("Error fetching photo history:", error);
        setPhotoHistory([]);
    }
  };

  // 🟢 4. ฟังก์ชันดึง CSV History จาก API
  const fetchCsvHistory = async (targetOrgId) => {
    if (!targetOrgId) return;
    
    try {
        const url = `${process.env.NEXT_PUBLIC_LOGGING_API}&target_id=eq.${targetOrgId}&action=eq.GROUP_UPDATE_INFO&order=created_at.desc&select=created_at,actor_name,reason,new_status:payload->status_changes->download_csv->>new_status,old_status:payload->status_changes->download_csv->>old_status`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_LOGING_JWT_TOKEN}`
            }
        });

        if (!response.ok) throw new Error("Failed to fetch csv history");
        const data = await response.json();

        const formattedHistory = data
            .filter(log => log.new_status !== undefined) // กรองเฉพาะ log ที่มีข้อมูลสถานะ CSV
            .map((log, index) => ({
                id: `csv-history-${index}`,
                new_status: log.new_status === 'true' || log.new_status === true,
                old_status: log.old_status === 'true' || log.old_status === true,
                user: log.actor_name || "ระบบ",
                date: new Date(log.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
                time: new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                reason: log.reason || "อัปเดตสิทธิ์การดาวน์โหลด CSV"
            }));

        setCsvHistory(formattedHistory);
    } catch (error) {
        console.error("Error fetching csv history:", error);
        setCsvHistory([]);
    }
  };

 const scrollToEdit = () => {
    setShowMobileEditPanel(true);
    setShowMobileTimeline(false);
    setTimeout(() => {
        editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
 };

 const combinedPhotoHistory = useMemo(() => {
   const history = [...photoHistory];
   if (logoPreview) {
     const currentUrl = (logoPreview.includes("blob:") || logoPreview.startsWith("http")) ? logoPreview : STORAGE_BASE_URL + logoPreview;
     return [{ id: 'current', url: currentUrl, user: "แอดมิน ระบบ", date: "ปัจจุบัน", time: "-", reason: "รูปภาพโปรไฟล์ที่กำลังใช้งานอยู่ ณ ปัจจุบัน" }, ...history];
   }
   return history;
 }, [logoPreview, photoHistory]);

 const handleScrollCheck = (ref, setPosState) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      const maxScroll = scrollWidth - clientWidth;
      
      setPosState({
        left: scrollLeft <= 40, 
        right: scrollLeft >= maxScroll - 40 || maxScroll <= 5
      });
    }
  };

  // 🟢 โหลด Log และ Photo History ทุกครั้งที่เลือกหน่วยงานใหม่
  useEffect(() => {
    if (orgId) {
      fetchAuditLogs(orgId);
      fetchPhotoHistory(orgId);
      fetchCsvHistory(orgId); // เพิ่มการเรียก fetchCsvHistory
    } else {
      setAuditLogs([]); 
      setPhotoHistory([]);
      setCsvHistory([]);
    }
  }, [orgId]);

 useEffect(() => {
  if (staffScrollRef.current) {
    staffScrollRef.current.scrollLeft = 0;
    setStaffScrollPos({ left: true, right: false }); 
    const timer = setTimeout(() => handleScrollCheck(staffScrollRef, setStaffScrollPos), 200);
    return () => clearTimeout(timer);
  }
 }, [orgId, cases]);

 useEffect(() => {
  if (qrScrollRef.current) {
    qrScrollRef.current.scrollLeft = 0;
    setQrScrollPos({ left: true, right: false }); 
    const timer = setTimeout(() => handleScrollCheck(qrScrollRef, setQrScrollPos), 200);
    return () => clearTimeout(timer);
  }
 }, [orgId, qrList]);

const fetchOrgData = async (targetId = "") => {
    const sanitizedQuery = targetId.trim().replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s]/g, "");
    if (!sanitizedQuery) return;
    setIsSearching(true);

    try {
      const res = await fetch(`${API_URL_ORG}?q=${encodeURIComponent(sanitizedQuery)}`);
      const result = await res.json();
      
      if (result.found && result.data) {
        const newData = result.data.map(item => ({
          org_id: String(item.id),
          org_name: String(item.name || ""),
          logo_url: String(item.photo || ""), 
          is_deleted: !!item.deleted_at || item.status === 'deleted',
          is_official: item.official_group === true, 
          allow_csv: item.download_csv === true, 
          admin_codes: item.admin_codes || [],
          qr_report_url: item.qr_report_url || "",
          members: item.members || []
        }));

        setCases(newData);

        if (orgId) {
            const currentSelected = newData.find(item => item.org_id === orgId);
            if (currentSelected) {
                setOrgName(currentSelected.org_name);
                setLogoPreview(currentSelected.logo_url);
                setIsOfficial(currentSelected.is_official);
                setIsCsvEnabled(currentSelected.allow_csv);
                setQrReportUrl(currentSelected.qr_report_url);
            }
        }
      } else {
        setCases([]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally { 
      setIsSearching(false); 
    }
};

 const filteredCases = useMemo(() => orgId ? cases.filter(item => item.org_id === orgId) : cases, [cases, orgId]);

 const scrollStaff = (direction) => {
   if (staffScrollRef.current) {
     const scrollAmount = staffScrollRef.current.offsetWidth * 0.8;
     staffScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
     setTimeout(() => handleScrollCheck(staffScrollRef, setStaffScrollPos), 500);
   }
 };

 const scrollQr = (direction) => {
   if (qrScrollRef.current) {
     const scrollAmount = qrScrollRef.current.offsetWidth * 0.8;
     qrScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
     setTimeout(() => handleScrollCheck(qrScrollRef, setQrScrollPos), 500);
   }
 };

 const handleIndividualUpdate = async () => {
   if (!orgId || !updateModal.reason.trim()) return;
   const rawAdminId = localStorage.getItem('current_admin_id');  
   const adminId = rawAdminId ? rawAdminId.replace(/"/g, '') : null;
   const currentOrgData = cases.find(item => item.org_id === orgId);
   
   setIsSearching(true);
   try {
     let payload = { current_admin_id: adminId, description: updateModal.reason, restore: false };
     if (updateModal.type === 'name') { payload.name = updateModal.newValue; payload.old_name = currentOrgData.org_name; }
     else if (updateModal.type === 'csv') { payload.download_csv = updateModal.newValue; payload.old_download = currentOrgData.allow_csv; }
     else if (updateModal.type === 'official') { payload.official_group = updateModal.newValue; payload.old_official = currentOrgData.is_official; }
     else if (updateModal.type === 'restore') { payload.restore = true; }
     else if (updateModal.type === 'qr_edit') {
       payload.qr_config = updateModal.newValue;
       payload.old_qr_url = currentOrgData?.qr_report_url || "";
       if (updateModal.newValue.file) {
         const base64Image = await fileToBase64(updateModal.newValue.file);
         const uploadRes = await fetch(uploadApiUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ folder_path: `attachment/org_${orgId}`, image: base64Image }), 
         });
         const uploadResult = await uploadRes.json();
         if (uploadRes.ok && uploadResult.photo_link) { payload.file_url = uploadResult.photo_link.replace(STORAGE_BASE_URL, ""); } 
         else { throw new Error("Upload QR image failed"); }
       }
     } else if (updateModal.type === 'logo') {
  const base64Image = await fileToBase64(updateModal.newValue);
  const uploadRes = await fetch(uploadApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_path: `attachment/org_${orgId}`, image: base64Image }), 
  });
  const uploadResult = await uploadRes.json();
  
  if (uploadRes.ok && uploadResult.photo_link) { 
    payload.file_url = uploadResult.photo_link.replace(STORAGE_BASE_URL, ""); 
    payload.old_url = currentOrgData.logo_url; // ✅ เพิ่มบรรทัดนี้เข้าไป
  } 
  else { 
    throw new Error("Upload logo failed"); 
  }
}

    const response = await fetch(`${API_URL_MANAGE}?id=${orgId}`, {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload),
     });

     const result = await response.json();
     if (response.ok && result.success) {
       alert(updateModal.type === 'restore' ? "กู้คืนหน่วยงานสำเร็จ" : `แก้ไข${updateModal.title}สำเร็จ`);
       setUpdateModal({ show: false, type: "", title: "", newValue: null, reason: "" });
       setShowQrEditor(false); 
       await fetchOrgData(searchId); 
       
       if (orgId) {
         fetchAuditLogs(orgId);
         fetchPhotoHistory(orgId); // รีเฟรชประวัติรูปภาพด้วย
       }
       
     } else {
       alert("เกิดข้อผิดพลาด: " + (result.message || result.error));
     }
   } catch (error) {
     alert("ไม่สามารถดำเนินการได้: " + error.message);
   } finally {
     setIsSearching(false);
   }
 };

 const handleDelete = async () => {
   if (!orgId || !deleteReason.trim()) return;
   try {
     const rawAdminId = localStorage.getItem('current_admin_id');
     const adminId = rawAdminId ? rawAdminId.replace(/"/g, '') : null;
     const response = await fetch(`${API_URL_MANAGE}?id=${orgId}`, {
       method: 'DELETE',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         current_admin_id: adminId,
         description: deleteReason
       }),
     });
     const result = await response.json();
     if (response.ok && result.success) {
       alert("ลบหน่วยงานเรียบร้อยแล้ว");
       setShowDeleteModal(false);
       setDeleteReason("");
       setOrgId("");
       await fetchOrgData(searchId);
     } else {
       alert("การลบผิดพลาด: " + (result.message || result.error));
     }
   } catch (error) {
     alert("Error: " + error.message);
   }
 };

 const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert("คัดลอกเรียบร้อย: " + text); };

 const handleDownloadQR = async (url, orgName) => {
   if (!url) return;
   try {
     const response = await fetch(url);
     const blob = await response.blob();
     const blobUrl = window.URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = blobUrl;
     link.download = `QR_Report_${orgName || 'Organization'}.jpg`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     window.URL.revokeObjectURL(blobUrl);
   } catch (error) { window.open(url, '_blank'); }
 };

 useEffect(() => {
   if (qrReportUrl) {
     setQrList([
       { id: 1, url: qrReportUrl, label: "QR หลัก (หน้าหน่วยงาน)" },
       { id: 2, url: qrReportUrl, label: "QR ประตูทางเข้า" },
       { id: 3, url: qrReportUrl, label: "QR จุดคัดกรอง" }
     ]);
   } else { setQrList([]); }
 }, [qrReportUrl]);

 const TimelineComponent = () => {
   const [activeLogFilter, setActiveLogFilter] = useState('ทั้งหมด');

   const filterMap = {
     'ทั้งหมด': ['edit', 'security', 'restore', 'delete', 'default'],
     'การแก้ไข': ['edit', 'delete'],
     'ความปลอดภัย': ['security'],
     'ระบบ': ['restore', 'default']
   };

   const displayLogs = auditLogs.filter(log => filterMap[activeLogFilter]?.includes(log.type) || activeLogFilter === 'ทั้งหมด');

   return (
     <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative w-full">
       <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-white z-0"></div>
       <div className="p-6 pb-4 relative z-10">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md shrink-0"><Activity size={20} /></div>
             <div>
               <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Activity Log</h3>
               <div className="flex items-center gap-1.5 mt-1.5">
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</p>
               </div>
             </div>
           </div>
           <button className="w-10 h-10 shrink-0 bg-white border border-slate-200 hover:border-black hover:bg-black hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-all active:scale-95"><Filter size={16} strokeWidth={2.5} /></button>
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
           {['ทั้งหมด', 'การแก้ไข', 'ความปลอดภัย', 'ระบบ'].map((tag, i) => (
             <button 
                key={i} 
                onClick={() => setActiveLogFilter(tag)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${activeLogFilter === tag ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'}`}
             >
                {tag}
             </button>
           ))}
         </div>
       </div>
       <div className="px-6 pb-6 pr-4 relative z-10 max-h-[450px] overflow-y-auto custom-scrollbar">
         <div className="absolute left-[39px] top-4 bottom-12 w-[2px] bg-slate-100 z-0 rounded-full"></div>
         <div className="space-y-4 pt-2">
            
             {isLoadingLogs ? (
                 <div className="py-10 text-center text-sm font-bold text-slate-400 flex flex-col items-center gap-3">
                     <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
                     กำลังโหลดข้อมูลกิจกรรม...
                 </div>
             ) : displayLogs.length > 0 ? (
                 displayLogs.map((item) => {
                   const styles = getTypeStyles(item.type);
                   return (
                     <div key={item.id} className="relative flex gap-4 group z-10 animate-fade-in">
                       <div className={`relative w-9 h-9 shrink-0 rounded-xl ${styles.bg} ${styles.text} border-2 ${styles.border} flex items-center justify-center transition-all duration-500 group-hover:scale-110 z-20 shadow-sm bg-white`}>{React.cloneElement(styles.icon, { size: 14 })}</div>
                       <div className="flex-1 min-w-0 pt-0.5">
                         <div className="flex justify-between items-center mb-1 gap-2">
                           <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.action}</h4>
                           <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{item.time}</span>
                         </div>
                         <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 transition-all">
                           <div className="text-[11px] text-slate-600 font-medium leading-tight break-words">{item.detail}</div>
                           <div className="flex items-center gap-1.5 mt-2 opacity-60">
                             <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">{item.user.charAt(0)}</div>
                             <span className="text-[9px] font-bold text-slate-500 tracking-tight">{item.user}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })
             ) : (
                 <div className="py-10 text-center text-sm font-bold text-slate-400 flex flex-col items-center">
                     <Activity size={32} className="opacity-20 mb-2" />
                     ไม่พบประวัติการทำรายการ
                 </div>
             )}

         </div>
       </div>
       <div className="p-4 pt-2 bg-white border-t border-slate-50 relative z-20">
       </div>
     </div>
   );
 };

 return (
   <div data-theme="light" className="min-h-screen bg-[#F4F6F8] text-slate-900 font-sans overflow-x-hidden">
     <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

     <div className={`w-full pt-24 lg:pt-6 pb-24 transition-all duration-300 min-h-screen ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-28"}`}>
       <div className="container mx-auto px-4 max-w-[1600px]">
         <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
           
           <div className={`flex-1 min-w-0 w-full transition-all duration-500 ${!orgId ? 'max-w-4xl mx-auto mt-4' : 'xl:order-1'}`}>
             
             {!orgId && (
               <div className="animate-in fade-in duration-500">
                  <header className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-[#1A1C1E] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><Building2 size={24} strokeWidth={2.5} /></div>
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 leading-none mb-1.5 tracking-tight">จัดการหน่วยงาน</h1>
                      <p className="text-slate-500 font-bold text-sm">ตั้งค่าสิทธิ์ รหัสเข้าใช้งาน และสถานะหน่วยงาน</p>
                    </div>
                  </header>
                    
                  <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-10 w-full">
                    <div 
                      className="relative flex-1 group bg-white rounded-2xl shadow-sm border-2 border-slate-100 focus-within:border-indigo-500 focus-within:shadow-md transition-all flex items-center px-5 w-full"
                      style={{ height: '60px', minHeight: '60px' }}
                    >
                      <Search className="text-slate-400 shrink-0" size={22} />
                      <input 
                        type="text" 
                        className="flex-1 min-w-0 bg-transparent border-none outline-none font-bold ml-3 text-slate-800 placeholder:text-slate-400 w-full text-base truncate" 
                        placeholder="ค้นหาชื่อ, ชื่อย่อ หรือ ID หน่วยงาน..." 
                        value={searchId} 
                        onChange={(e) => setSearchId(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
                      />
                    </div>

                    <button 
                      onClick={() => fetchOrgData(searchId)} 
                      className="btn px-10 !bg-black !text-white !font-bold !rounded-2xl shadow-lg shrink-0 text-base flex items-center justify-center border-none w-full sm:w-auto"
                      style={{ height: '60px', minHeight: '60px' }}
                    >
                      {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
                    </button>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-[15px] font-black text-slate-600 uppercase tracking-[0.2em] mb-5 px-1">ผลการค้นหา</h3>
                    {filteredCases.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {filteredCases.map((item) => {
                          return (
                            <div key={item.org_id} onClick={() => { setOrgId(item.org_id); setOrgName(item.org_name); setLogoPreview(item.logo_url); setIsOfficial(item.is_official); setIsCsvEnabled(item.allow_csv); setQrReportUrl(item.qr_report_url); if (item.admin_codes?.length > 0) { setAdminCode(item.admin_codes[0].code || "ไม่มีรหัส"); setStaffCode(item.admin_codes[0].code_staff || "ไม่มีรหัส"); } else { setAdminCode("-"); setStaffCode("-"); } setShowMobileEditPanel(true); setShowMobileTimeline(false); }} 
       className={`relative bg-white rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 border border-slate-100 flex flex-col p-2 shadow-sm hover:shadow-md hover:border-slate-300 ${item.is_deleted ? 'opacity-75 grayscale' : ''}`}><div className="h-32 w-full relative overflow-hidden rounded-2xl bg-slate-50 p-3 flex items-center justify-center">
                                {item.logo_url ? <img src={STORAGE_BASE_URL + item.logo_url} className={`max-w-full max-h-full object-contain transition-transform duration-700`} alt="Logo" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><ImageIcon size={32} className="text-slate-300" /></div>}
                              </div>
                              <div className="p-4 flex flex-col flex-1 text-slate-900 min-w-0">
                                 <h4 className="font-black text-base mb-1 tracking-tight leading-snug truncate" title={item.org_name}>{item.org_name}</h4>
                                 <div className="mt-auto flex items-center justify-between gap-2">
                                   <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">ID: {item.org_id}</span>
                                   <div className="w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 bg-slate-100 text-slate-400"><ChevronRight size={14} strokeWidth={4} /></div>
                                 </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm py-24 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><MousePointerClick size={32} className="opacity-20" /></div>
                        <p className="font-bold text-sm uppercase tracking-widest text-slate-300">ระบุรหัสเพื่อเริ่มจัดการ</p>
                      </div>
                    )}
                  </div>
               </div>
             )}

             {orgId && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 mt-4">
                 
                 <button 
                   onClick={() => { setOrgId(""); setOrgName(""); setLogoPreview(null); }} 
                   className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-600 hover:text-black hover:shadow-md rounded-2xl font-black text-sm transition-all border border-slate-100 active:scale-95 w-fit mb-4"
                 >
                   <ArrowLeft size={18} strokeWidth={3} /> กลับไปหน้าค้นหาหน่วยงาน
                 </button>

                 <div className="xl:hidden grid grid-cols-2 gap-3">
                     <button onClick={() => showMobileEditPanel ? setShowMobileEditPanel(false) : scrollToEdit()} className={`btn h-16 rounded-2xl border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-tight ${showMobileEditPanel ? 'bg-indigo-700 text-white' : 'bg-white text-slate-900 border-2 border-slate-100'}`}>
                       <Settings2 size={16} /> {showMobileEditPanel ? 'ปิดการจัดการ' : 'จัดการข้อมูล'}
                     </button>
                     <button onClick={() => { setShowMobileTimeline(!showMobileTimeline); setShowMobileEditPanel(false); }} className={`btn h-16 rounded-2xl border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-tight ${showMobileTimeline ? 'bg-black text-white' : 'bg-white text-slate-900 border-2 border-slate-100'}`}>
                       <History size={16} /> {showMobileTimeline ? 'ปิดไทม์ไลน์' : 'ดูไทม์ไลน์'}
                     </button>
                 </div>

                 {showMobileTimeline && <div className="xl:hidden animate-in slide-in-from-top-4 duration-300"><TimelineComponent /></div>}

                 <div ref={editPanelRef} className={`space-y-6 ${!showMobileEditPanel ? 'hidden xl:block' : 'block animate-in slide-in-from-top-4 duration-500'}`}>
                     <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                         <div className="flex flex-col md:flex-row gap-8">
                             <div className="relative shrink-0 mx-auto md:mx-0">
                              <div onClick={() => setShowPhotoActionMenu(!showPhotoActionMenu)} className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner cursor-pointer hover:border-indigo-400 transition-all group relative">
                                  {logoPreview ? <img src={logoPreview.includes("blob:") ? logoPreview : STORAGE_BASE_URL + logoPreview} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-all duration-500" alt="Preview" /> : <ImageIcon size={32} className="text-slate-400" />}
                                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/80 backdrop-blur-md text-white rounded-xl shadow-lg border border-white/20 z-20">
                                      <PencilLine size={14} strokeWidth={3} />
                                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">แก้ไข</span>
                                  </div>
                              </div>
                             {showPhotoActionMenu && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-6 z-[110] w-[210px] bg-white rounded-[2rem] border border-slate-100 p-2 shadow-2xl after:content-[''] after:absolute after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-t-[10px] after:border-t-white">
                                  <div className="flex flex-col gap-0.5">
                                    <button onClick={() => { setGalleryMode('logo'); setCurrentPhotoIndex(0); setShowQrModal(true); setShowPhotoActionMenu(false); }} className="grid grid-cols-[60px_1fr] items-center w-full px-3 py-3 hover:bg-slate-50 rounded-2xl transition-all group">
                                      <div className="flex items-center justify-center"><UserCircle2 size={24} strokeWidth={1.5} className="text-[#1a2b3b]" /></div>
                                      <span className="text-[15px] font-bold text-[#1a2b3b] text-left">ดูรูปโปรไฟล์</span>
                                    </button>
                                    <label className="grid grid-cols-[60px_1fr] items-center w-full px-3 py-3 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer">
                                      <div className="flex items-center justify-center"><ImageIcon size={20} strokeWidth={1.5} className="text-[#1a2b3b]" /></div>
                                      <span className="text-[15px] font-bold text-[#1a2b3b] text-left">เลือกรูปโปรไฟล์</span>
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setUpdateModal({ show: true, type: 'logo', title: 'รูปภาพหน่วยงาน', newValue: file, reason: "" }); setShowPhotoActionMenu(false); } }} />
                                    </label>
                                  </div>
                                </div>
                              )}
                             </div>
                                                                                                                                              
                            <div className="relative w-full">
                              <div className="flex justify-between items-end mb-2 px-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest pb-1">ชื่อหน่วยงานเต็ม</label>
                              </div>

                              <div className="flex items-center gap-3 w-full">
                               <div className="relative flex-1 group">
                                 <div className={`tooltip tooltip-bottom before:max-w-[300px] w-full ${!orgName ? 'before:hidden' : ''}`} data-tip={orgName}>
                                  <div className="relative w-full">
                                    <input
                                      type="text"
                                      value={orgName}
                                      onChange={(e) => setOrgName(e.target.value)}
                                      className="input input-bordered w-full rounded-2xl font-bold bg-white text-slate-900 border border-slate-200 focus:border-indigo-500 transition-all text-base shadow-sm h-14 px-5 pr-[115px] relative z-10" placeholder="ระบุชื่อหน่วยงาน..."
                                    />
                                  </div>
                                 </div>

                                 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20 bg-white/80 backdrop-blur-sm pl-2 rounded-r-2xl">
                                  <div className="relative flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => setShowNameHistory(!showNameHistory)}
                                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                        showNameHistory ? "bg-slate-900 text-white shadow-md" : "bg-transparent text-slate-400 hover:bg-slate-100 hover:text-black"
                                      }`}
                                    >
                                      <History size={20} strokeWidth={2.5} />
                                    </button>

                                    {showNameHistory && (
                                      <>
                                        <div className="fixed inset-0 z-[100]" onClick={() => setShowNameHistory(false)} />
                                        <div className="absolute top-[120%] right-0 z-[110] w-[320px] max-w-[calc(100vw-32px)] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-left border-2 border-black">
                                          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                            <div className="w-2.5 h-2.5 bg-black rounded-full shrink-0"></div>
                                            <span className="text-xs font-black uppercase tracking-[0.15em] text-black">Name Revision History</span>
                                          </div>
                                          <div className="space-y-4 ml-1">
                                            {[
                                              { old: "อบต. เดิม", new: "เทศบาลนครนนทบุรี", user: "ธนกฤต แอดมิน", date: "24 ก.พ. 2026" },
                                              { old: "หน่วยงานทดสอบ", new: "อบต. เดิม", user: "Super Admin", date: "10 ม.ค. 2026" }
                                            ].map((h, i, arr) => (
                                              <div key={i} className="flex gap-3 relative">
                                                {i !== arr.length - 1 && <div className="absolute left-[2.5px] top-3 bottom-[-1.5rem] w-[1.5px] bg-slate-300"></div>}
                                                <div className="flex flex-col items-center mt-1.5 z-10"><div className="w-1.5 h-1.5 bg-black rounded-full"></div></div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-[13px] font-bold text-slate-900 leading-tight mb-1 truncate">
                                                    <span className="text-slate-400 mr-1.5 font-medium line-through">{h.old}</span>
                                                    <span className="text-black font-black">{h.new}</span>
                                                  </p>
                                                  <p className="text-[10px] font-bold text-slate-500 uppercase">By {h.user} • {h.date}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                    <button type="button" onClick={() => copyToClipboard(orgName)} className="w-10 h-10 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all active:scale-95"><Copy size={20} /></button>
                                  </div>
                                </div>
                                 <button type="button" onClick={() => setUpdateModal({ show: true, type: "name", title: "ชื่อหน่วยงาน", newValue: orgName, reason: "" })} className="btn h-14 w-14 bg-black text-white rounded-2xl border-none shadow-md hover:scale-105 transition-all flex items-center justify-center shrink-0"><Save size={20} /></button>
                              </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                                 <label className="text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Staff Code</label>
                                 <div className="flex items-center justify-between gap-2 overflow-hidden">
                                     <code className="text-base font-bold text-blue-700 break-all leading-tight">{staffCode}</code>
                                     <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-black shadow-sm transition-all"><Copy size={16} /></button>
                                 </div>
                                 </div>
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                                 <label className="text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Admin Code</label>
                                 <div className="flex items-center justify-between gap-2 overflow-hidden">
                                     <code className="text-base font-bold text-red-700 break-all leading-tight">{adminCode}</code>
                                     <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-black shadow-sm transition-all"><Copy size={16} /></button>
                                 </div>
                                 </div>
                             </div>
                             </div>
                         </div>
                     </div>
                     
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center border border-green-100 shrink-0">
                            <FileSpreadsheet size={20} />
                          </div>
                          <div className="min-w-0 pr-2">
                            <p className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate">การส่งออก CSV</p>
                            <p className="text-[10px] sm:text-sm text-slate-500 font-bold tracking-tight truncate">อนุญาตให้ดาวน์โหลดรายงาน</p>
                          </div>
                        </div>
                        
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={isCsvEnabled}
                        onChange={(e) => setUpdateModal({ 
                          show: true, 
                          type: 'csv', 
                          title: 'สิทธิ์ CSV', 
                          newValue: e.target.checked, 
                          reason: "" 
                        })}
                      />
                      <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-[#22c55e]"></div>
                    </label>
                      </div>

                      <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
                            <ShieldCheck size={20} />
                          </div>
                          <div className="min-w-0 pr-2">
                            <p className="font-black text-sm sm:text-base text-slate-900 tracking-tight truncate">Official Account</p>
                            <p className="text-[10px] sm:text-sm text-slate-500 font-bold tracking-tight truncate">ยืนยันตัวตนทางการ</p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={isOfficial}
                            onChange={(e) => setUpdateModal({ show: true, type: 'official', title: 'สถานะ Official', newValue: e.target.checked, reason: "" })}
                          />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-[#00AAFF] peer-checked:border-[#00AAFF] border-2 border-transparent"></div>
                        </label>
                      </div>
                    </div>

                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                         <div className="flex row items-center justify-between mb-8 px-1 gap-4">
                             <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                             <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0"><UserCheck size={20} /></div>
                             <div className="min-w-0 flex-1">
                                 <p className="font-bold text-base text-slate-900 uppercase tracking-tight truncate">รายชื่อเจ้าหน้าที่</p>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">ผู้ดูแลระบบประจำหน่วยงาน</p>
                             </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="shrink-0 text-[11px] font-black bg-slate-100 px-4 py-2 rounded-full text-slate-800 border border-slate-200 whitespace-nowrap uppercase tracking-widest">{cases.find(c => c.org_id === orgId)?.members?.length || 0} คน</span>
                             </div>
                         </div>
                       <div className="relative w-full group/staff-container">
                        {!staffScrollPos.left && (
                          <button onClick={() => scrollStaff('left')} className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white border-2 border-slate-100 rounded-full shadow-2xl flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:scale-90 transition-all duration-300">
                            <ChevronLeft size={28} strokeWidth={3} />
                          </button>
                        )}
                        <div ref={staffScrollRef} onScroll={() => handleScrollCheck(staffScrollRef, setStaffScrollPos)} className="flex flex-row justify-start gap-6 overflow-x-auto pt-2 pb-6 px-1 scroll-smooth hide-scrollbar-on-mobile snap-x snap-proximity">
                          {cases.find((c) => c.org_id === orgId)?.members?.map((staff) => (
                            <div key={staff.member} className="w-[300px] bg-white rounded-[2.5rem] p-7 border border-slate-200 shadow-md flex flex-col items-center transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl group shrink-0 snap-center">
                              <div className="relative mb-5">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-[6px] border-white shadow-xl transition-all duration-500 group-hover:scale-105 bg-slate-100 flex items-center justify-center">
                                  {staff.picture_profile ? <img src={staff.picture_profile} className="w-full h-full object-cover" alt={staff.member_firstname} /> : <UserCircle2 size={40} className="text-slate-300" />}
                                </div>
                                <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#00945e] border-4 border-white rounded-full shadow-lg"></div>
                              </div>
                              <h4 className="font-bold text-lg text-slate-900 mb-2 tracking-tight w-full text-center truncate px-2">{staff.member_firstname} {staff.member_lastname}</h4>
                              <div className="flex items-center gap-1.5 mb-6 px-4 py-1 bg-slate-100 rounded-full">
                                <Shield size={12} className="text-slate-700" strokeWidth={2.5} />
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">{staff.role}</span>
                              </div>
                              <div className="w-full space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-slate-700 min-w-0 group/item">
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0"><Phone size={16} className="text-[#334155]" /></div>
                                  <span className="text-sm font-bold tracking-wide truncate flex-1">{staff.member_phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700 min-w-0 group/item relative overflow-hidden cursor-pointer" onClick={() => copyToClipboard(staff.email)}>
                                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover/item:bg-slate-100 transition-colors"><Mail size={16} className="text-[#334155]" /></div>
                                  <div className="relative flex-1 min-w-0"><span className="text-sm font-bold tracking-wide truncate block">{staff.email}</span></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!staffScrollPos.right && (cases.find((c) => c.org_id === orgId)?.members?.length || 0) > 1 && (
                          <button onClick={() => scrollStaff('right')} className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white border-2 border-slate-100 rounded-full shadow-2xl flex items-center justify-center text-slate-700 hover:bg-black hover:text-white active:scale-90 transition-all duration-300">
                            <ChevronRight size={28} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                     </div>
                     
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                         <div className="mb-6 px-1">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                               <div className="flex items-center gap-3 w-full sm:w-auto">
                                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0"><QrCode size={24} /></div>
                                 <div className="min-w-0 flex-1">
                                   <h2 className="font-black text-xl text-slate-900 uppercase tracking-tight leading-tight truncate">QR CODE ทั้งหมด</h2>
                                   <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">จุดรับแจ้งเหตุที่บันทึกไว้</p>
                                 </div>
                               </div>
                               <div className="flex items-center justify-end w-full sm:w-auto shrink-0">
                                   <button onClick={() => { setQrText("สแกนเพื่อแจ้งเหตุ"); setSelectedFrame("none"); setTextSize(20); setTextPos(380); setNewQrFile(null); setQrReportUrl(""); setOriginalSettings({ frame: "none", text: "", size: 20, pos: 380 }); setShowQrEditor(true); }} className="w-full sm:w-auto btn h-14 bg-slate-900 hover:bg-black text-white rounded-2xl px-8 border-none font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shrink-0">
                                     <Plus size={20} strokeWidth={3} /> เพิ่ม QR ใหม่
                                   </button>
                               </div>
                             </div>
                         </div>

                         <div className="relative w-full group/qr-container">
                          {!qrScrollPos.left && (
                            <button onClick={() => scrollQr('left')} className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white border-2 border-slate-100 rounded-full shadow-2xl flex items-center justify-center text-slate-700 hover:bg-indigo-600 hover:text-white active:scale-90 transition-all duration-300">
                              <ChevronLeft size={28} strokeWidth={3} />
                            </button>
                          )}
                          <div ref={qrScrollRef} onScroll={() => handleScrollCheck(qrScrollRef, setQrScrollPos)} className="flex gap-10 overflow-x-auto pb-10 pt-8 px-8 scroll-smooth hide-scrollbar-on-mobile snap-x snap-proximity">
                            {qrList.length > 0 ? qrList.map((qr) => (
                                <div key={qr.id} className="snap-center snap-always min-w-[260px] group relative bg-white rounded-[3.5rem] p-8 flex flex-col items-center transition-all duration-500 border border-slate-100 shadow-md hover:shadow-2xl shrink-0">
                                  <button onClick={() => handleDownloadQR(qr.url, `${orgName}_${qr.label}`)} className="absolute top-6 right-6 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center transition-all hover:bg-black hover:text-white hover:scale-110 active:scale-90 shadow-md z-20 border border-slate-200">
                                    <Download size={20} strokeWidth={2.5} />
                                  </button>
                                  <div className="w-28 h-28 rounded-xl overflow-hidden mb-6 border-2 border-slate-100 shadow-sm bg-white flex items-center justify-center p-2 mt-2">
                                    {qr.url ? <img src={qr.url} className="w-full h-auto object-contain" alt="QR" /> : <QrCode size={40} className="text-slate-200" />}
                                  </div>
                                  <h4 className="text-base font-bold text-slate-900 mb-0.5 text-center leading-tight px-2 tracking-tight truncate w-full">{qr.label}</h4>
                                  <p className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-widest">ID: #{qr.id}</p>
                                  <div className="flex gap-2 mb-8">
                                    <span className="px-3 py-1 bg-black rounded-lg text-[9px] font-bold text-white uppercase tracking-wider">Official</span>
                                    <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200">Report</span>
                                  </div>
                                  <div className="flex w-full gap-4 justify-center mt-auto">
                                    <button onClick={() => { setGalleryMode('qr'); setActiveQrInfo(qr); setQrReportUrl(qr.url); setShowQrModal(true); }} className="w-12 h-12 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl flex items-center justify-center transition-all hover:border-black hover:scale-105 active:scale-90 shadow-sm" title="ดูรูปขยาย"><Maximize2 size={20} strokeWidth={2.5} /></button>
                                    <button onClick={() => alert('Feature coming soon')} className="w-12 h-12 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl flex items-center justify-center transition-all hover:border-black hover:scale-105 active:scale-90 shadow-sm" title="แก้ไข"><PencilLine size={20} strokeWidth={2.5} /></button>
                                  </div>
                                </div>
                              )) : (
                              <div className="w-full py-24 border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center text-slate-400">
                                <ImageOff size={56} className="mb-4 opacity-30" />
                                <p className="text-base font-bold uppercase tracking-widest">ไม่มีรายการ QR CODE</p>
                              </div>
                            )}
                          </div>
                          {!qrScrollPos.right && qrList.length > 1 && (
                            <button onClick={() => scrollQr('right')} className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 w-14 h-14 bg-white border-2 border-slate-100 rounded-full shadow-2xl flex items-center justify-center text-slate-700 hover:bg-indigo-600 hover:text-white active:scale-90 transition-all duration-300">
                              <ChevronRight size={28} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 pb-8 sm:pb-10">
                     {cases.find(c => c.org_id === orgId)?.is_deleted ? (
                         <button 
                         onClick={() => setUpdateModal({ show: true, type: 'restore', title: 'กู้คืนหน่วยงาน', newValue: true, reason: "" })} 
                         className="flex-1 btn h-14 sm:h-16 !rounded-full !bg-[#00945e] hover:!bg-[#007a4d] !text-white !border-none font-black shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-base w-full"
                         >
                         <RefreshCcw size={20} className={`sm:w-5 sm:h-5 ${isSearching ? "animate-spin" : ""}`} /> กู้คืนหน่วยงาน
                         </button>
                     ) : (
                         <button 
                         onClick={() => setShowDeleteModal(true)} 
                         className="btn w-full h-12 sm:h-14 !bg-[#e11d48] hover:!bg-[#be123c] !text-white !rounded-full !border-none font-bold text-base sm:text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide"
                         >
                         <Trash2 size={20} strokeWidth={2.5} />
                         <span>ลบหน่วยงาน</span>
                         </button>
                     )}
                     </div>
                 </div>
               </div>
             )}
           </div>

           {orgId && (
             <div className="hidden xl:block w-full xl:w-[320px] 2xl:w-[400px] shrink-0 xl:sticky xl:top-24 xl:order-2 animate-in fade-in slide-in-from-right-10 duration-700">
                 <TimelineComponent />
             </div>
           )}

         </div>
       </div>
     </div>

     {/* Modal Gallery */}
     {showQrModal && (
       <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrModal(false)}>
         <div className="relative bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl animate-in zoom-in duration-300 border-2 border-white" onClick={(e) => e.stopPropagation()}>
           <button onClick={() => setShowQrModal(false)} className="absolute top-5 right-5 w-10 h-10 bg-[#ef4444] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-50 border-2 border-white"><X size={24} strokeWidth={3} /></button>
           <div className="min-h-[40vh] md:min-h-0 md:flex-[1.5] bg-white relative flex items-center justify-center group overflow-hidden">
             {galleryMode === 'qr' ? (
                qrReportUrl ? <img src={qrReportUrl} className="max-w-full max-h-full object-contain transition-all duration-700" alt="Preview" /> : <QrCode size={100} className="text-slate-600" />
             ) : (
               combinedPhotoHistory[currentPhotoIndex]?.url ? <img src={combinedPhotoHistory[currentPhotoIndex].url} className="max-w-full max-h-full object-contain transition-all duration-700 p-20" alt="Preview" /> : <ImageIcon size={100} className="text-slate-600" />
             )}
             {galleryMode === 'logo' && combinedPhotoHistory.length > 1 && (
               <>
                 <button onClick={() => setCurrentPhotoIndex((prev) => (prev === 0 ? combinedPhotoHistory.length - 1 : prev - 1))} className="absolute left-6 w-20 h-20 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 z-20">
                   <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl"><ChevronLeft size={32} className="text-black" /></div>
                 </button>
                 <button onClick={() => setCurrentPhotoIndex((prev) => (prev === combinedPhotoHistory.length - 1 ? 0 : prev + 1))} className="absolute right-6 w-20 h-20 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 z-20">
                   <div className="absolute inset-0 rounded-full border-[3px] border-slate-200"></div>
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl"><ChevronRight size={32} className="text-black" /></div>
                 </button>
               </>
             )}
             {galleryMode === 'logo' && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-[11px] font-black uppercase tracking-[0.3em] border border-white/10">{currentPhotoIndex + 1} / {combinedPhotoHistory.length}</div>}
           </div>

           <div className="w-full md:w-[420px] flex flex-col bg-white h-full overflow-hidden">
             {galleryMode === 'logo' ? (
                  <div className="p-8 flex-1 overflow-y-auto flex flex-col">
                    <div className="flex items-center gap-4 mb-10 mt-4 pr-10">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0"><UserCircle2 size={24} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ประวัติการอัปเดตระบบ</p>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">รายละเอียดรูปภาพ</h3>
                      </div>
                    </div>
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-xl font-black shadow-sm border border-slate-100 text-indigo-600 shrink-0">{combinedPhotoHistory[currentPhotoIndex]?.user?.charAt(0) || "-"}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">เจ้าหน้าที่ผู้ดูแล</p>
                          <p className="text-lg font-bold text-slate-900 leading-none truncate w-full">{combinedPhotoHistory[currentPhotoIndex]?.user}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <div className="flex items-center gap-2 mb-2"><Clock size={12} className="text-slate-400" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">อัปเดตเมื่อ</p></div>
                          <p className="text-sm font-bold text-slate-900 truncate">{combinedPhotoHistory[currentPhotoIndex]?.date}</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <div className="flex items-center gap-2 mb-2"><Activity size={12} className="text-slate-400" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลา</p></div>
                          <p className="text-sm font-bold text-slate-900 truncate">{combinedPhotoHistory[currentPhotoIndex]?.time}</p>
                        </div>
                      </div>
                      <div className="p-6 bg-indigo-50/50 rounded-[2rem] border-2 border-dashed border-indigo-100 relative mt-4">
                        <div className="absolute -top-3 left-6 px-4 py-1 bg-white border border-indigo-100 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">Update Reason</div>
                        <p className="text-slate-700 text-sm font-bold leading-relaxed italic">"{combinedPhotoHistory[currentPhotoIndex]?.reason}"</p>
                      </div>
                    </div>
                    <div className="pt-8 border-t-2 border-slate-100 bg-slate-50 -mx-8 px-8 pb-8 mt-auto">
                        <button className={`w-full h-14 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 ${currentPhotoIndex === 0 ? 'bg-[#22c55e] cursor-default' : 'bg-[#ef4444] cursor-pointer'}`} onClick={() => currentPhotoIndex !== 0 && alert('Restore Success')}>
                           {currentPhotoIndex === 0 ? <><Check size={24} strokeWidth={4} /> Current Photo</> : <><RefreshCw size={20} strokeWidth={3} /> Restore Previous</>}
                        </button>
                    </div>
                  </div>
             ) : (
                    <div className="p-10 flex-1 overflow-y-auto flex flex-col relative">
                        <div className="flex items-center gap-4 mb-10 pr-10">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1rem] flex items-center justify-center shrink-0"><QrCode size={28} strokeWidth={2.5}/></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">QR Code</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">รายละเอียดจุดรับแจ้ง</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                                <p className="text-[11px] font-bold text-indigo-600 mb-1.5">ชื่อจุดรับแจ้งเหตุ</p>
                                <p className="text-lg font-black text-slate-900 break-words w-full">{activeQrInfo?.label || "ไม่ระบุ"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                                    <p className="text-[11px] font-bold text-slate-400 mb-1.5">ID อ้างอิง</p>
                                    <p className="text-base font-black text-slate-900">#{activeQrInfo?.id || "-"}</p>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
                                    <p className="text-[11px] font-bold text-slate-400 mb-1.5">สถานะ</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#00945e] shadow-sm"></div>
                                        <p className="text-base font-bold text-[#00945e]">ใช้งานปกติ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto pt-8">
                            <button onClick={() => { handleDownloadQR(qrReportUrl, `${orgName}_${activeQrInfo?.label}`); setShowQrModal(false); }} className="btn w-full h-16 bg-[#00945e] hover:bg-[#007a4d] text-white border-none rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg">
                                <Download size={24} strokeWidth={2.5} /> ดาวน์โหลด QR Code
                            </button>
                        </div>
                    </div>
             )}
           </div>
         </div>
       </div>
     )}

      {/* Modal QR Editor */}
      {showQrEditor && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrEditor(false)}>
          <div className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl animate-in zoom-in duration-300 border-2 border-white" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQrEditor(false)} className="absolute top-5 right-5 w-10 h-10 bg-[#ef4444] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-50 border-2 border-white"><X size={24} strokeWidth={3} /></button>

            <div className="h-[350px] md:h-auto md:flex-[1.5] bg-slate-50 flex items-center justify-center relative overflow-hidden shrink-0 border-b md:border-b-0 md:border-r border-slate-200">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform scale-[0.6] lg:scale-100 transition-transform flex flex-col items-center bg-white shadow-2xl p-0 rounded-2xl border border-slate-200 w-[380px] h-[520px]">
                {selectedFrame === 'bold' && <div className="absolute inset-0 z-10 border-[18px] border-slate-900 pointer-events-none"></div>}
                {selectedFrame === 'indigo' && <div className="absolute inset-0 z-10 border-[18px] border-indigo-600 pointer-events-none"></div>}
                {selectedFrame === 'gold' && <div className="absolute inset-0 z-10 border-[18px] border-amber-500 pointer-events-none"></div>}
                
                <div className="absolute text-center w-full px-8 leading-tight text-slate-900 transition-all z-20 font-bold" style={{ top: `${textPos}px`, fontSize: `${textSize}px` }}>
                  <span className="bg-white/95 py-3 px-6 rounded-2xl shadow-xl border border-slate-200 inline-block tracking-tight font-black">{qrText || "สแกนที่นี่"}</span>
                </div>
                
                <div className="w-full h-full flex items-center justify-center p-14 bg-white relative">
                  {qrReportUrl ? <img src={qrReportUrl} className="w-full h-auto object-contain" alt="QR Preview" /> : <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col gap-2 items-center justify-center text-slate-300"><QrCode size={50} strokeWidth={1.5} /><span className="text-xs font-bold uppercase tracking-widest">No QR</span></div>}
                </div>
                <div className="absolute bottom-6 text-xs font-black text-slate-600 uppercase tracking-widest z-20 opacity-80">{orgName} • OFFICIAL ACCESS</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 w-full md:w-[420px] bg-white overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                <div className="pr-10"><h3 className="font-black text-2xl text-slate-900 tracking-tighter leading-none mb-1">QR Creator</h3><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">ออกแบบใบแจ้งเหตุ</p></div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div> อัปโหลดรูป QR Code (ถ้ามี)</label>
                  <label className="btn h-12 w-full bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-800 hover:text-slate-800 text-slate-500 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm">
                    <Upload size={16} /> <span className="font-bold text-xs uppercase tracking-widest">เลือกไฟล์รูปภาพ</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setQrReportUrl(URL.createObjectURL(file)); setNewQrFile(file); } }} />
                  </label>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div> เลือกกรอบ (FRAME)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['none', 'bold', 'indigo', 'gold'].map(f => (
                      <button key={f} onClick={() => setSelectedFrame(f)} className={`h-12 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center ${selectedFrame === f ? 'border-black bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-slate-50'}`}>{f}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div> ข้อความกำกับ (CAPTION)</label>
                  <textarea className="textarea w-full rounded-2xl font-bold text-base h-20 bg-slate-50 border border-slate-200 text-slate-900 focus:border-black focus:ring-1 focus:ring-black outline-none p-4 shadow-inner transition-all resize-none" placeholder="สแกนเพื่อ..." value={qrText} onChange={(e) => setQrText(e.target.value)} />
                </div>

                <div className="space-y-5 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm mt-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Type size={12} strokeWidth={3}/> ขนาดตัวอักษร</span>
                      <span className="bg-white px-2 py-0.5 rounded text-indigo-600 border border-slate-200 shadow-sm">{textSize}px</span>
                    </div>
                    <input type="range" min="12" max="40" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="range range-xs range-neutral w-full" />
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MoveVertical size={12} strokeWidth={3}/> ตำแหน่งแนวตั้ง</span>
                      <span className="bg-white px-2 py-0.5 rounded text-indigo-600 border border-slate-200 shadow-sm">{textPos}px</span>
                    </div>
                    <input type="range" min="20" max="480" value={textPos} onChange={(e) => setTextPos(parseInt(e.target.value))} className="range range-xs range-neutral w-full" />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white shrink-0 z-10">
                <button disabled={!isQrModified} onClick={() => setUpdateModal({ show: true, type: 'qr_edit', title: 'การตั้งค่า QR Code', newValue: { frame: selectedFrame, text: qrText, size: textSize, pos: textPos, file: newQrFile }, reason: "" })} className={`btn w-full rounded-2xl h-14 border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-black uppercase tracking-widest ${isQrModified ? 'bg-[#00945e] hover:bg-[#007a4d] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Save size={20} strokeWidth={2.5} /> บันทึก QR Code</button>
              </div>
            </div>
          </div>
        </div>
      )}

    {updateModal.show && (
  <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 border-2 border-white shadow-2xl animate-in zoom-in duration-300 relative overflow-hidden">
      
      {isSearching && (
        <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#00945e] animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-600">กำลังบันทึกข้อมูล...</p>
          </div>
        </div>
      )}

      {!isSearching && (
        <button 
          onClick={() => setUpdateModal({ show: false, type: "", title: "", newValue: null, reason: "" })} 
          className="absolute top-5 right-5 w-10 h-10 bg-[#ef4444] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-20"
        >
          <X size={20} strokeWidth={3} />
        </button>
      )}

      <div className={`transition-all duration-300 ${isSearching ? 'blur-sm grayscale' : ''}`}>
        <div className={`w-20 h-20 ${updateModal.type === 'restore' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100`}>
          <AlertCircle size={40} />
        </div>
        
        <h3 className="text-2xl font-bold text-center mb-2 text-slate-900 tracking-tight">
          ยืนยัน{updateModal.title}?
        </h3>
        
        <p className="text-slate-600 text-base text-center mb-8 font-bold leading-relaxed">
          {updateModal.type === 'restore' ? "ข้อมูลจะกลับมาแสดงผลในระบบตามปกติ" : "กรุณาระบุรายละเอียดการแก้ไขเพื่อบันทึก Log การเข้าถึงข้อมูล"}
        </p>

        <textarea 
          className="textarea textarea-bordered w-full rounded-[2rem] min-h-[120px] mb-8 font-bold text-base bg-slate-50 text-slate-900 border-slate-300 focus:border-black outline-none shadow-inner p-5 transition-all" 
          placeholder="ระบุเหตุผลในการแก้ไขครั้งนี้..." 
          value={updateModal.reason} 
          disabled={isSearching}
          onChange={(e) => setUpdateModal({...updateModal, reason: e.target.value})} 
        />

        <div className="flex gap-4">
          <button 
            onClick={handleIndividualUpdate} 
            disabled={isSearching || !updateModal.reason.trim()} 
            className="btn flex-1 rounded-2xl font-bold uppercase tracking-widest text-white border-none shadow-xl h-14 transition-all bg-[#00945e] hover:bg-[#007a4d] disabled:bg-slate-300 disabled:text-slate-500 text-sm"
          >
            {isSearching ? <Loader2 className="animate-spin" /> : "ยืนยันการแก้ไข"}
          </button>
        </div>
      </div>

    </div>
  </div>
)}

     {/* Modal Delete */}
     {showDeleteModal && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="bg-white w-full max-w-md rounded-[3rem] p-10 border-2 border-white shadow-2xl animate-in zoom-in duration-300 relative">
           <button onClick={() => setShowDeleteModal(false)} className="absolute top-5 right-5 w-10 h-10 bg-[#ef4444] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-20"><X size={20} strokeWidth={3} /></button>
           <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100"><AlertCircle size={40} /></div>
           <h3 className="text-2xl font-bold text-center mb-2 text-slate-900 tracking-tight">ยืนยันการลบหน่วยงาน?</h3>
           <p className="text-slate-600 text-base text-center mb-8 font-bold leading-relaxed">ข้อมูลจะถูกซ่อนจากระบบชั่วคราว แต่สามารถกู้คืนได้ภายหลังโดย Admin สูงสุด</p>
           <textarea className="textarea textarea-bordered w-full rounded-[2rem] min-h-[120px] mb-8 font-bold text-base bg-slate-50 text-slate-900 border-slate-300 focus:border-red-500 outline-none shadow-inner p-5 transition-all" placeholder="ระบุสาเหตุการลบ..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
           <div className="flex flex-col sm:flex-row gap-4">
             <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-2xl font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white border-none h-14 transition-all text-sm order-2 sm:order-1">ยกเลิก</button>
             <button onClick={() => handleDelete()} disabled={!deleteReason.trim()} className="btn flex-1 rounded-2xl bg-[#00945e] text-white hover:bg-[#007a4d] border-none font-bold uppercase tracking-widest shadow-xl h-14 transition-all disabled:bg-slate-300 disabled:text-slate-500 text-sm order-1 sm:order-2">ยืนยัน</button>
           </div>
         </div>
       </div>
     )}
   </div> 
 );
}