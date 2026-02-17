'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Copy, 
  QrCode, Trash2, FileSpreadsheet, ShieldCheck,
  RefreshCcw, X, ImageOff, Download, Info,
  Maximize2, Save, Plus, PencilLine,
  UserCheck, Mail, Phone, Shield, Check,
  MoveVertical, Type
} from "lucide-react";

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

  const staffMockup = [
    { id: 1, name: "สมชาย สายตรวจ", role: "Super Admin", phone: "081-234-5678", email: "somchai@citydata.go.th", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100" },
    { id: 2, name: "สมหญิง มั่นคง", role: "Manager", phone: "082-999-8888", email: "somying@citydata.go.th", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" },
    { id: 3, name: "กิตติพงษ์ ใจดี", role: "Staff", phone: "089-777-6655", email: "kittipong@citydata.go.th", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" },
    { id: 4, name: "วิภาวดี ขยันยิ่ง", role: "Staff", phone: "085-111-2233", email: "wipawadee@citydata.go.th", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100" },
  ];

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

  const fetchOrgData = async (targetId = "") => {
    if (!targetId) return;
    setIsSearching(true);
    setOrgId(""); 
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
          qr_report_url: item.qr_report_url || ""
        })));
      } else {
        setCases([]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally { setIsSearching(false); }
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
          payload.file_url = uploadResult.photo_link;
        } else {
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
    alert("คัดลอกรหัสแล้ว: " + text);
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

  return (
    <div data-theme="light" className="min-h-screen !bg-[#F4F6F8] !text-slate-900 font-bold overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .qr-gallery-scrollbar::-webkit-scrollbar { height: 8px; }
        .qr-gallery-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .qr-gallery-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .pop-card {
          box-shadow: 
            0 20px 25px -5px rgb(0 0 0 / 0.1), 
            0 8px 10px -6px rgb(0 0 0 / 0.1),
            0 0 0 1px rgb(0 0 0 / 0.05);
        }
      `}</style>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      
      <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

      <div className={`container mx-auto px-4 lg:px-8 pt-28 lg:pt-16 pb-20 max-w-7xl transition-all duration-300 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        
        <div className="max-w-2xl mx-auto px-4">
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"><Building2 size={24} /></div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-none mb-1 tracking-tight">จัดการหน่วยงานระดับสูง</h1>
              <p className="text-slate-600 font-bold text-sm">ตั้งค่าสิทธิ์ รหัสเข้าใช้งาน และสถานะหน่วยงาน</p>
            </div>
          </header>
            
          <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 z-20" size={18} />
              <input 
                type="text" 
                className="input input-bordered w-full h-12 !pl-11 pr-4 !bg-white !text-slate-900 !rounded-full !border-slate-300 focus:!border-black shadow-sm outline-none font-bold text-base" 
                placeholder="ค้นหาหน่วยงาน..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
              />
            </div>
            <button onClick={() => fetchOrgData(searchId)} className="btn h-12 px-8 !bg-black !text-white !font-bold !rounded-full hover:!bg-slate-800 border-none shrink-0 transition-all">
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
            </button>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-5 px-1">ผลการค้นหา</h3>
            {cases.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-4">
                {cases.map((item) => {
                  const isSelected = orgId === item.org_id;
                  return (
                    <div 
                      key={item.org_id} 
                      onClick={() => { 
                        if (isSelected) {
                          setOrgId(""); setOrgName(""); setLogoPreview(null);
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
                      className={`relative !bg-white rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 border-2 flex flex-col ${
                        isSelected 
                          ? '!border-black shadow-xl scale-[1.02] z-10' 
                          : '!border-white shadow-sm hover:!border-slate-200'
                      } ${item.is_deleted ? 'opacity-75' : ''}`}
                    >
                      <div className="h-28 w-full !bg-[#f8fafc] flex items-center justify-center relative overflow-hidden">
                        <img src={item.logo_url} className={`w-full h-full object-cover ${item.is_deleted ? 'grayscale' : ''}`} alt="Logo" />
                        {item.is_deleted && (
                          <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-black tracking-widest">DELETED</span>
                          </div>
                        )}
                        {isSelected && !item.is_deleted && (
                          <div className="absolute top-3 right-3 bg-black text-white rounded-full p-1.5 shadow-lg z-10">
                            <CheckCircle2 size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1 !text-slate-900">
                        <h4 className="font-bold text-base truncate mb-2 tracking-tight">{item.org_name}</h4>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="text-slate-600 font-bold text-xs">ID: {item.org_id}</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? '!bg-black !text-white' : '!bg-slate-100 !text-slate-500'}`}>
                            <ChevronRight size={14} strokeWidth={4} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="!bg-white rounded-[2rem] border-2 border-dashed border-slate-300 py-16 flex flex-col items-center justify-center text-slate-400">
                <MousePointerClick size={40} className="mb-4 opacity-50" />
                <p className="font-bold text-base uppercase tracking-widest">ไม่พบข้อมูลหน่วยงาน</p>
              </div>
            )}
          </div>

          {orgId && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="!bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-white">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="relative shrink-0 mx-auto md:mx-0">
                    <div className="w-32 h-32 !bg-slate-50 rounded-[2.5rem] flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner">
                      {logoPreview ? (
                        <img src={logoPreview} className="w-full h-full object-cover" alt="Preview" />
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
                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={orgName} 
                            onChange={(e) => setOrgName(e.target.value)} 
                            className="input input-bordered flex-1 rounded-2xl font-bold !bg-white !text-slate-900 border-slate-200 focus:!border-black transition-all text-base" 
                        />
                        <button 
                            onClick={() => setUpdateModal({ show: true, type: 'name', title: 'ชื่อหน่วยงาน', newValue: orgName, reason: "" })}
                            className="btn !bg-black !text-white rounded-2xl border-none shadow-md hover:scale-105 active:scale-95 transition-all"
                        >
                            <Save size={18}/>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                        <label className="text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Staff Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-base font-bold text-blue-700 break-all">{staffCode}</code>
                          <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-2 !bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:border-black shadow-sm transition-all"><Copy size={16}/></button>
                        </div>
                      </div>
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all hover:bg-white">
                        <label className="text-xs font-black text-slate-600 uppercase block mb-1 tracking-widest px-1">Admin Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-base font-bold text-red-700 break-all">{adminCode}</code>
                          <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-2 !bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-black hover:border-black shadow-sm transition-all"><Copy size={16}/></button>
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
                  {/* เปลี่ยน Toggle เป็นสีเขียวเข้มแบบในรูป */}
                  <input 
                    type="checkbox" 
                    className="toggle !bg-[#00945e] border-[#00945e]" 
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
                    className="toggle toggle-info" 
                    checked={isOfficial} 
                    onChange={(e) => setUpdateModal({ show: true, type: 'official', title: 'สถานะ Official', newValue: e.target.checked, reason: "" })} 
                  />
                </div>
              </div>

              {/* ส่วน Staff List ที่แก้ไขขอบบนและสีสถานะ */}
              <div className="!bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border-2 border-white">
                <div className="flex items-center justify-between mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><UserCheck size={20} /></div>
                    <div>
                      <p className="font-bold text-base !text-slate-900 uppercase tracking-tight">รายชื่อเจ้าหน้าที่</p>
                      <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">ผู้ดูแลระบบประจำหน่วยงาน</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold bg-slate-200 px-4 py-1.5 rounded-full text-slate-800 uppercase tracking-widest">{staffMockup.length} คน</span>
                </div>
                
                {/* เพิ่ม pt-10 เผื่อระยะเวลา Hover ยกตัวการ์ด */}
                <div className="flex gap-6 overflow-x-auto pt-10 pb-6 px-1 snap-x scroll-smooth qr-gallery-scrollbar">
                  {staffMockup.map((staff) => (
                    <div 
                      key={staff.id} 
                      className="snap-center min-w-[260px] bg-white rounded-[2.8rem] p-7 border border-slate-200 pop-card flex flex-col items-center transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl group"
                    >
                      <div className="relative mb-5">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-[6px] border-white shadow-xl transition-all duration-500 group-hover:scale-105">
                          <img src={staff.img} className="w-full h-full object-cover" alt={staff.name} />
                        </div>
                        {/* สถานะ Online สีเขียวแบบในรูปตัวอย่างที่ส่งมา */}
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-[#00945e] border-4 border-white rounded-full shadow-lg"></div>
                      </div>

                      <h4 className="font-bold text-lg text-slate-900 mb-1 tracking-tight">{staff.name}</h4>
                      
                      <div className={`flex items-center gap-1.5 mb-6 px-4 py-1.5 rounded-full border shadow-sm ${
                        staff.role === 'Super Admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 
                        staff.role === 'Manager' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                        'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        <Shield size={12} strokeWidth={4} />
                        <span className="text-xs font-bold uppercase tracking-widest">{staff.role}</span>
                      </div>
                      
                      <div className="w-full space-y-3 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-3 text-slate-700 hover:text-black transition-colors cursor-pointer group/item">
                          <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 group-hover/item:border-black transition-all"><Phone size={16} strokeWidth={2.5} /></div>
                          <span className="text-sm font-bold tracking-wide">{staff.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 hover:text-black transition-colors cursor-pointer group/item">
                          <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 group-hover/item:border-black transition-all"><Mail size={16} strokeWidth={2.5} /></div>
                          <span className="text-sm font-bold tracking-wide truncate max-w-[150px]">{staff.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="!bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border-2 border-white overflow-hidden">
                <div className="flex items-center justify-between mb-8 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-200"><QrCode size={20} /></div>
                    <div>
                      <p className="font-bold text-base !text-slate-900 uppercase tracking-tight">QR CODE ทั้งหมดของหน่วยงาน</p>
                      <p className="text-sm text-slate-600 font-bold uppercase tracking-widest">จุดรับแจ้งเหตุที่บันทึกไว้</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setQrText("สแกนเพื่อแจ้งเหตุ"); setShowQrEditor(true); }}
                    className="btn btn-sm !bg-slate-900 hover:!bg-black !text-white rounded-full px-6 border-none font-bold text-xs h-10 shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                  >
                    <Plus size={16} className="mr-1" strokeWidth={3} /> เพิ่ม QR ใหม่
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

                        <h4 className="text-base font-bold text-slate-900 mb-0.5 text-center leading-tight px-2 tracking-tight">{qr.label}</h4>
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

              <div className="flex gap-4 pt-4">
                {cases.find(c => c.org_id === orgId)?.is_deleted ? (
                  <button 
                    onClick={() => setUpdateModal({ 
                      show: true, 
                      type: 'restore', 
                      title: 'กู้คืนหน่วยงาน', 
                      newValue: true, 
                      reason: "" 
                    })} 
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
          )}
        </div>
      </div>

      {/* --- QR EDITOR MODAL --- */}
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

      {/* UPDATE MODAL */}
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

      {/* DELETE MODAL */}
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

      {/* QR ZOOM MODAL */}
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