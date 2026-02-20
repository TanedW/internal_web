'use client';

import React, { useEffect, useState, useRef } from "react";
import Sidebar from "../components/sidebar"; 
import { 
 Building2, Upload, Image as ImageIcon, 
 CheckCircle2, AlertCircle, Loader2, Search,
 ChevronRight, MousePointerClick, Copy, 
 QrCode, Trash2, FileSpreadsheet, ShieldCheck,
 RefreshCcw, X, ImageOff, Download, Info,
 Maximize2, Save, Plus, PencilLine,
 UserCheck, Mail, Phone, Shield, Check,
 MoveVertical, Type,
 Clock, Edit3, RefreshCw, FileText, ArrowRight, Filter, MoreVertical, Activity, Settings2,
 History // นำเข้า History สำหรับปุ่มมือถือ
} from "lucide-react";

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

 const [updateModal, setUpdateModal] = useState({
   show: false,
   type: "", 
   title: "",
   newValue: null,
   reason: ""
 });

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
 }, [qrReportUrl]);

 // UI Component สำหรับ Timeline (เพื่อเรียกใช้ซ้ำได้)
 const TimelineComponent = () => (
   <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-white z-0"></div>
     <div className="p-6 pb-4 relative z-10">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md">
             <Activity size={20} />
           </div>
           <div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Activity Log</h3>
             <div className="flex items-center gap-1.5 mt-1.5">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</p>
             </div>
           </div>
         </div>
         <button className="w-10 h-10 bg-white border border-slate-200 hover:border-black hover:bg-black hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-all duration-300 shadow-sm active:scale-95">
           <Filter size={16} strokeWidth={2.5} />
         </button>
       </div>
       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
         {['ทั้งหมด', 'การแก้ไข', 'ความปลอดภัย', 'ระบบ'].map((tag, i) => (
           <button key={i} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${i === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'}`}>
             {tag}
           </button>
         ))}
       </div>
     </div>
     <div className="px-6 pb-6 relative z-10 max-h-[450px] overflow-y-auto qr-gallery-scrollbar">
       <div className="absolute left-[39px] top-4 bottom-12 w-[2px] bg-slate-100 z-0 rounded-full"></div>
       <div className="space-y-4 pt-2">
         {TIMELINE_DATA.map((item) => {
           const styles = getTypeStyles(item.type);
           return (
             <div key={item.id} className="relative flex gap-4 group z-10">
               <div className={`relative w-9 h-9 shrink-0 rounded-xl ${styles.bg} ${styles.text} border-2 ${styles.border} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 z-20 shadow-sm bg-white`}>
                 {styles.icon}
               </div>
               <div className="flex-1 min-w-0 pt-0.5">
                 <div className="flex justify-between items-center mb-1 gap-2">
                   <h4 className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors cursor-pointer">{item.action}</h4>
                   <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{item.time}</span>
                 </div>
                 <div className="bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:border-slate-200 rounded-xl p-3 transition-all duration-300">
                   <p className="text-[11px] text-slate-600 font-medium leading-tight break-words">{item.detail}</p>
                   <div className="flex items-center gap-1.5 mt-2 opacity-60">
                     <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">{item.user.charAt(0)}</div>
                     <span className="text-[9px] font-bold text-slate-500 tracking-tight">{item.user}</span>
                   </div>
                 </div>
               </div>
             </div>
           );
         })}
       </div>
     </div>
     <div className="p-4 pt-2 bg-white border-t border-slate-50 relative z-20">
       <button className="relative w-full py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm text-slate-900">
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
     `}</style>
     <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      
     <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

     <div className={`main-content-scroll container mx-auto px-4 lg:px-8 pt-28 lg:pt-16 pb-20 max-w-[1600px] transition-all duration-300 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-24"}`}>
       
       <div className="flex flex-col xl:flex-row gap-8 items-start">
         
         <div className={`flex-1 w-full max-w-4xl transition-all duration-500 ${orgId ? 'xl:order-1' : 'xl:mx-auto'}`}>
           <header className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"><Building2 size={24} /></div>
             <div>
               <h1 className="text-2xl font-black text-slate-900 leading-none mb-1 tracking-tight">จัดการหน่วยงาน</h1>
               <p className="text-slate-500 font-bold text-sm">ตั้งค่าสิทธิ์ รหัสเข้าใช้งาน และสถานะหน่วยงาน</p>
             </div>
           </header>
             
           <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-10">
             <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 z-20" size={18} />
               <input 
                 type="text" 
                 className="input input-bordered w-full h-14 !pl-11 pr-4 !bg-white !text-slate-900 !rounded-2xl !border-slate-200 focus:!border-black shadow-sm outline-none font-bold text-base transition-all" 
                 placeholder="ค้นหาชื่อหน่วยงาน หรือ ID..." 
                 value={searchId} 
                 onChange={(e) => setSearchId(e.target.value)} 
                 onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
               />
             </div>
             <button onClick={() => fetchOrgData(searchId)} className="btn h-14 px-10 !bg-black !text-white !font-bold !rounded-2xl hover:!bg-slate-800 border-none shrink-0 transition-all shadow-lg active:scale-95">
               {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
             </button>
           </div>

           <div className="mb-10">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 px-1">ผลการค้นหา</h3>
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
                       className={`relative !bg-white rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 border-2 flex flex-col p-2 ${
                         isSelected 
                           ? '!border-black shadow-xl scale-[1.02] z-10' 
                           : '!border-white shadow-sm hover:!border-slate-200'
                       } ${item.is_deleted ? 'opacity-75' : ''}`}
                     >
                       <div className="h-32 w-full !bg-[#f8fafc] rounded-2xl flex items-center justify-center relative overflow-hidden">
                         <img src={STORAGE_BASE_URL + item.logo_url} className={`w-full h-full object-cover transition-transform duration-700 ${isSelected ? 'scale-110' : ''} ${item.is_deleted ? 'grayscale' : ''}`} alt="Logo" />
                         {item.is_deleted && (
                           <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center backdrop-blur-[2px]">
                             <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest uppercase">Deleted</span>
                           </div>
                         )}
                         {isSelected && !item.is_deleted && (
                           <div className="absolute top-3 right-3 bg-black text-white rounded-full p-1.5 shadow-lg z-10 border-2 border-white">
                             <Check size={14} strokeWidth={4} />
                           </div>
                         )}
                       </div>
                       
                       <div className="p-4 flex flex-col flex-1 !text-slate-900">
                         <h4 className="font-black text-base truncate mb-1 tracking-tight">{item.org_name}</h4>
                         <div className="mt-auto flex items-center justify-between">
                           <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">ID: {item.org_id}</span>
                           <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSelected ? '!bg-black !text-white' : '!bg-slate-100 !text-slate-400'}`}>
                             <ChevronRight size={14} strokeWidth={4} />
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="!bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-slate-400">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                   <MousePointerClick size={32} className="opacity-20" />
                 </div>
                 <p className="font-bold text-sm uppercase tracking-widest text-slate-300">ระบุรหัสเพื่อเริ่มจัดการ</p>
               </div>
             )}
           </div>

           {orgId && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
               
               <div className="xl:hidden grid grid-cols-2 gap-3">
                   <button 
                       onClick={scrollToEdit}
                       className="btn h-16 !bg-indigo-600 hover:!bg-indigo-700 !text-white !rounded-2xl border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-tight"
                   >
                       <Settings2 size={18} /> จัดการข้อมูล
                   </button>
                   <button 
                       onClick={() => setShowMobileTimeline(!showMobileTimeline)}
                       className={`btn h-16 !rounded-2xl border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-tight ${showMobileTimeline ? '!bg-black !text-white' : '!bg-white !text-slate-900 border-2 !border-slate-100'}`}
                   >
                       <History size={18} /> {showMobileTimeline ? 'ปิดไทม์ไลน์' : 'ดูไทม์ไลน์'}
                   </button>
               </div>

               {showMobileTimeline && (
                 <div className="xl:hidden animate-in slide-in-from-top-4 duration-300">
                   <TimelineComponent />
                 </div>
               )}

               <div 
                   ref={editPanelRef} 
                   className={`space-y-8 ${!showMobileEditPanel ? 'hidden xl:block' : 'block'}`}
               >
                   <div className="!bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-white">
                       <div className="flex flex-col md:flex-row gap-8">
                           <div className="relative shrink-0 mx-auto md:mx-0">
                           <div className="w-32 h-32 !bg-slate-50 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner">
                               {logoPreview ? (
                               <img src={STORAGE_BASE_URL + logoPreview} className="w-full h-full object-cover" alt="Preview" />
                               ) : (
                               <ImageIcon size={32} className="text-slate-400" />
                               )}
                           </div>
                           <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-all border-4 border-white">
                               <Upload size={18} />
                               <input 
                               type="file" className="hidden" accept="image/*"
                               onChange={(e) => { 
                                   const file = e.target.files[0]; 
                                   if (file) { 
                                   setUpdateModal({
                                       show: true,
                                       type: 'logo',
                                       title: 'รูปภาพหน่วยงาน',
                                       newValue: file,
                                       reason: ""
                                   });
                                   } 
                               }} 
                               />
                           </label>
                           </div>
                           
                           <div className="flex-1 space-y-4">
                           <div>
                               <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 block px-1">ชื่อหน่วยงาน</label>
                               <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                               <input 
                                   type="text" 
                                   value={orgName} 
                                   onChange={(e) => setOrgName(e.target.value)} 
                                   className="input input-bordered flex-1 min-w-[200px] rounded-2xl font-bold !bg-white !text-slate-900 border-slate-200 focus:!border-black transition-all text-base" 
                               />
                               <button 
                                   onClick={() => setUpdateModal({ show: true, type: 'name', title: 'ชื่อหน่วยงาน', newValue: orgName, reason: "" })}
                                   className="btn h-14 w-14 !bg-black !text-white rounded-2xl border-none shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                               >
                                   <Save size={18}/>
                               </button>
                               </div>
                           </div>
                           <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                               <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                               <label className="text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Staff Code</label>
                               <div className="flex items-center justify-between gap-2 overflow-hidden">
                                   <code className="text-base font-bold text-blue-700 break-all leading-tight">{staffCode}</code>
                                   <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-2 !bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-black shadow-sm transition-all"><Copy size={16}/></button>
                               </div>
                               </div>
                               <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                               <label className="text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Admin Code</label>
                               <div className="flex items-center justify-between gap-2 overflow-hidden">
                                   <code className="text-base font-bold text-red-700 break-all leading-tight">{adminCode}</code>
                                   <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-2 !bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-black shadow-sm transition-all"><Copy size={16}/></button>
                               </div>
                               </div>
                           </div>
                           </div>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="!bg-white p-6 rounded-[2rem] shadow-sm border-2 border-white flex items-center justify-between hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-green-50 text-green-700 rounded-xl flex items-center justify-center border border-green-100"><FileSpreadsheet size={20}/></div>
                       <div>
                           <p className="font-bold text-base !text-slate-900 tracking-tight">การส่งออก CSV</p>
                           <p className="text-sm text-slate-600 font-bold uppercase tracking-tight">อนุญาตให้ดาวน์โหลดรายงาน</p>
                       </div>
                       </div>
                       <input 
                       type="checkbox" 
                       className="toggle border-none bg-slate-300 checked:bg-[#00945e]" 
                       checked={isCsvEnabled} 
                       onChange={(e) => setUpdateModal({ show: true, type: 'csv', title: 'สิทธิ์ CSV', newValue: e.target.checked, reason: "" })} 
                       />
                   </div>
                   <div className="!bg-white p-6 rounded-[2rem] shadow-sm border-2 border-white flex items-center justify-between hover:border-slate-200 transition-all">
                       <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center border border-blue-100"><ShieldCheck size={20}/></div>
                       <div>
                           <p className="font-bold text-base !text-slate-900 tracking-tight">Official Account</p>
                           <p className="text-sm text-slate-600 font-bold uppercase tracking-tight">ยืนยันตัวตนทางการ</p>
                       </div>
                       </div>
                       <input 
                       type="checkbox" 
                       className="toggle toggle-info bg-slate-300" 
                       checked={isOfficial} 
                       onChange={(e) => setUpdateModal({ show: true, type: 'official', title: 'สถานะ Official', newValue: e.target.checked, reason: "" })} 
                       />
                   </div>
                   </div>

                   <div className="!bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border-2 border-white">
                       <div className="flex flex-row items-center justify-between mb-8 px-1 gap-4">
                           <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                           <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0"><UserCheck size={20} /></div>
                           <div className="min-w-0 flex-1">
                               <p className="font-bold text-base !text-slate-900 uppercase tracking-tight truncate">รายชื่อเจ้าหน้าที่</p>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">ผู้ดูแลระบบประจำหน่วยงาน</p>
                           </div>
                           </div>
                           <span className="shrink-0 text-[11px] font-black bg-slate-100 px-4 py-2 rounded-full text-slate-800 border border-slate-200 whitespace-nowrap uppercase tracking-widest">
                             {cases.find(c => c.org_id === orgId)?.members?.length || 0} คน
                           </span>
                       </div>
                       <div className="flex gap-6 overflow-x-auto pt-10 pb-6 px-1 snap-x scroll-smooth qr-gallery-scrollbar">
                           {cases.find(c => c.org_id === orgId)?.members?.map((staff) => (
                           <div 
                               key={staff.member} 
                               className="snap-center min-w-[280px] bg-white rounded-[2.8rem] p-7 border border-slate-200 pop-card flex flex-col items-center transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl group"
                           >
                               <div className="relative mb-5">
                               <div className="w-24 h-24 rounded-full overflow-hidden border-[6px] border-white shadow-xl transition-all duration-500 group-hover:scale-105">
                                   <img src={staff.picture_profile} className="w-full h-full object-cover" alt={staff.member_name} />
                               </div>
                               <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#00945e] border-4 border-white rounded-full shadow-lg"></div>
                               </div>
                               <h4 className="font-bold text-lg text-slate-900 mb-1 tracking-tight truncate w-full text-center">{staff.member_name}</h4>
                               <div className={`flex items-center gap-1.5 mb-6 px-4 py-1.5 rounded-full border shadow-sm ${
                               staff.role === 'Super Admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 
                               staff.role === 'Manager' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                               'bg-slate-100 border-slate-200 text-slate-700'
                               }`}>
                               <Shield size={12} strokeWidth={4} />
                               <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">{staff.role}</span>
                               </div>
                               <div className="w-full space-y-3 border-t border-slate-100 pt-6">
                               <div className="flex items-center gap-3 text-slate-700 hover:text-black transition-colors cursor-pointer group/item min-w-0"><div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 group-hover/item:border-black transition-all shrink-0"><Phone size={16} strokeWidth={2.5} /></div><span className="text-sm font-bold tracking-wide truncate">{staff.member_phone}</span></div>
                               
                               <div className="flex items-center gap-3 text-slate-700 hover:text-black transition-colors cursor-pointer group/item relative overflow-hidden min-w-0"><div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 group-hover/item:border-black transition-all shrink-0"><Mail size={16} strokeWidth={2.5} /></div><div className="relative group/email flex-1 min-w-0"><span className="text-sm font-bold tracking-wide truncate block" title={staff.email}>{staff.email}</span></div><button onClick={(e) => { e.stopPropagation(); copyToClipboard(staff.email); }} className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-slate-100 rounded-lg transition-all shrink-0"><Copy size={12} className="text-slate-400 hover:text-black" /></button></div>
                               </div>
                           </div>
                           ))}
                       </div>
                   </div>
                   
                   {/* ส่วน QR CODE: เอาปุ่ม "เพิ่ม QR ใหม่" ไปไว้คนละบรรทัด (บรรทัดใหม่ข้างล่างหัวข้อ) */}
                   <div className="!bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border-2 border-white overflow-hidden">
                       <div className="mb-6 px-1 space-y-6">
                           <div className="flex items-center gap-4 min-w-0 overflow-hidden">
                             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                               <QrCode size={24} />
                             </div>
                             <div className="min-w-0 flex-1">
                               <h2 className="font-black text-xl !text-slate-900 uppercase tracking-tight leading-tight truncate">QR CODE ทั้งหมดของหน่วยงาน</h2>
                               <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 truncate">จุดรับแจ้งเหตุที่บันทึกไว้</p>
                             </div>
                           </div>
                           
                           {/* ปุ่มอยู่คนละบรรทัด จัดเต็มความกว้างหรือตามความสวยงาม */}
                           <button 
                             onClick={() => { setQrText("สแกนเพื่อแจ้งเหตุ"); setShowQrEditor(true); }}
                             className="w-full sm:w-auto btn h-14 !bg-slate-900 hover:!bg-black !text-white rounded-2xl px-8 border-none font-bold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                           >
                             <Plus size={20} strokeWidth={3} /> เพิ่ม QR ใหม่
                           </button>
                       </div>

                       <div className="flex gap-10 overflow-x-auto pb-16 pt-8 px-8 qr-gallery-scrollbar">
                           {qrList.length > 0 ? (
                           qrList.map((qr) => (
                               <div 
                               key={qr.id} 
                               className="group relative min-w-[260px] bg-white rounded-[3.5rem] p-8 flex flex-col items-center transition-all duration-500 pop-card hover:shadow-2xl hover:-translate-y-4 border border-slate-100"
                               >
                               <button 
                                   onClick={() => handleDownloadQR(qr.url, `${orgName}_${qr.label}`)}
                                   className="absolute top-6 right-6 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center transition-all hover:bg-black hover:text-white hover:scale-110 active:scale-90 shadow-md z-20 border border-slate-200"
                               >
                                   <Download size={20} strokeWidth={2.5} />
                               </button>
                               <div className="w-28 h-28 rounded-xl overflow-hidden mb-6 border-2 border-slate-100 shadow-sm bg-white flex items-center justify-center p-2 mt-2">
                                   <img src={qr.url} className="w-full h-auto object-contain" alt="QR" />
                               </div>
                               <h4 className="text-base font-bold text-slate-900 mb-0.5 text-center leading-tight px-2 tracking-tight truncate w-full">{qr.label}</h4>
                               <p className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-widest">ID: #{qr.id}</p>
                               <div className="flex gap-2 mb-8">
                                   <span className="px-3 py-1 bg-black rounded-lg text-[9px] font-bold text-white uppercase tracking-wider">Official</span>
                                   <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200">Report</span>
                               </div>
                               <div className="flex w-full gap-4 justify-center mt-auto">
                                   <button 
                                   onClick={() => { setShowQrModal(true); setQrReportUrl(qr.url); }}
                                   className="w-12 h-12 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl flex items-center justify-center transition-all hover:border-black hover:scale-105 active:scale-90 shadow-sm"
                                   title="ดูรูปขยาย"
                                   >
                                   <Maximize2 size={20} strokeWidth={2.5} />
                                   </button>
                                   <button 
                                   onClick={() => handleEditExistingQr(qr)}
                                   className="w-12 h-12 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl flex items-center justify-center transition-all hover:border-black hover:scale-105 active:scale-90 shadow-sm"
                                   title="แก้ไข"
                                   >
                                   <PencilLine size={20} strokeWidth={2.5} />
                                   </button>
                               </div>
                               </div>
                           ))
                           ) : (
                           <div className="w-full py-24 border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center text-slate-400">
                               <ImageOff size={60} className="mb-4 opacity-30" />
                               <p className="text-base font-bold uppercase tracking-widest">ไม่มีรายการ QR CODE</p>
                           </div>
                           )}
                       </div>
                   </div>

                   <div className="flex gap-4 pt-4 pb-10">
                   {cases.find(c => c.org_id === orgId)?.is_deleted ? (
                       <button 
                       onClick={() => setUpdateModal({ show: true, type: 'restore', title: 'กู้คืนหน่วยงาน', newValue: true, reason: "" })} 
                       className="flex-1 btn h-16 !rounded-[2rem] !bg-[#00945e] hover:!bg-[#007a4d] !text-white !border-none font-bold shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                       >
                       <RefreshCcw size={20} className={isSearching ? "animate-spin" : ""} /> กู้คืนหน่วยงาน
                       </button>
                   ) : (
                       <button 
                       onClick={() => setShowDeleteModal(true)} 
                       className="flex-1 btn h-16 !rounded-[2rem] !bg-rose-600 hover:!bg-rose-700 !text-white !border-none font-bold shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                       >
                       <Trash2 size={20} /> ลบหน่วยงาน
                       </button>
                   )}
                   </div>
               </div>
             </div>
           )}
         </div>

         {orgId && (
           <div className="hidden xl:block w-full xl:w-[420px] shrink-0 xl:sticky xl:top-16 xl:order-2 animate-in fade-in slide-in-from-right-10 duration-700">
               <TimelineComponent />
           </div>
         )}

       </div>
     </div>

     {showQrEditor && (
       <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
         <div className="bg-white w-full max-w-5xl rounded-[4rem] overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[90vh] shadow-2xl border-4 border-white/20 relative">
           <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative overflow-hidden">
             <div className="relative bg-white shadow-2xl p-0 rounded-2xl overflow-hidden flex flex-col items-center border border-slate-200" 
                   style={{ width: '380px', height: '520px' }}>
               {selectedFrame === 'bold' && <div className="absolute inset-0 z-10 border-[18px] border-slate-900 pointer-events-none"></div>}
               {selectedFrame === 'indigo' && <div className="absolute inset-0 z-10 border-[18px] border-indigo-600 pointer-events-none"></div>}
               {selectedFrame === 'gold' && <div className="absolute inset-0 z-10 border-[18px] border-amber-500 pointer-events-none"></div>}
               <div 
                 style={{ 
                   position: 'absolute', 
                   top: `${textPos}px`, 
                   fontSize: `${textSize}px`,
                   zIndex: 20
                 }}
                 className="font-bold text-center w-full px-8 leading-tight text-slate-900"
               >
                 <span className="bg-white/95 py-3 px-6 rounded-2xl shadow-xl border border-slate-200 inline-block tracking-tight font-bold">
                   {qrText || "สแกนที่นี่"}
                 </span>
               </div>
               <div className="w-full h-full flex items-center justify-center p-14 bg-white">
                 <img src={qrReportUrl} className="w-full h-auto object-contain" alt="QR Preview" />
               </div>
               <div className="absolute bottom-6 text-xs font-bold text-slate-600 uppercase tracking-widest z-20 opacity-80 font-bold">
                 {orgName} • OFFICIAL ACCESS
               </div>
             </div>
           </div>
           <div className="w-full md:w-96 p-10 flex flex-col gap-6 overflow-y-auto scrollbar-hide border-l border-slate-100 !bg-white">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-3xl text-black tracking-tighter leading-none mb-1 font-bold">QR Creator</h3>
                 <p className="text-sm text-slate-600 font-bold uppercase tracking-widest font-bold">ออกแบบใบแจ้งเหตุ</p>
               </div>
               <button 
                 onClick={() => setShowQrEditor(false)} 
                 className="w-10 h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105"
               >
                 <X size={24} strokeWidth={3} />
               </button>
             </div>
             <div className="space-y-4">
               <label className="text-xs font-bold uppercase text-slate-600 tracking-widest flex items-center gap-2 font-bold">
                 <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div> เลือกกรอบ (FRAME)
               </label>
               <div className="grid grid-cols-2 gap-3">
                 {['none', 'bold', 'indigo', 'gold'].map(f => (
                   <button key={f} onClick={() => setSelectedFrame(f)} 
                     className={`h-12 rounded-2xl border-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center font-bold ${selectedFrame === f ? 'border-black bg-slate-900 text-white shadow-lg scale-[1.02]' : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-slate-50'}`}>
                     {f}
                   </button>
                 ))}
               </div>
             </div>
             <div className="space-y-4">
               <label className="text-xs font-bold uppercase text-slate-600 tracking-widest flex items-center gap-2 font-bold">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div> ข้อความกำกับ (CAPTION)
               </label>
               <textarea 
                 className="textarea textarea-bordered w-full rounded-2xl font-bold text-lg h-24 !bg-slate-50 border-slate-200 text-black focus:ring-2 ring-black outline-none p-4 shadow-inner transition-all font-bold"
                 placeholder="สแกนเพื่อ..."
                 value={qrText}
                 onChange={(e) => setQrText(e.target.value)}
               />
             </div>
             <div className="space-y-6">
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-widest">
                   <span className="flex items-center gap-2"><Type size={14}/> ขนาดตัวอักษร</span>
                   <span className="bg-slate-100 px-3 py-1 rounded-lg text-black">{textSize}px</span>
                 </div>
                 <input 
                   type="range" min="12" max="40" value={textSize} 
                   onChange={(e) => setTextSize(parseInt(e.target.value))} 
                   className="range range-xs range-neutral" 
                 />
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-xs font-bold text-slate-600 uppercase tracking-widest">
                   <span className="flex items-center gap-2"><MoveVertical size={14}/> ตำแหน่งแนวตั้ง</span>
                   <span className="bg-slate-100 px-3 py-1 rounded-lg text-black">{textPos}px</span>
                 </div>
                 <input 
                   type="range" min="20" max="480" value={textPos} 
                   onChange={(e) => setTextPos(parseInt(e.target.value))} 
                   className="range range-xs range-neutral" 
                 />
               </div>
             </div>
             <div className="mt-auto pt-6 flex gap-3">
               <button className="btn !bg-[#00945e] hover:!bg-[#007a4d] !text-white rounded-2xl h-14 border-none shadow-xl flex-[2] flex items-center justify-center gap-3 active:scale-95 transition-all text-base font-bold uppercase tracking-widest font-bold">
                 <Save size={20} strokeWidth={3} /> บันทึก
               </button>
             </div>
           </div>
         </div>
       </div>
     )}

     {updateModal.show && (
       <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="!bg-white w-full max-w-md rounded-[3rem] p-10 border-2 border-white shadow-2xl animate-in zoom-in duration-300 relative">
           <button 
             onClick={() => setUpdateModal({ show: false, type: "", title: "", newValue: null, reason: "" })} 
             className="absolute top-5 right-5 w-10 h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-20"
           >
             <X size={24} strokeWidth={3} />
           </button>
           <div className={`w-20 h-20 ${updateModal.type === 'restore' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'} rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100`}>
               <AlertCircle size={40} />
           </div>
           <h3 className="text-2xl font-bold text-center mb-2 !text-slate-900 tracking-tight font-bold">ยืนยัน{updateModal.title}?</h3>
           <p className="text-slate-600 text-base text-center mb-8 font-bold leading-relaxed font-bold">{updateModal.type === 'restore' ? "ข้อมูลจะกลับมาแสดงผลในระบบตามปกติ" : "กรุณาระบุรายละเอียดการแก้ไขเพื่อบันทึก Log การเข้าถึงข้อมูล"}</p>
           <textarea className="textarea textarea-bordered w-full rounded-3xl min-h-[120px] mb-8 font-bold text-base !bg-slate-50 !text-slate-900 border-slate-300 focus:!border-black outline-none shadow-inner p-5 transition-all font-bold" placeholder="ระบุเหตุผลในการแก้ไขครั้งนี้..." value={updateModal.reason} onChange={(e) => setUpdateModal({...updateModal, reason: e.target.value})}></textarea>
           <div className="flex gap-4">
             <button 
               onClick={handleIndividualUpdate} 
               disabled={isSearching || !updateModal.reason.trim()} 
               className={`btn flex-1 rounded-2xl font-bold uppercase tracking-widest !text-white border-none shadow-xl h-14 transition-all font-bold !bg-[#00945e] hover:!bg-[#007a4d] disabled:!bg-slate-300 disabled:!text-slate-500`}
             >
               {isSearching ? <Loader2 className="animate-spin" /> : "ยืนยัน"}
             </button>
           </div>
         </div>
       </div>
     )}

     {showDeleteModal && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
         <div className="!bg-white w-full max-w-md rounded-[3rem] p-10 border-2 border-white shadow-2xl animate-in zoom-in duration-300 relative">
           <button 
             onClick={() => setShowDeleteModal(false)} 
             className="absolute top-5 right-5 w-10 h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 z-20"
           >
             <X size={24} strokeWidth={3} />
           </button>
           <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100"><AlertCircle size={40} /></div>
           <h3 className="text-2xl font-bold text-center mb-2 !text-slate-900 tracking-tight font-bold">ยืนยันการลบหน่วยงาน?</h3>
           <p className="text-slate-600 text-base text-center mb-8 font-bold leading-relaxed font-bold">ข้อมูลจะถูกซ่อนจากระบบชั่วคราว แต่สามารถกู้คืนได้ภายหลังโดย Admin สูงสุด</p>
           <textarea className="textarea textarea-bordered w-full rounded-3xl min-h-[120px] mb-8 font-bold text-base !bg-slate-50 !text-slate-900 border-slate-300 focus:!border-red-500 outline-none shadow-inner p-5 transition-all font-bold" placeholder="ระบุสาเหตุการลบ..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}></textarea>
           <div className="flex gap-4">
             <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-2xl font-bold uppercase tracking-widest !bg-rose-600 hover:!bg-rose-700 !text-white border-none h-14 transition-all font-bold">ยกเลิก</button>
             <button 
               onClick={() => handleDelete()} 
               disabled={!deleteReason.trim()}
               className="btn flex-1 rounded-2xl !bg-[#00945e] !text-white hover:!bg-[#007a4d] border-none font-bold uppercase tracking-widest shadow-xl h-14 transition-all font-bold disabled:!bg-slate-300 disabled:!text-slate-500"
             >
               ยืนยัน
             </button>
           </div>
         </div>
       </div>
     )}

     {showQrModal && (
       <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrModal(false)}>
         <div className="relative !bg-white p-8 sm:p-10 rounded-[4rem] max-w-sm w-full shadow-2xl animate-in zoom-in duration-500 border-4 border-white/50" onClick={(e) => e.stopPropagation()} >
           <button 
             onClick={() => setShowQrModal(false)} 
             className="absolute top-6 right-6 w-11 h-11 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all z-20 border-4 border-white"
           >
             <X size={24} strokeWidth={3} />
           </button>
           <div className="text-center mb-8 mt-4">
             <h3 className="font-bold text-slate-900 text-2xl tracking-tight uppercase px-4 font-bold">QR CODE สำหรับแจ้งเหตุ</h3>
             <p className="text-sm text-slate-600 font-bold uppercase tracking-widest mt-2 px-4 truncate font-bold">{orgName}</p>
           </div>
           <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-6 shadow-inner mb-10 transition-all hover:bg-white">
             <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100"><img src={qrReportUrl} className="w-full h-auto object-contain transition-all hover:scale-105" alt="QR Large" /></div>
           </div>
           <button onClick={() => handleDownloadQR(qrReportUrl, orgName)} className="btn w-full h-16 !bg-slate-900 !text-white !rounded-[2rem] font-bold border-none shadow-2xl hover:!bg-black transition-all active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-widest font-bold"><Download size={24} strokeWidth={3} /> ดาวน์โหลด QR CODE</button>
         </div>
       </div>
     )}
   </div> 
 );
}