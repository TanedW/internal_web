'use client';

import React, { useEffect, useState, useRef } from "react";
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
 History, Eye, UserCircle2 
} from "lucide-react";

// ข้อมูลจำลองสำหรับ Timeline
const TIMELINE_DATA = [
 {
   id: 1,
   type: "edit",
   action: "แก้ไขข้อมูลพื้นฐาน",
   detail: "เปลี่ยนชื่อหน่วยงานจาก 'อบต. เดิม' เป็น 'เทศบาลนครนนทบุรี'",
   user: "ธนกฤต แอดมิน",
   time: "10 นาทีที่แล้ว",
   status: "success"
 },
 {
   id: 2,
   type: "security",
   action: "อัปเดตสิทธิ์การเข้าถึง",
   detail: "เปิดใช้งานการส่งออกไฟล์ CSV สำหรับเจ้าหน้าที่ระดับ Manager",
   user: "ศิริลักษณ์ ระบบ",
   time: "2 ชั่วโมงที่แล้ว",
   status: "warning"
 },
 {
   id: 3,
   type: "restore",
   action: "กู้คืนสถานะหน่วยงาน",
   detail: "กู้คืนข้อมูลหลังจากถูกระงับใช้งานชั่วคราว",
   user: "Super Admin",
   time: "เมื่อวานนี้, 14:30",
   status: "info"
 },
 {
   id: 4,
   type: "delete",
   action: "ลบรูปภาพโลโก้เก่า",
   detail: "นำไฟล์ logo_v1_deprecated.png ออกจากระบบ",
   user: "ธนกฤต แอดมิน",
   time: "2 วันที่แล้ว",
   status: "danger"
 }
];

const PHOTO_HISTORY_DATA = [
  { id: 101, url: "https://storage.googleapis.com/traffy_public_bucket/attachment/org_sample/logo1.png", user: "ธนกฤต แอดมิน", date: "23 ก.พ. 2026", time: "14:30", reason: "อัปเดตโลโก้สำหรับปี 2026" },
  { id: 102, url: "https://storage.googleapis.com/traffy_public_bucket/attachment/org_sample/logo2.png", user: "ศิริลักษณ์ ระบบ", date: "15 ม.ค. 2026", time: "09:15", reason: "เปลี่ยนตาม CI ของหน่วยงานใหม่" },
  { id: 103, url: "https://storage.googleapis.com/traffy_public_bucket/attachment/org_sample/logo3.png", user: "Super Admin", date: "01 ธ.ค. 2025", time: "11:00", reason: "เริ่มใช้งานระบบครั้งแรก" },
];

const getTypeStyles = (type) => {
 switch (type) {
   case 'edit': return { 
     bg: 'bg-indigo-50', 
     text: 'text-indigo-600', 
     icon: <Edit3 size={16} strokeWidth={2.5} />, 
     border: 'border-indigo-100',
     shadow: 'shadow-indigo-100'
   };
   case 'security': return { 
     bg: 'bg-amber-50', 
     text: 'text-amber-600', 
     icon: <ShieldCheck size={16} strokeWidth={2.5} />, 
     border: 'border-amber-100',
     shadow: 'shadow-amber-100'
   };
   case 'restore': return { 
     bg: 'bg-emerald-50', 
     text: 'text-emerald-600', 
     icon: <RefreshCw size={16} strokeWidth={2.5} />, 
     border: 'border-emerald-100',
     shadow: 'shadow-emerald-100'
   };
   case 'delete': return { 
     bg: 'bg-rose-50', 
     text: 'text-rose-600', 
     icon: <Trash2 size={16} strokeWidth={2.5} />, 
     border: 'border-rose-100',
     shadow: 'shadow-rose-100'
   };
   default: return { 
     bg: 'bg-slate-50', 
     text: 'text-slate-600', 
     icon: <FileText size={16} strokeWidth={2.5} />, 
     border: 'border-slate-100',
     shadow: 'shadow-slate-100'
   };
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
  
 const [showMobileEditPanel, setShowMobileEditPanel] = useState(false);
 const [showMobileTimeline, setShowMobileTimeline] = useState(false); 
 const editPanelRef = useRef(null);
 
 const staffScrollRef = useRef(null);
 const qrScrollRef = useRef(null);

 // State สำหรับซ่อนลูกศร
 const [staffScrollPos, setStaffScrollPos] = useState({ left: true, right: false });
 const [qrScrollPos, setQrScrollPos] = useState({ left: true, right: false });

 const [showNameHistory, setShowNameHistory] = useState(false);

 const [updateModal, setUpdateModal] = useState({
   show: false,
   type: "", 
   title: "",
   newValue: null,
   reason: ""
 });

 const [showPhotoActionMenu, setShowPhotoActionMenu] = useState(false);
 
 const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

 const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 
 const API_URL_MANAGE = process.env.NEXT_PUBLIC_DB_MANAGE_ORG_API_URL || "";
 const uploadApiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL;
 const STORAGE_BASE_URL = "https://storage.googleapis.com/traffy_public_bucket/";

 const fetchOrgData = async (targetId = "") => {
   if (!targetId) return;
   setIsSearching(true);
   setOrgId(""); 
   setShowMobileEditPanel(false);
   setShowMobileTimeline(false); 
   try {
     const res = await fetch(`${API_URL_ORG}?q=${encodeURIComponent(targetId)}`);
     const result = await res.json();
     if (result.found && result.data) {
       setCases(result.data.map(item => ({
         org_id: String(item.id),
         org_name: String(item.name || ""),
         logo_url: String(item.photo || ""), 
         is_deleted: !!item.deleted_at || item.status === 'deleted',
         is_official: item.official_group === true, 
         allow_csv: item.download_csv === true, 
         admin_codes: item.admin_codes || [],
         qr_report_url: item.qr_report_url || "",
         members: item.members || []
       })));
     } else {
       setCases([]);
     }
   } catch (e) {
     console.error("Fetch error:", e);
   } finally { setIsSearching(false); }
 };

 const scrollToEdit = () => {
   setShowMobileEditPanel(true);
   setTimeout(() => {
       editPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, 100);
 };

 // ฟังก์ชันเช็คตำแหน่ง Scroll เพื่อซ่อนลูกศร
 const handleScrollCheck = (ref, setPosState) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setPosState({
        left: scrollLeft <= 10,
        right: scrollLeft + clientWidth >= scrollWidth - 10
      });
    }
  };

 const scrollStaff = (direction) => {
   if (staffScrollRef.current) {
     const scrollAmount = staffScrollRef.current.offsetWidth;
     staffScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
     setTimeout(() => handleScrollCheck(staffScrollRef, setStaffScrollPos), 500);
   }
 };

 const scrollQr = (direction) => {
   if (qrScrollRef.current) {
     const scrollAmount = qrScrollRef.current.offsetWidth;
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
     let payload = {
       current_admin_id: adminId,
       description: updateModal.reason,
       restore: false
     };

     if (updateModal.type === 'name') {
       payload.name = updateModal.newValue;
       payload.old_name = currentOrgData.org_name;
     } else if (updateModal.type === 'csv') {
       payload.download_csv = updateModal.newValue;
       payload.old_download = currentOrgData.allow_csv;
     } else if (updateModal.type === 'official') {
       payload.official_group = updateModal.newValue;
       payload.old_official = currentOrgData.is_official;
     } else if (updateModal.type === 'restore') {
       payload.restore = true;
     } else if (updateModal.type === 'logo') {
       const base64Image = await fileToBase64(updateModal.newValue);
       const uploadRes = await fetch(uploadApiUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ folder_path: `attachment/org_${orgId}`, image: base64Image }), 
       });
       const uploadResult = await uploadRes.json();
       if (uploadRes.ok && uploadResult.photo_link) {
         const storageUrl = "https://storage.googleapis.com/traffy_public_bucket/";
          const relativePath = uploadResult.photo_link.replace(storageUrl, "");
         payload.file_url = relativePath;        } else {
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
       await fetchOrgData(searchId); 
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

 const copyToClipboard = (text) => {
   navigator.clipboard.writeText(text);
   alert("คัดลอกเรียบร้อย: " + text);
 };

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
   } catch (error) {
     console.error("Download failed:", error);
     window.open(url, '_blank');
   }
 };

 const handleEditExistingQr = (qr) => {
   setQrReportUrl(qr.url);
   setQrText(qr.label || "สแกนเพื่อแจ้งเหตุ");
   setShowQrEditor(true);
 };

 useEffect(() => {
   if (qrReportUrl) {
     setQrList([
       { id: 1, url: qrReportUrl, label: "QR หลัก (หน้าหน่วยงาน)" },
       { id: 2, url: qrReportUrl, label: "QR ประตูทางเข้า" },
       { id: 3, url: qrReportUrl, label: "QR จุดคัดกรอง" }
     ]);
   } else {
     setQrList([]);
   }
   // รีเซ็ตตำแหน่งลูกศรเมื่อข้อมูลเปลี่ยน
   setQrScrollPos({ left: true, right: false });
 }, [qrReportUrl]);

 const TimelineComponent = () => (
   <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative w-full">
     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-white z-0"></div>
     <div className="p-4 sm:p-6 pb-4 relative z-10">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
             <Activity size={20} />
           </div>
           <div>
             <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Activity Log</h3>
             <div className="flex items-center gap-1.5 mt-1.5">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</p>
             </div>
           </div>
         </div>
         <button className="w-10 h-10 shrink-0 bg-white border border-slate-200 hover:border-black hover:bg-black hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-all duration-300 shadow-sm active:scale-95">
           <Filter size={16} strokeWidth={2.5} />
         </button>
       </div>
       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
         {['ทั้งหมด', 'การแก้ไข', 'ความปลอดภัย', 'ระบบ'].map((tag, i) => (
           <button key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 ${i === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'}`}>
             {tag}
           </button>
         ))}
       </div>
     </div>
     <div className="px-4 sm:px-6 pb-6 relative z-10 max-h-[350px] sm:max-h-[450px] overflow-y-auto qr-gallery-scrollbar">
       <div className="absolute left-[31px] sm:left-[39px] top-4 bottom-12 w-[2px] bg-slate-100 z-0 rounded-full"></div>
       <div className="space-y-4 pt-2">
         {TIMELINE_DATA.map((item) => {
           const styles = getTypeStyles(item.type);
           return (
             <div key={item.id} className="relative flex gap-3 sm:gap-4 group z-10">
               <div className={`relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl ${styles.bg} ${styles.text} border-2 ${styles.border} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 z-20 shadow-sm bg-white`}>
                 {React.cloneElement(styles.icon, { size: 14, className: "sm:w-4 sm:h-4" })}
               </div>
               <div className="flex-1 min-w-0 pt-0.5">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1 sm:gap-2">
                   <h4 className="text-[11px] sm:text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors cursor-pointer">{item.action}</h4>
                   <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 w-fit">{item.time}</span>
                 </div>
                 <div className="bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:border-slate-200 rounded-xl p-2.5 sm:p-3 transition-all duration-300">
                   <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium leading-tight break-words">{item.detail}</p>
                   <div className="flex items-center gap-1.5 mt-2 opacity-60">
                     <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] sm:text-[8px] font-bold">{item.user.charAt(0)}</div>
                     <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 tracking-tight">{item.user}</span>
                   </div>
                 </div>
               </div>
             </div>
           );
         })}
       </div>
     </div>
     <div className="p-4 pt-2 bg-white border-t border-slate-50 relative z-20">
       <button className="relative w-full py-2.5 sm:py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] shadow-sm text-slate-900">
         View Full History <ArrowRight size={12} strokeWidth={3} />
       </button>
     </div>
   </div>
 );

 return (
   <div data-theme="light" className="min-h-screen !bg-[#F4F6F8] !text-slate-900 font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
     <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
       html { scroll-behavior: smooth; overflow-x: hidden; }
       body { overflow-x: hidden; width: 100%; position: relative; }
       .scrollbar-hide::-webkit-scrollbar { display: none; }
       .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
       .qr-gallery-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
       .qr-gallery-scrollbar::-webkit-scrollbar-track { background: transparent; }
       .qr-gallery-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
       .pop-card {
         box-shadow: 
           0 20px 25px -5px rgb(0 0 0 / 0.1), 
           0 8px 10px -6px rgb(0 0 0 / 0.1),
           0 0 0 1px rgb(0 0 0 / 0.05);
       }
       .main-content-scroll {
         overflow-y: auto;
         overflow-x: hidden;
         -webkit-overflow-scrolling: touch;
         height: 100%;
       }
       
       .bubble-menu-container {
         filter: drop-shadow(0 15px 30px rgba(0,0,0,0.15));
       }
       .bubble-arrow-tip::after {
         content: '';
         position: absolute;
         bottom: -8px;
         left: 50%;
         transform: translateX(-50%);
         width: 0;
         height: 0;
         border-left: 10px solid transparent;
         border-right: 10px solid transparent;
         border-top: 10px solid white;
       }
       /* Class ซ่อน scrollbar เฉพาะมือถือเพื่อให้ลูกศรใช้งานได้เต็มที่ */
       @media (max-width: 639px) {
           .hide-scrollbar-on-mobile::-webkit-scrollbar {
               display: none;
           }
           .hide-scrollbar-on-mobile {
               -ms-overflow-style: none;
               scrollbar-width: none;
           }
       }
     `}</style>
     <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
     
     <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

     <div className={`main-content-scroll w-full pt-24 sm:pt-28 lg:pt-16 pb-20 transition-all duration-300 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-24"}`}>
       
       <div className="mx-auto px-4 lg:px-8 w-full max-w-[1600px]">
         
         <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 items-start w-full">
           
           <div className={`flex-1 min-w-0 w-full transition-all duration-500 ${!orgId ? 'max-w-4xl mx-auto' : 'xl:order-1'}`}>
             <header className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"><Building2 size={20} className="sm:w-6 sm:h-6" /></div>
               <div>
                 <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1 tracking-tight">จัดการหน่วยงาน</h1>
                 <p className="text-slate-500 font-bold text-xs sm:text-sm">ตั้งค่าสิทธิ์ รหัสเข้าใช้งาน และสถานะหน่วยงาน</p>
               </div>
             </header>
               
             <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-8 sm:mb-10">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 z-20" size={18} />
                 <input 
                   type="text" 
                   className="input input-bordered w-full h-12 sm:h-14 !pl-11 pr-4 !bg-white !text-slate-900 !rounded-2xl !border-slate-200 focus:!border-black shadow-sm outline-none font-bold text-sm sm:text-base transition-all" 
                   placeholder="ค้นหาชื่อหน่วยงาน หรือ ID..." 
                   value={searchId} 
                   onChange={(e) => setSearchId(e.target.value)} 
                   onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
                 />
               </div>
               <button onClick={() => fetchOrgData(searchId)} className="btn h-12 sm:h-14 px-8 sm:px-10 !bg-black !text-white !font-bold !rounded-2xl hover:!bg-slate-800 border-none shrink-0 transition-all shadow-lg active:scale-95 text-sm sm:text-base">
                 {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
               </button>
             </div>

             <div className="mb-8 sm:mb-10">
               <h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-5 px-1">ผลการค้นหา</h3>
               {cases.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                   {cases.map((item) => {
                     const isSelected = orgId === item.org_id;
                     return (
                       <div 
                         key={item.org_id} 
                         onClick={() => { 
                           if (isSelected) {
                             setOrgId(""); setOrgName(""); setLogoPreview(null);
                             setShowMobileEditPanel(false);
                             setShowMobileTimeline(false);
                           } else {
                             setOrgId(item.org_id);
                             setOrgName(item.org_name);
                             setLogoPreview(item.logo_url);
                             setIsOfficial(item.is_official); 
                             setIsCsvEnabled(item.allow_csv);
                             setQrReportUrl(item.qr_report_url);
                             if (item.admin_codes?.length > 0) {
                               setAdminCode(item.admin_codes[0].code || "ไม่มีรหัส");
                               setStaffCode(item.admin_codes[0].code_staff || "ไม่มีรหัส");
                             } else {
                               setAdminCode("-"); setStaffCode("-");
                             }
                           }
                         }}
                         className={`relative !bg-white rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 border-2 flex flex-col p-2 ${
                           isSelected 
                             ? '!border-black shadow-xl scale-[1.02] z-10' 
                             : '!border-white shadow-sm hover:!border-slate-200'
                         } ${item.is_deleted ? 'opacity-75' : ''}`}
                       >
                         <div className="h-28 sm:h-32 w-full !bg-[#f8fafc] rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden">
                           <img src={STORAGE_BASE_URL + item.logo_url} className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : ''} ${item.is_deleted ? 'grayscale' : ''}`} alt="Logo" />
                           {item.is_deleted && (
                             <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center backdrop-blur-[2px]">
                               <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase">Deleted</span>
                             </div>
                           )}
                           {isSelected && !item.is_deleted && (
                             <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black text-white rounded-full p-1.5 shadow-lg z-10 border-2 border-white">
                               <Check size={12} className="sm:w-3.5 sm:h-3.5" strokeWidth={4} />
                             </div>
                           )}
                         </div>
                         
                         <div className="p-3 sm:p-4 flex flex-col flex-1 !text-slate-900">
                           <h4 className="font-black text-sm sm:text-base truncate mb-1 tracking-tight">{item.org_name}</h4>
                           <div className="mt-auto flex items-center justify-between">
                             <span className="text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">ID: {item.org_id}</span>
                             <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${isSelected ? '!bg-black !text-white' : '!bg-slate-100 !text-slate-400'}`}>
                               <ChevronRight size={14} strokeWidth={4} />
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="!bg-white rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 py-16 sm:py-24 flex flex-col items-center justify-center text-slate-400">
                   <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                     <MousePointerClick size={28} className="sm:w-8 sm:h-8 opacity-20" />
                   </div>
                   <p className="font-bold text-xs sm:text-sm uppercase tracking-widest text-slate-300">ระบุรหัสเพื่อเริ่มจัดการ</p>
                 </div>
               )}
             </div>

             {orgId && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 <div className="xl:hidden grid grid-cols-2 gap-2 sm:gap-3">
                     <button 
                         onClick={() => {
                           if (showMobileEditPanel) {
                             setShowMobileEditPanel(false);
                           } else {
                             scrollToEdit();
                           }
                         }}
                         className={`btn h-12 sm:h-16 !rounded-xl sm:!rounded-2xl border-none shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 transition-all text-[10px] sm:text-xs font-black uppercase tracking-tight ${showMobileEditPanel ? '!bg-indigo-700 !text-white' : '!bg-white !text-slate-900 border-2 !border-slate-100'}`}
                     >
                       <Settings2 size={16} className="sm:w-4 sm:h-4" /> {showMobileEditPanel ? 'ปิดการจัดการ' : 'จัดการข้อมูล'}
                     </button>
                     <button 
                         onClick={() => setShowMobileTimeline(!showMobileTimeline)}
                         className={`btn h-12 sm:h-16 !rounded-xl sm:!rounded-2xl border-none shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 transition-all text-[10px] sm:text-xs font-black uppercase tracking-tight ${showMobileTimeline ? '!bg-black !text-white' : '!bg-white !text-slate-900 border-2 !border-slate-100'}`}
                     >
                       <History size={16} className="sm:w-4 sm:h-4" /> {showMobileTimeline ? 'ปิดไทม์ไลน์' : 'ดูไทม์ไลน์'}
                     </button>
                 </div>

                 {showMobileTimeline && (
                   <div className="xl:hidden animate-in slide-in-from-top-4 duration-300">
                     <TimelineComponent />
                   </div>
                 )}

                 <div 
                     ref={editPanelRef} 
                     className={`space-y-6 sm:space-y-8 ${!showMobileEditPanel ? 'hidden xl:block' : 'block animate-in slide-in-from-top-4 duration-500'}`}
                 >
                     <div className="!bg-white rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm border-2 border-white">
                         <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                             <div className="relative shrink-0 mx-auto md:mx-0">
                              <div 
                                  onClick={() => setShowPhotoActionMenu(!showPhotoActionMenu)}
                                  className="w-24 h-24 sm:w-32 sm:h-32 !bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner cursor-pointer hover:border-black transition-all group relative"
                              >
                                  {logoPreview ? (
                                  <img src={STORAGE_BASE_URL + logoPreview} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt="Preview" />
                                  ) : (
                                  <ImageIcon size={28} className="sm:w-8 sm:h-8 text-slate-400" />
                                  )
                                  }
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center px-2">
                                      Manage Photo
                                  </div>
                              </div>
                             {showPhotoActionMenu && (
   <div className="bubble-menu-container absolute bottom-full left-1/2 -translate-x-1/2 mb-4 sm:mb-6 z-[110] w-[180px] sm:w-[210px] bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 p-1.5 sm:p-2 bubble-arrow-tip shadow-2xl">
     <div className="flex flex-col gap-0.5">
       <button 
         onClick={() => { 
           setGalleryMode('logo'); // ตั้งค่าเป็นโหมด Logo
           setCurrentPhotoIndex(0);
           setShowQrModal(true); 
           setShowPhotoActionMenu(false); 
         }}
         className="grid grid-cols-[40px_1fr] sm:grid-cols-[60px_1fr] items-center w-full px-2 sm:px-3 py-2 sm:py-3 hover:bg-slate-50 rounded-[1rem] sm:rounded-2xl transition-all group"
       >
         <div className="flex items-center justify-center">
           <UserCircle2 size={20} strokeWidth={1.5} className="sm:w-6 sm:h-6 text-[#1a2b3b]" />
         </div>
         <span className="text-[13px] sm:text-[15px] font-bold text-[#1a2b3b] text-left">ดูรูปโปรไฟล์</span>
       </button>

       <label className="grid grid-cols-[40px_1fr] sm:grid-cols-[60px_1fr] items-center w-full px-2 sm:px-3 py-2 sm:py-3 hover:bg-slate-50 rounded-[1rem] sm:rounded-2xl transition-all group cursor-pointer">
         <div className="flex items-center justify-center">
           <ImageIcon size={18} strokeWidth={1.5} className="sm:w-5 sm:h-5 text-[#1a2b3b]" />
         </div>
         <span className="text-[13px] sm:text-[15px] font-bold text-[#1a2b3b] text-left">เลือกรูปโปรไฟล์</span>
         <input 
           type="file" className="hidden" accept="image/*"
           onChange={(e) => { 
             const file = e.target.files[0]; 
             if (file) { 
               setUpdateModal({
                 show: true, type: 'logo', title: 'รูปภาพหน่วยงาน', newValue: file, reason: ""
               });
               setShowPhotoActionMenu(false);
             } 
           }} 
         />
       </label>
     </div>
   </div>
 )}
                             </div>
                             
                             <div className="flex-1 space-y-4">
                             
                             <div className="relative">
                                 <div className="flex justify-between items-end mb-2 px-1 relative">
                                     <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest pb-1">ชื่อหน่วยงาน</label>
                                 </div>

                                 <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 items-center w-full relative">
                                     <div className="relative flex-1 min-w-0">
                                         <input 
                                             type="text" 
                                             value={orgName} 
                                             onChange={(e) => setOrgName(e.target.value)} 
                                             className="input input-bordered w-full rounded-xl sm:rounded-2xl font-bold !bg-white !text-slate-900 border-slate-200 focus:!border-black transition-all text-sm sm:text-base shadow-sm h-12 sm:h-14 pr-12 sm:pr-14" 
                                         />
                                         
                                         <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2">
                                             <div className="relative flex items-center tooltip tooltip-left" data-tip="ประวัติการแก้ไข">
                                                <button 
                                                  onClick={() => setShowNameHistory(!showNameHistory)} // เปลี่ยนจาก hover เป็นคลิกเพื่อ toggle
                                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                                                      showNameHistory 
                                                      ? 'bg-slate-900 text-white' // เมื่อเปิดอยู่ ให้ปุ่มเข้มขึ้น
                                                      : 'bg-transparent text-slate-400 hover:bg-slate-100 hover:text-black'
                                                  }`}
                                              >
                                                  <History size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                                              </button>
                                                                                              {showNameHistory && (
                                                /* ใช้ style={{ border: '2px solid black' }} เพื่อบังคับให้มีขอบแน่นอน */
                                                <div 
                                                  className="absolute top-full right-0 mt-2 sm:mt-3 z-[150] w-[260px] sm:w-[320px] max-w-[calc(100vw-32px)] bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl p-5 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200 text-left cursor-default"
                                                  style={{ border: '2px solid #000000' }} 
                                                >
                                                    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                                                        <div className="w-2.5 h-2.5 bg-black rounded-full shrink-0 shadow-sm"></div>
                                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] text-black">Name Revision History</span>
                                                    </div>
                                                    
                                                    <div className="space-y-4 sm:space-y-5 ml-1">
                                                        {[
                                                            { old: "อบต. เดิม", new: "เทศบาลนครนนทบุรี", user: "ธนกฤต แอดมิน", date: "24 ก.พ. 2026" },
                                                            { old: "หน่วยงานทดสอบ", new: "อบต. เดิม", user: "Super Admin", date: "10 ม.ค. 2026" }
                                                        ].map((h, i, arr) => (
                                                            <div key={i} className="flex gap-3 sm:gap-4 relative">
                                                                {i !== arr.length - 1 && <div className="absolute left-[2.5px] top-3 bottom-[-1.5rem] w-[1.5px] bg-slate-300"></div>}
                                                                
                                                                <div className="flex flex-col items-center mt-1.5 z-10">
                                                                    <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] sm:text-[13px] font-bold text-slate-900 leading-tight mb-1">
                                                                        <span className="text-slate-400 mr-1.5 font-medium line-through">{h.old}</span>
                                                                        <span className="text-slate-400 mr-1.5">→</span>
                                                                        <span className="text-black font-black">{h.new}</span>
                                                                    </p>
                                                                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide">By {h.user} • {h.date}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* ส่วนติ่งแหลมชี้ขึ้น (Triangle) */}
                                                    <div 
                                                      className="absolute bottom-full right-4 sm:right-5 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[9px]"
                                                      style={{ borderBottomColor: '#000000' }}
                                                    ></div>
                                                    <div className="absolute bottom-full right-[17px] sm:right-[21px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white z-10"></div>
                                                </div>
                                              )}
                                             </div>
                                         </div>
                                     </div>
                                     <button 
                                         onClick={() => setUpdateModal({ show: true, type: 'name', title: 'ชื่อหน่วยงาน', newValue: orgName, reason: "" })}
                                         className="btn h-12 w-12 sm:h-14 sm:w-14 !bg-black !text-white rounded-xl sm:rounded-2xl border-none shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                                     >
                                         <Save size={16} className="sm:w-4 sm:h-4"/>
                                     </button>
                                 </div>
                             </div>

                             <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                                 <div className="p-3 sm:p-4 !bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                                 <label className="text-[10px] sm:text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Staff Code</label>
                                 <div className="flex items-center justify-between gap-2 overflow-hidden">
                                     <code className="text-sm sm:text-base font-bold text-blue-700 break-all leading-tight">{staffCode}</code>
                                     <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-1.5 sm:p-2 !bg-white rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 hover:text-black shadow-sm transition-all"><Copy size={14} className="sm:w-4 sm:h-4"/></button>
                                 </div>
                                 </div>
                                 <div className="p-3 sm:p-4 !bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                                 <label className="text-[10px] sm:text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Admin Code</label>
                                 <div className="flex items-center justify-between gap-2 overflow-hidden">
                                     <code className="text-sm sm:text-base font-bold text-red-700 break-all leading-tight">{adminCode}</code>
                                     <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-1.5 sm:p-2 !bg-white rounded-lg sm:rounded-xl border border-slate-200 text-slate-600 hover:text-black shadow-sm transition-all"><Copy size={14} className="sm:w-4 sm:h-4"/></button>
                                 </div>
                                 </div>
                             </div>
                             </div>
                         </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                     <div className="!bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border-2 border-white flex items-center justify-between hover:border-slate-200 transition-all">
                         <div className="flex items-center gap-3">
                         <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 text-green-700 rounded-lg sm:rounded-xl flex items-center justify-center border border-green-100 shrink-0"><FileSpreadsheet size={16} className="sm:w-5 sm:h-5"/></div>
                         <div className="min-w-0 pr-2">
                             <p className="font-bold text-sm sm:text-base !text-slate-900 tracking-tight truncate">การส่งออก CSV</p>
                             <p className="text-[10px] sm:text-sm text-slate-600 font-bold uppercase tracking-tight truncate">อนุญาตให้ดาวน์โหลดรายงาน</p>
                         </div>
                         </div>
                         <input 
                         type="checkbox" 
                         className="toggle toggle-sm sm:toggle-md !bg-slate-450 !border-slate-600 hover:!bg-slate-300 checked:!bg-[#00945e] checked:!border-[#00945e] checked:hover:!bg-[#00945e] [--tglbg:white] shrink-0" 
                         checked={isCsvEnabled} 
                         onChange={(e) => setUpdateModal({ show: true, type: 'csv', title: 'สิทธิ์ CSV', newValue: e.target.checked, reason: "" })} 
                         />
                     </div>
                     <div className="!bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border-2 border-white flex items-center justify-between hover:border-slate-200 transition-all">
                         <div className="flex items-center gap-3">
                         <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-100 shrink-0"><ShieldCheck size={16} className="sm:w-5 sm:h-5"/></div>
                         <div className="min-w-0 pr-2">
                             <p className="font-bold text-sm sm:text-base !text-slate-900 tracking-tight truncate">Official Account</p>
                             <p className="text-[10px] sm:text-sm text-slate-600 font-bold uppercase tracking-tight truncate">ยืนยันตัวตนทางการ</p>
                         </div>
                         </div>
                         <input 
                         type="checkbox" 
                         className="toggle toggle-sm sm:toggle-md toggle-info bg-slate-300 shrink-0" 
                         checked={isOfficial} 
                         onChange={(e) => setUpdateModal({ show: true, type: 'official', title: 'สถานะ Official', newValue: e.target.checked, reason: "" })} 
                         />
                     </div>
                     </div>

                     <div className="!bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border-2 border-white">
                         <div className="flex flex-row items-center justify-between mb-4 sm:mb-8 px-1 gap-2 sm:gap-4">
                             <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 text-white rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0"><UserCheck size={16} className="sm:w-5 sm:h-5" /></div>
                             <div className="min-w-0 flex-1">
                                 <p className="font-bold text-sm sm:text-base !text-slate-900 uppercase tracking-tight truncate">รายชื่อเจ้าหน้าที่</p>
                                 <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">ผู้ดูแลระบบประจำหน่วยงาน</p>
                             </div>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                 <span className="shrink-0 text-[10px] sm:text-[11px] font-black bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-slate-800 border border-slate-200 whitespace-nowrap uppercase tracking-widest">
                                   {cases.find(c => c.org_id === orgId)?.members?.length || 0} คน
                                 </span>
                             </div>
                         </div>
                         
                         <div className="relative w-full">
                             {/* ซ่อนลูกศรย้อนกลับเมื่ออยู่ใบแรก */}
                             {!staffScrollPos.left && (
                                <button onClick={() => scrollStaff('left')} className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-700 sm:hidden active:scale-90 transition-all"><ChevronLeft size={20}/></button>
                             )}

                             <div 
                                ref={staffScrollRef} 
                                onScroll={() => handleScrollCheck(staffScrollRef, setStaffScrollPos)}
                                className="flex gap-4 sm:gap-6 overflow-x-auto pt-2 pb-6 px-1 snap-x snap-mandatory scroll-smooth hide-scrollbar-on-mobile qr-gallery-scrollbar"
                             >
                                 {cases.find(c => c.org_id === orgId)?.members?.map((staff) => (
                                 <div 
                                     key={staff.member} 
                                     className="snap-center snap-always w-full min-w-full sm:w-auto sm:min-w-[280px] bg-white rounded-[2rem] sm:rounded-[2.8rem] p-5 sm:p-7 border border-slate-200 pop-card flex flex-col items-center transition-all duration-500 hover:-translate-y-2 sm:hover:-translate-y-4 hover:shadow-2xl group shrink-0"
                                 >
                                     <div className="relative mb-4 sm:mb-5">
                                     <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[4px] sm:border-[6px] border-white shadow-xl transition-all duration-500 group-hover:scale-105">
                                         <img src={staff.picture_profile} className="w-full h-full object-cover" alt={staff.member_name} />
                                     </div>
                                     <div className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#00945e] border-[3px] sm:border-4 border-white rounded-full shadow-lg"></div>
                                     </div>
                                     <h4 className="font-bold text-base sm:text-lg text-slate-900 mb-2 tracking-tight w-full text-center truncate px-2">{staff.member_name}</h4>
                                     
                                     <div className="flex items-center gap-1.5 mb-6 px-4 py-1 bg-[#f1f5f9] rounded-full">
                                         <Shield size={12} className="text-slate-700" strokeWidth={2.5} />
                                         <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase tracking-widest whitespace-nowrap">{staff.role}</span>
                                     </div>

                                     <div className="w-full space-y-3 pt-2">
                                         <div className="flex items-center gap-3 text-slate-700 min-w-0 group/item">
                                             <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center shrink-0">
                                                 <Phone size={16} className="text-[#334155]" strokeWidth={2} />
                                             </div>
                                             <span className="text-sm font-bold tracking-wide truncate flex-1">{staff.member_phone}</span>
                                         </div>
                                     
                                         <div className="flex items-center gap-3 text-slate-700 min-w-0 group/item relative overflow-hidden cursor-pointer" onClick={() => copyToClipboard(staff.email)}>
                                             <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center shrink-0 group-hover/item:bg-slate-100 transition-colors">
                                                 <Mail size={16} className="text-[#334155]" strokeWidth={2} />
                                             </div>
                                             <div className="relative flex-1 min-w-0">
                                                 <span className="text-sm font-bold tracking-wide truncate block">{staff.email}</span>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                                 ))}
                             </div>

                             {/* ซ่อนลูกศรไปต่อเมื่ออยู่ใบสุดท้าย */}
                             {!staffScrollPos.right && (
                                <button onClick={() => scrollStaff('right')} className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-700 sm:hidden active:scale-90 transition-all"><ChevronRight size={20}/></button>
                             )}
                         </div>
                     </div>
                     
                     <div className="!bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border-2 border-white overflow-hidden">
                         <div className="mb-4 sm:mb-6 px-1">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
                               <div className="flex items-center gap-3 w-full sm:w-auto">
                                 <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                                   <QrCode size={20} className="sm:w-6 sm:h-6" />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                   <h2 className="font-black text-lg sm:text-xl !text-slate-900 uppercase tracking-tight leading-tight truncate">QR CODE ทั้งหมด</h2>
                                   <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">จุดรับแจ้งเหตุที่บันทึกไว้</p>
                                 </div>
                               </div>
                               
                               <div className="flex items-center justify-end w-full sm:w-auto shrink-0">
                                   <button 
                                     onClick={() => { setQrText("สแกนเพื่อแจ้งเหตุ"); setShowQrEditor(true); }}
                                     className="w-full sm:w-auto btn h-12 sm:h-14 !bg-slate-900 hover:!bg-black !text-white rounded-xl sm:rounded-2xl px-6 sm:px-8 border-none font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest shrink-0"
                                   >
                                     <Plus size={16} className="sm:w-5 sm:h-5" strokeWidth={3} /> เพิ่ม QR ใหม่
                                   </button>
                               </div>
                             </div>
                         </div>

                         <div className="relative w-full">
                             {/* แก้ไข: ซ่อนลูกศรย้อนกลับ (ซ้าย) เมื่ออยู่การ์ดใบแรก */}
                             {!qrScrollPos.left && (
                                <button onClick={() => scrollQr('left')} className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-700 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
                             )}

                             <div 
                                ref={qrScrollRef} 
                                onScroll={() => handleScrollCheck(qrScrollRef, setQrScrollPos)}
                                className="flex gap-4 sm:gap-10 overflow-x-auto pb-10 pt-2 sm:pt-8 px-1 sm:px-8 snap-x snap-mandatory scroll-smooth hide-scrollbar-on-mobile qr-gallery-scrollbar"
                             >
                                 {qrList.length > 0 ? (
                                 qrList.map((qr) => (
                                     <div 
                                     key={qr.id} 
                                     className="snap-center snap-always w-full min-w-full sm:w-auto sm:min-w-[260px] group relative bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-8 flex flex-col items-center transition-all duration-500 pop-card hover:shadow-2xl sm:hover:-translate-y-4 border border-slate-100 shrink-0"
                                     >
                                     <button 
                                         onClick={() => handleDownloadQR(qr.url, `${orgName}_${qr.label}`)}
                                         className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 bg-white text-black rounded-full flex items-center justify-center transition-all hover:bg-black hover:text-white hover:scale-110 active:scale-90 shadow-md z-20 border border-slate-200"
                                     >
                                         <Download size={14} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                                     </button>
                                     <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden mb-4 sm:mb-6 border-2 border-slate-100 shadow-sm bg-white flex items-center justify-center p-2 mt-2">
                                         <img src={qr.url} className="w-full h-auto object-contain" alt="QR" />
                                     </div>
                                     <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5 text-center leading-tight px-2 tracking-tight truncate w-full">{qr.label}</h4>
                                     <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 mb-4 sm:mb-6 uppercase tracking-widest">ID: #{qr.id}</p>
                                     <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                                         <span className="px-2 sm:px-3 py-1 bg-black rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider">Official</span>
                                         <span className="px-2 sm:px-3 py-1 bg-slate-100 rounded-md sm:rounded-lg text-[8px] sm:text-[9px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200">Report</span>
                                     </div>
                                     <div className="flex w-full gap-3 sm:gap-4 justify-center mt-auto">
                                         <button 
                                         onClick={() => { 
                                           setGalleryMode('qr'); 
                                           setActiveQrInfo(qr); 
                                           setQrReportUrl(qr.url);
                                           setShowQrModal(true); 
                                         }}
                                         className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-slate-900 border-2 border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:border-black hover:scale-105 active:scale-90 shadow-sm"
                                         title="ดูรูปขยาย"
                                         >
                                         <Maximize2 size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                                         </button>
                                         <button 
                                         onClick={() => handleEditExistingQr(qr)}
                                         className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-slate-900 border-2 border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:border-black hover:scale-105 active:scale-90 shadow-sm"
                                         title="แก้ไข"
                                         >
                                         <PencilLine size={16} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                                         </button>
                                     </div>
                                     </div>
                                 ))
                                 ) : (
                                 <div className="w-full py-16 sm:py-24 border-4 border-dashed border-slate-200 rounded-[3rem] sm:rounded-[4rem] flex flex-col items-center justify-center text-slate-400">
                                     <ImageOff size={40} className="sm:w-14 sm:h-14 mb-3 sm:mb-4 opacity-30" />
                                     <p className="text-xs sm:text-base font-bold uppercase tracking-widest">ไม่มีรายการ QR CODE</p>
                                 </div>
                                 )}
                             </div>

                             {/* แก้ไข: ซ่อนลูกศรไปต่อ (ขวา) เมื่ออยู่การ์ดใบสุดท้าย */}
                             {!qrScrollPos.right && (
                                <button onClick={() => scrollQr('right')} className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-700 active:scale-90 transition-all"><ChevronRight size={20}/></button>
                             )}
                         </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 pb-8 sm:pb-10">
                     {cases.find(c => c.org_id === orgId)?.is_deleted ? (
                         <button 
                         onClick={() => setUpdateModal({ show: true, type: 'restore', title: 'กู้คืนหน่วยงาน', newValue: true, reason: "" })} 
                         className="flex-1 btn h-14 sm:h-16 !rounded-2xl sm:!rounded-[2rem] !bg-[#00945e] hover:!bg-[#007a4d] !text-white !border-none font-bold shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm"
                         >
                         <RefreshCcw size={18} className={`sm:w-5 sm:h-5 ${isSearching ? "animate-spin" : ""}`} /> กู้คืนหน่วยงาน
                         </button>
                     ) : (
                         <button 
                         onClick={() => setShowDeleteModal(true)} 
                         className="flex-1 btn h-14 sm:h-16 !rounded-2xl sm:!rounded-[2rem] !bg-rose-600 hover:!bg-rose-700 !text-white !border-none font-bold shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs sm:text-sm"
                         >
                         <Trash2 size={18} className="sm:w-5 sm:h-5" /> ลบหน่วยงาน
                         </button>
                     )}
                     </div>
                 </div>
               </div>
             )}
           </div>

           {orgId && (
             <div className="hidden xl:block w-full xl:w-[320px] 2xl:w-[400px] shrink-0 xl:sticky xl:top-16 xl:order-2 animate-in fade-in slide-in-from-right-10 duration-700">
                 <TimelineComponent />
             </div>
           )}

         </div>
       </div>
     </div>

     {/* -------------------- MODAL ส่วนการพรีวิวรูปภาพ (Gallery Mode) -------------------- */}
     {showQrModal && (
       <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrModal(false)}>
         
         <div className="relative bg-white w-full max-w-6xl rounded-[2rem] sm:rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[85vh] shadow-2xl animate-in zoom-in duration-300 border-2 border-white/20 sm:border-white" onClick={(e) => e.stopPropagation()}>
           
           <button 
             onClick={() => setShowQrModal(false)} 
             className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-50 border-2 border-white"
           >
             <X size={16} className="sm:w-6 sm:h-6" strokeWidth={3} />
           </button>

           <div className="min-h-[40vh] md:min-h-0 md:flex-[1.5] bg-[#111] relative flex items-center justify-center group overflow-hidden">
             {/* เลือกรูปแสดงตามโหมด ถ้าโหมด QR ก็โชว์รูป QR */}
             <img 
               src={galleryMode === 'qr' ? qrReportUrl : (PHOTO_HISTORY_DATA[currentPhotoIndex]?.url || logoPreview)} 
               className="max-w-full max-h-full object-contain transition-all duration-700 p-4 sm:p-0" 
               alt="Preview" 
             />

             {/* ซ่อนปุ่มเลื่อนและตัวนับภาพ หากอยู่ในโหมดดู QR */}
             {galleryMode === 'logo' && PHOTO_HISTORY_DATA.length > 1 && (
               <>
                 <button 
                   onClick={() => setCurrentPhotoIndex((prev) => (prev === 0 ? PHOTO_HISTORY_DATA.length - 1 : prev - 1))}
                   className="absolute left-2 sm:left-6 w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 z-20"
                 >
                   <div className="absolute inset-0 rounded-full border-[2px] sm:border-[3px] border-white/30 sm:border-white/40"></div>
                   <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/90 sm:bg-white rounded-full flex items-center justify-center shadow-2xl">
                     <ChevronRight size={20} className="sm:w-8 sm:h-8 rotate-180 text-black translate-x-[-1px] sm:translate-x-[-2px]" />
                   </div>
                 </button>

                 <button 
                   onClick={() => setCurrentPhotoIndex((prev) => (prev === PHOTO_HISTORY_DATA.length - 1 ? 0 : prev + 1))}
                   className="absolute right-2 sm:right-6 w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 z-20"
                 >
                   <div className="absolute inset-0 rounded-full border-[2px] sm:border-[3px] border-white/30 sm:border-white/40"></div>
                   <div className="w-8 h-8 sm:w-14 sm:h-14 bg-white/90 sm:bg-white rounded-full flex items-center justify-center shadow-2xl">
                     <ChevronRight size={20} className="sm:w-8 sm:h-8 text-black translate-x-[1px] sm:translate-x-[2px]" />
                   </div>
                 </button>
               </>
             )}
             
             {galleryMode === 'logo' && (
               <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 px-4 sm:px-5 py-1.5 sm:py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] border border-white/10">
                 {currentPhotoIndex + 1} / {PHOTO_HISTORY_DATA.length}
               </div>
             )}
           </div>

           <div className="w-full md:w-[420px] flex flex-col bg-white h-auto md:h-full overflow-hidden">
             {galleryMode === 'logo' ? (
                 <>
                   <div className="p-5 sm:p-8 flex-1 overflow-y-auto qr-gallery-scrollbar">
                     <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10 mt-2 sm:mt-4 pr-10">
                       <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                         <UserCircle2 size={20} className="sm:w-6 sm:h-6" />
                       </div>
                       <div>
                         <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">ประวัติการอัปเดตระบบ</p>
                         <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none mt-1">รายละเอียดรูปภาพ</h3>
                       </div>
                     </div>

                     <div className="space-y-4 sm:space-y-6">
                       <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                         <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black shadow-sm border border-slate-100 text-indigo-600 shrink-0">
                           {PHOTO_HISTORY_DATA[currentPhotoIndex]?.user.charAt(0)}
                         </div>
                         <div className="min-w-0 flex-1">
                           <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5 sm:mb-1">เจ้าหน้าที่ผู้ดูแล</p>
                           <p className="text-base sm:text-lg font-bold text-slate-900 leading-none truncate w-full">
                             {PHOTO_HISTORY_DATA[currentPhotoIndex]?.user}
                           </p>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3 sm:gap-4">
                         <div className="p-4 sm:p-5 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                           <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                             <Clock size={10} className="sm:w-3 sm:h-3 text-slate-400" />
                             <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">อัปเดตเมื่อ</p>
                           </div>
                           <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{PHOTO_HISTORY_DATA[currentPhotoIndex]?.date}</p>
                         </div>
                         <div className="p-4 sm:p-5 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                           <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                             <Activity size={10} className="sm:w-3 sm:h-3 text-slate-400" />
                             <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">เวลา</p>
                           </div>
                           <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{PHOTO_HISTORY_DATA[currentPhotoIndex]?.time} น.</p>
                         </div>
                       </div>

                       <div className="p-5 sm:p-6 bg-indigo-50/50 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-dashed border-indigo-100 relative mt-4">
                         <div className="absolute -top-3 left-6 sm:left-6 px-3 sm:px-4 py-0.5 sm:py-1 bg-white border border-indigo-100 rounded-full text-[8px] sm:text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                           Update Reason
                         </div>
                         <p className="text-slate-700 text-xs sm:text-sm font-bold leading-relaxed italic">
                           "{PHOTO_HISTORY_DATA[currentPhotoIndex]?.reason}"
                         </p>
                       </div>
                     </div>
                   </div>

                   <div className="p-4 sm:p-8 border-t border-slate-50 bg-slate-50/30 shrink-0">
                     <button 
                       onClick={() => { alert('ทำการกู้คืนรูปภาพนี้กลับมาใช้งาน'); setShowQrModal(false); }}
                       className="w-full h-12 sm:h-14 bg-black hover:bg-slate-800 text-white rounded-[1rem] sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 sm:gap-3"
                     >
                       <RefreshCw size={14} className="sm:w-4 sm:h-4" strokeWidth={3} /> Restore <span className="hidden sm:inline">Previous Photo</span>
                     </button>
                   </div>
                 </>
             ) : (
                 <>
                   {/* แผงรายละเอียดเมื่อขยายดู QR Code ปรับดีไซน์ตามรูป */}
                   <div className="p-6 sm:p-10 flex-1 overflow-y-auto qr-gallery-scrollbar flex flex-col relative">
                       <div className="flex items-center gap-4 mb-8 sm:mb-10 pr-10">
                           <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 text-indigo-600 rounded-[1rem] flex items-center justify-center shrink-0">
                               <QrCode size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5}/>
                           </div>
                           <div>
                               <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none mb-1">QR Code</h3>
                               <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">รายละเอียดจุดรับแจ้ง</p>
                           </div>
                       </div>

                       <div className="space-y-4">
                           <div className="bg-[#f8fafc] rounded-[1.5rem] sm:rounded-3xl p-5 sm:p-6 border border-slate-100/50 shadow-sm">
                               <p className="text-[10px] sm:text-[11px] font-bold text-indigo-600 mb-1.5">ชื่อจุดรับแจ้งเหตุ</p>
                               <p className="text-base sm:text-lg font-black text-slate-900 truncate w-full">
                                   {activeQrInfo?.label || "ไม่ระบุ"}
                               </p>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-[#f8fafc] rounded-[1.5rem] sm:rounded-3xl p-5 sm:p-6 border border-slate-100/50 shadow-sm">
                                   <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-1.5">ID อ้างอิง</p>
                                   <p className="text-sm sm:text-base font-black text-slate-900">#{activeQrInfo?.id || "-"}</p>
                               </div>
                               <div className="bg-[#f8fafc] rounded-[1.5rem] sm:rounded-3xl p-5 sm:p-6 border border-slate-100/50 shadow-sm">
                                   <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-1.5">สถานะ</p>
                                   <div className="flex items-center gap-2">
                                       <div className="w-2.5 h-2.5 rounded-full bg-[#00945e] shadow-sm"></div>
                                       <p className="text-sm sm:text-base font-bold text-[#00945e]">ใช้งานปกติ</p>
                                   </div>
                               </div>
                           </div>
                       </div>

                       <div className="mt-auto pt-8 pb-2">
                           <button 
                               onClick={() => { handleDownloadQR(qrReportUrl, `${orgName}_${activeQrInfo?.label}`); setShowQrModal(false); }}
                               className="btn w-full h-14 sm:h-16 !bg-[#00945e] hover:!bg-[#007a4d] !text-white border-none rounded-[1rem] sm:rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 shadow-lg"
                           >
                               <Download size={20} strokeWidth={2.5} /> ดาวน์โหลด QR Code
                           </button>
                       </div>
                   </div>
                 </>
             )}
           </div>
         </div>
       </div>
     )}

      {/* -------------------- MODAL แก้ไข QR Code -------------------- */}
      {showQrEditor && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrEditor(false)}>
          
          <div className="relative bg-white w-full max-w-5xl rounded-[2rem] sm:rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[90dvh] md:h-[85vh] shadow-2xl animate-in zoom-in duration-300 border-2 border-white/20 sm:border-white" onClick={(e) => e.stopPropagation()}>
            
            {/* ปุ่มปิด สีแดงเหมือน Gallery */}
            <button 
              onClick={() => setShowQrEditor(false)} 
              className="absolute top-3 right-3 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-50 border-2 border-white"
            >
              <X size={16} className="sm:w-6 sm:h-6" strokeWidth={3} />
            </button>

            {/* ฝั่งซ้าย: ส่วนแสดง QR Preview */}
            <div className="h-[280px] sm:h-[350px] md:h-auto md:flex-[1.5] bg-[#f8fafc] flex items-center justify-center relative overflow-hidden shrink-0 border-b border-slate-200 md:border-b-0 md:border-r">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform scale-[0.50] sm:scale-[0.6] md:scale-[0.85] lg:scale-100 transition-transform flex flex-col items-center bg-white shadow-2xl p-0 rounded-2xl border border-slate-200" 
                   style={{ width: '380px', height: '520px' }}>
                {selectedFrame === 'bold' && <div className="absolute inset-0 z-10 border-[18px] border-slate-900 pointer-events-none"></div>}
                {selectedFrame === 'indigo' && <div className="absolute inset-0 z-10 border-[18px] border-indigo-600 pointer-events-none"></div>}
                {selectedFrame === 'gold' && <div className="absolute inset-0 z-10 border-[18px] border-amber-500 pointer-events-none"></div>}
                
                <div 
                  style={{ position: 'absolute', top: `${textPos}px`, fontSize: `${textSize}px`, zIndex: 20 }}
                  className="font-bold text-center w-full px-8 leading-tight text-slate-900 transition-all"
                >
                  <span className="bg-white/95 py-3 px-6 rounded-2xl shadow-xl border border-slate-200 inline-block tracking-tight font-black">
                    {qrText || "สแกนที่นี่"}
                  </span>
                </div>
                
                <div className="w-full h-full flex items-center justify-center p-14 bg-white">
                  <img src={qrReportUrl} className="w-full h-auto object-contain" alt="QR Preview" />
                </div>
                
                <div className="absolute bottom-6 text-xs font-black text-slate-600 uppercase tracking-widest z-20 opacity-80">
                  {orgName} • OFFICIAL ACCESS
                </div>
              </div>
            </div>

            {/* ฝั่งขวา: ส่วนตั้งค่า - แก้ไขโครงสร้าง Flexbox เพื่อแก้ปัญหา Scroll ไม่ไป */}
            <div className="flex-1 flex flex-col min-h-0 w-full md:w-[420px] bg-white overflow-hidden">
              
              {/* พื้นที่ที่ Scroll ได้ */}
              <div 
                className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 qr-gallery-scrollbar"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="pr-10">
                  <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tighter leading-none mb-1">QR Creator</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest">ออกแบบใบแจ้งเหตุ</p>
                </div>

                {/* เลือกกรอบ */}
                <div className="space-y-3">
                  <label className="text-[10px] sm:text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div> เลือกกรอบ (FRAME)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['none', 'bold', 'indigo', 'gold'].map(f => (
                      <button key={f} onClick={() => setSelectedFrame(f)} 
                        className={`h-10 sm:h-12 rounded-xl border-2 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center ${selectedFrame === f ? 'border-black bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-slate-50'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ข้อความกำกับ */}
                <div className="space-y-3">
                  <label className="text-[10px] sm:text-xs font-black uppercase text-slate-700 tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div> ข้อความกำกับ (CAPTION)
                  </label>
                  <textarea 
                    className="textarea w-full rounded-2xl font-bold text-sm sm:text-base h-20 !bg-slate-50 border border-slate-200 text-slate-900 focus:border-black focus:ring-1 focus:ring-black outline-none p-4 shadow-inner transition-all resize-none"
                    placeholder="สแกนเพื่อ..."
                    value={qrText}
                    onChange={(e) => setQrText(e.target.value)}
                  />
                </div>

                {/* ปรับขนาดและตำแหน่ง */}
                <div className="space-y-5 bg-[#f8fafc] p-5 rounded-[1.5rem] border border-slate-100/50 shadow-sm mt-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Type size={12} strokeWidth={3}/> ขนาดตัวอักษร</span>
                      <span className="bg-white px-2 py-0.5 rounded text-indigo-600 border border-slate-200 shadow-sm">{textSize}px</span>
                    </div>
                    <input type="range" min="12" max="40" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="range range-xs range-neutral w-full" />
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MoveVertical size={12} strokeWidth={3}/> ตำแหน่งแนวตั้ง</span>
                      <span className="bg-white px-2 py-0.5 rounded text-indigo-600 border border-slate-200 shadow-sm">{textPos}px</span>
                    </div>
                    <input type="range" min="20" max="480" value={textPos} onChange={(e) => setTextPos(parseInt(e.target.value))} className="range range-xs range-neutral w-full" />
                  </div>
                </div>
              </div>

              {/* Action Bar ยึดติดล่างเสมอ */}
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-white shrink-0 z-10">
                <button className="btn w-full !bg-[#00945e] hover:!bg-[#007a4d] !text-white rounded-[1rem] sm:rounded-2xl h-14 border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm sm:text-base font-black uppercase tracking-widest">
                  <Save size={20} strokeWidth={2.5} /> บันทึก QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

     {updateModal.show && (
       <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="!bg-white w-full max-w-md rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 border-white shadow-2xl animate-in zoom-in duration-300 relative">
           <button 
             onClick={() => setUpdateModal({ show: false, type: "", title: "", newValue: null, reason: "" })} 
             className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-20"
           >
             <X size={16} className="sm:w-6 sm:h-6" strokeWidth={3} />
           </button>
           <div className={`w-16 h-16 sm:w-20 sm:h-20 ${updateModal.type === 'restore' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner border border-slate-100`}>
               <AlertCircle size={32} className="sm:w-10 sm:h-10" />
           </div>
           <h3 className="text-xl sm:text-2xl font-bold text-center mb-2 !text-slate-900 tracking-tight font-bold">ยืนยัน{updateModal.title}?</h3>
           <p className="text-slate-600 text-sm sm:text-base text-center mb-6 sm:mb-8 font-bold leading-relaxed font-bold">{updateModal.type === 'restore' ? "ข้อมูลจะกลับมาแสดงผลในระบบตามปกติ" : "กรุณาระบุรายละเอียดการแก้ไขเพื่อบันทึก Log การเข้าถึงข้อมูล"}</p>
           <textarea className="textarea textarea-bordered w-full rounded-2xl sm:rounded-3xl min-h-[100px] sm:min-h-[120px] mb-6 sm:mb-8 font-bold text-sm sm:text-base !bg-slate-50 !text-slate-900 border-slate-300 focus:!border-black outline-none shadow-inner p-4 sm:p-5 transition-all font-bold" placeholder="ระบุเหตุผลในการแก้ไขครั้งนี้..." value={updateModal.reason} onChange={(e) => setUpdateModal({...updateModal, reason: e.target.value})}></textarea>
           <div className="flex gap-3 sm:gap-4">
             <button 
               onClick={handleIndividualUpdate} 
               disabled={isSearching || !updateModal.reason.trim()} 
               className={`btn flex-1 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest !text-white border-none shadow-xl h-12 sm:h-14 transition-all font-bold !bg-[#00945e] hover:!bg-[#007a4d] disabled:!bg-slate-300 disabled:!text-slate-500 text-xs sm:text-sm`}
             >
               {isSearching ? <Loader2 className="animate-spin" /> : "ยืนยัน"}
             </button>
           </div>
         </div>
       </div>
     )}

     {showDeleteModal && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="!bg-white w-full max-w-md rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-2 border-white shadow-2xl animate-in zoom-in duration-300 relative">
           <button 
             onClick={() => setShowDeleteModal(false)} 
             className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 sm:w-10 sm:h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-20"
           >
             <X size={16} className="sm:w-6 sm:h-6" strokeWidth={3} />
           </button>
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-inner border border-red-100"><AlertCircle size={32} className="sm:w-10 sm:h-10" /></div>
           <h3 className="text-xl sm:text-2xl font-bold text-center mb-2 !text-slate-900 tracking-tight font-bold">ยืนยันการลบหน่วยงาน?</h3>
           <p className="text-slate-600 text-sm sm:text-base text-center mb-6 sm:mb-8 font-bold leading-relaxed font-bold">ข้อมูลจะถูกซ่อนจากระบบชั่วคราว แต่สามารถกู้คืนได้ภายหลังโดย Admin สูงสุด</p>
           <textarea className="textarea textarea-bordered w-full rounded-2xl sm:rounded-3xl min-h-[100px] sm:min-h-[120px] mb-6 sm:mb-8 font-bold text-sm sm:text-base !bg-slate-50 !text-slate-900 border-slate-300 focus:!border-red-500 outline-none shadow-inner p-4 sm:p-5 transition-all font-bold" placeholder="ระบุสาเหตุการลบ..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}></textarea>
           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
             <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest !bg-rose-600 hover:!bg-rose-700 !text-white border-none h-12 sm:h-14 transition-all font-bold text-xs sm:text-sm order-2 sm:order-1">ยกเลิก</button>
             <button 
               onClick={() => handleDelete()} 
               disabled={!deleteReason.trim()}
               className="btn flex-1 rounded-xl sm:rounded-2xl !bg-[#00945e] !text-white hover:!bg-[#007a4d] border-none font-bold uppercase tracking-widest shadow-xl h-12 sm:h-14 transition-all font-bold disabled:!bg-slate-300 disabled:!text-slate-500 text-xs sm:text-sm order-1 sm:order-2"
             >
               ยืนยัน
             </button>
           </div>
         </div>
       </div>
     )}
   </div> 
 );
}