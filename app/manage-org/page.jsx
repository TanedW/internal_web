'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Copy, 
  QrCode, Trash2, FileSpreadsheet, ShieldCheck,
  RefreshCcw, X, ImageOff, Download, Info,
  Maximize2, Save, Plus, PencilLine
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
    if (!orgId || !updateModal.reason.trim()) {
      alert("กรุณาระบุเหตุผลการแก้ไข");
      return;
    }
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
    if (!orgId || !deleteReason.trim()) {
      alert("กรุณาระบุสาเหตุการลบ");
      return;
    }
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
    <div data-theme="light" className="min-h-screen !bg-[#F4F6F8] !text-slate-900 font-sans pb-20">
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .qr-gallery-scrollbar::-webkit-scrollbar { height: 8px; }
        .qr-gallery-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .qr-gallery-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      
      <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        
        <div className="max-w-2xl mx-auto px-4">
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg"><Building2 size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">จัดการหน่วยงานระดับสูง</h1>
              <p className="text-slate-500 font-bold text-xs">ตั้งค่าสิทธิ์ รหัสเข้าใช้งาน และสถานะหน่วยงาน</p>
            </div>
          </header>
            
          <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 z-20" size={18} />
              <input 
                type="text" 
                className="input input-bordered w-full h-12 !pl-11 pr-4 !bg-white !text-slate-900 !rounded-full !border-slate-200 focus:!border-black shadow-sm outline-none font-bold text-sm" 
                placeholder="ค้นหาหน่วยงาน..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
              />
            </div>
            <button onClick={() => fetchOrgData(searchId)} className="btn h-12 px-8 !bg-black !text-white !font-bold !rounded-full hover:!bg-slate-800 border-none shrink-0">
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
            </button>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 px-1">ผลการค้นหา</h3>
            {cases.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
                          ? '!border-black shadow-lg scale-[1.02] z-10' 
                          : '!border-white shadow-sm hover:!border-slate-100'
                      } ${item.is_deleted ? 'opacity-75' : ''}`}
                    >
                      <div className="h-28 w-full !bg-[#f8fafc] flex items-center justify-center relative overflow-hidden">
                        <img src={item.logo_url} className={`w-full h-full object-cover ${item.is_deleted ? 'grayscale' : ''}`} alt="Logo" />
                        {item.is_deleted && (
                          <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                            <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-black">DELETED</span>
                          </div>
                        )}
                        {isSelected && !item.is_deleted && (
                          <div className="absolute top-3 right-3 bg-black text-white rounded-full p-1 shadow-lg z-10">
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1 !text-slate-900">
                        <h4 className="font-bold text-sm truncate mb-2">{item.org_name}</h4>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2">
                          <span className="text-slate-500 !bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold tracking-tight">ID: {item.org_id}</span>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isSelected ? '!bg-black !text-white' : '!bg-slate-100 !text-slate-400'}`}>
                            <ChevronRight size={12} strokeWidth={4} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="!bg-white rounded-[2rem] border-2 border-dashed border-slate-200 py-12 flex flex-col items-center justify-center text-slate-400">
                <MousePointerClick size={32} className="mb-3 opacity-20" />
                <p className="font-bold text-sm">ไม่พบข้อมูลหน่วยงาน</p>
              </div>
            )}
          </div>

          {orgId && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* ข้อมูลหน่วยงาน */}
              <div className="!bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-white">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="relative shrink-0 mx-auto md:mx-0">
                    <div className="w-32 h-32 !bg-slate-50 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-slate-100 shadow-inner">
                      {logoPreview ? (
                        <img src={logoPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <ImageIcon size={32} className="text-slate-300" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-transform">
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
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ชื่อหน่วยงาน</label>
                      <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={orgName} 
                            onChange={(e) => setOrgName(e.target.value)} 
                            className="input input-bordered flex-1 rounded-2xl font-bold !bg-white !text-slate-900 border-slate-200 focus:!border-black" 
                        />
                        <button 
                            onClick={() => setUpdateModal({ show: true, type: 'name', title: 'ชื่อหน่วยงาน', newValue: orgName, reason: "" })}
                            className="btn !bg-black !text-white rounded-2xl border-none shadow-md"
                        >
                            <Save size={18}/>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Staff Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-bold text-blue-600 break-all">{staffCode}</code>
                          <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-2 !bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-black shadow-sm"><Copy size={14}/></button>
                        </div>
                      </div>
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Admin Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-bold text-red-600 break-all">{adminCode}</code>
                          <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-2 !bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-black shadow-sm"><Copy size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* สิทธิ์การใช้งาน */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="!bg-white p-6 rounded-[2rem] shadow-sm border-2 border-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><FileSpreadsheet size={20}/></div>
                    <div>
                      <p className="font-bold text-sm !text-slate-900">การส่งออก CSV</p>
                      <p className="text-[10px] text-slate-400 font-bold">อนุญาตให้ดาวน์โหลดรายงาน</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-success" 
                    checked={isCsvEnabled} 
                    onChange={(e) => setUpdateModal({ show: true, type: 'csv', title: 'สิทธิ์ CSV', newValue: e.target.checked, reason: "" })} 
                  />
                </div>
                <div className="!bg-white p-6 rounded-[2rem] shadow-sm border-2 border-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20}/></div>
                    <div>
                      <p className="font-bold text-sm !text-slate-900">Official Account</p>
                      <p className="text-[10px] text-slate-400 font-bold">ยืนยันตัวตนทางการ</p>
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
              
              {/* คลัง QR CODE */}
              <div className="!bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border-2 border-white overflow-hidden">
                <div className="flex items-center justify-between mb-8 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100"><QrCode size={20} /></div>
                    <div>
                      <p className="font-bold text-sm !text-slate-900 uppercase tracking-tight">คลัง QR CODE ของหน่วยงาน</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">จุดรับแจ้งเหตุที่บันทึกไว้</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setQrText("สแกนเพื่อแจ้งเหตุ"); setShowQrEditor(true); }}
                    className="btn btn-sm !bg-slate-900 hover:!bg-black !text-white rounded-full px-5 border-none font-bold text-[10px] h-10 shadow-lg transition-all active:scale-95"
                  >
                    <Plus size={14} className="mr-1" /> เพิ่ม QR ใหม่
                  </button>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 px-2 qr-gallery-scrollbar">
                  {qrList.length > 0 ? (
                    qrList.map((qr) => (
                      <div key={qr.id} className="group relative min-w-[200px] bg-white rounded-[2.8rem] p-5 border-2 border-slate-50 flex flex-col items-center transition-all duration-500 hover:border-slate-100 hover:shadow-2xl">
                        <div className="w-full aspect-square bg-slate-50 rounded-[2.2rem] p-4 mb-4 shadow-inner overflow-hidden flex items-center justify-center border border-slate-100/50 relative">
                          <img src={qr.url} className="w-full h-full object-contain" alt="QR" />
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <button onClick={() => handleEditExistingQr(qr)} className="w-10 h-10 bg-white text-slate-600 rounded-full flex items-center justify-center hover:text-indigo-600 active:scale-90 transition-all shadow-sm border border-slate-200" title="แก้ไข QR"><PencilLine size={18} strokeWidth={2.5} /></button>
                          <button onClick={() => handleDownloadQR(qr.url, `${orgName}_${qr.label}`)} className="w-10 h-10 bg-white text-slate-600 rounded-full flex items-center justify-center hover:text-slate-900 active:scale-90 transition-all shadow-sm border border-slate-200" title="ดาวน์โหลด"><Download size={18} strokeWidth={2.5} /></button>
                          <button onClick={() => { setShowQrModal(true); setQrReportUrl(qr.url); }} className="w-10 h-10 bg-white text-slate-600 rounded-full flex items-center justify-center hover:text-slate-900 active:scale-90 transition-all shadow-sm border border-slate-200" title="ขยายรูป"><Maximize2 size={18} strokeWidth={2.5} /></button>
                        </div>

                        <p className="text-[11px] font-bold text-slate-800 truncate w-full text-center px-1 mb-1">{qr.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: #{qr.id}</p>
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-20 border-4 border-dashed border-slate-50 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                      <ImageOff size={56} className="mb-4 opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-40">ไม่มีรายการ QR CODE</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex pt-2">
                {cases.find(c => c.org_id === orgId)?.is_deleted ? (
                  <button 
                    onClick={() => setUpdateModal({ 
                      show: true, 
                      type: 'restore', 
                      title: 'กู้คืนหน่วยงาน', 
                      newValue: true, 
                      reason: "" 
                    })} 
                    className="btn flex-1 h-14 !rounded-2xl !bg-indigo-600 hover:!bg-indigo-700 !text-white !border-none font-bold shadow-lg transition-all"
                  >
                    <RefreshCcw size={18} className={isSearching ? "animate-spin" : ""} /> กู้คืนหน่วยงาน
                  </button>
                ) : (
                  <button onClick={() => setShowDeleteModal(true)} className="btn flex-1 h-14 !rounded-2xl !bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-100 font-bold transition-all">
                    <Trash2 size={18} /> ลบหน่วยงาน
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- [QR EDITOR MODAL: ปรับตัวหนังสือชัดขึ้นตามภาพ] --- */}
      {showQrEditor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[90vh] shadow-2xl border-4 border-white/20 relative">
            <div className="flex-1 bg-slate-100 p-8 flex items-center justify-center relative overflow-hidden">
              <div className="relative bg-white shadow-2xl p-0 rounded-2xl overflow-hidden flex flex-col items-center border border-white" 
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
                  className="font-black text-center w-full px-8 leading-tight text-slate-900"
                >
                  <span className="bg-white/95 py-2 px-4 rounded-2xl shadow-xl border border-slate-100 inline-block">
                    {qrText || "สแกนที่นี่"}
                  </span>
                </div>

                <div className="w-full h-full flex items-center justify-center p-14 bg-white">
                  <img src={qrReportUrl} className="w-full h-auto object-contain" alt="QR Preview" />
                </div>

                <div className="absolute bottom-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] z-20 opacity-50">
                  {orgName} • OFFICIAL ACCESS
                </div>
              </div>
            </div>

            {/* Sidebar Controls - ปรับขนาดและสีตัวอักษรให้ชัดเจนขึ้น */}
            <div className="w-full md:w-96 p-10 flex flex-col gap-8 overflow-y-auto scrollbar-hide border-l border-slate-100 !bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-3xl text-black">QR Creator</h3>
                  <p className="text-sm text-slate-500 font-bold mt-1">ออกแบบใบแจ้งเหตุของคุณ</p>
                </div>
                <button onClick={() => setShowQrEditor(false)} className="p-2.5 bg-slate-100 rounded-full text-slate-900 hover:text-red-500 transition-all">
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-5">
                <label className="text-sm font-black uppercase text-black flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div> 1. เลือกกรอบ (FRAME)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['none', 'bold', 'indigo', 'gold'].map(f => (
                    <button key={f} onClick={() => setSelectedFrame(f)} 
                      className={`h-14 rounded-2xl border-2 text-sm font-black uppercase transition-all flex items-center justify-center ${selectedFrame === f ? 'border-black bg-slate-900 text-white shadow-lg' : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-slate-50'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-sm font-black uppercase text-black flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div> 2. ข้อความกำกับ (CAPTION)
                </label>
                <textarea 
                  className="textarea textarea-bordered w-full rounded-2xl font-bold text-base h-32 !bg-slate-50 border-slate-200 text-black focus:ring-2 ring-black outline-none p-4 shadow-inner"
                  placeholder="สแกนเพื่อ..."
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                />
              </div>

              <div className="space-y-8">
                <label className="text-sm font-black uppercase text-black flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div> 3. การวางตำแหน่ง (LAYOUT)
                </label>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-black uppercase">
                      <span>ตำแหน่งบน-ล่าง</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{textPos}PX</span>
                    </div>
                    <input type="range" min="40" max="480" value={textPos} onChange={(e) => setTextPos(e.target.value)} className="range range-xs range-primary !bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black text-black uppercase">
                      <span>ขนาดอักษร</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{textSize}PX</span>
                    </div>
                    <input type="range" min="12" max="150" value={textSize} onChange={(e) => setTextSize(e.target.value)} className="range range-xs range-primary !bg-slate-100" />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-8 flex gap-3">
                <button className="btn btn-ghost flex-1 h-14 rounded-2xl text-slate-400 hover:text-red-500 font-bold">
                   <Trash2 size={20} />
                </button>
                <button className="btn !bg-indigo-600 hover:!bg-indigo-700 !text-white rounded-[1.5rem] h-14 border-none font-bold shadow-xl flex-[4] flex items-center justify-center gap-3 active:scale-95 transition-all text-base">
                  <Save size={20} /> บันทึกและเพิ่มเข้าคลัง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* อื่นๆ (Update, Delete, QR Modal) อยู่ครบถ้วนตามเดิม */}
      {updateModal.show && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="!bg-white w-full max-w-md rounded-[2.5rem] p-8 border-2 border-white shadow-2xl animate-in zoom-in duration-300">
            <div className={`w-16 h-16 ${updateModal.type === 'restore' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 !text-slate-900">ยืนยัน{updateModal.title}?</h3>
            <p className="text-slate-500 text-sm text-center mb-6 font-bold">{updateModal.type === 'restore' ? "ข้อมูลจะกลับมาแสดงผลในระบบตามปกติ" : "กรุณาระบุรายละเอียดการแก้ไขเพื่อบันทึก Log"}</p>
            <textarea className="textarea textarea-bordered w-full rounded-2xl min-h-[100px] mb-6 font-bold text-sm !bg-white !text-slate-900 border-slate-200 focus:!border-black outline-none shadow-sm" placeholder="ระบุเหตุผล..." value={updateModal.reason} onChange={(e) => setUpdateModal({...updateModal, reason: e.target.value})}></textarea>
            <div className="flex gap-3">
              <button onClick={() => setUpdateModal({ show: false, type: "", title: "", newValue: null, reason: "" })} className="btn flex-1 rounded-xl font-bold !bg-slate-100 border-none !text-slate-600 h-12">ยกเลิก</button>
              <button onClick={handleIndividualUpdate} disabled={isSearching || !updateModal.reason.trim()} className={`btn flex-1 rounded-xl !text-white border-none font-bold shadow-lg h-12 ${updateModal.type === 'restore' ? '!bg-indigo-600 hover:!bg-indigo-700' : '!bg-black hover:!bg-slate-800'}`}>{isSearching ? <Loader2 className="animate-spin" /> : "ยืนยัน"}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="!bg-white w-full max-w-md rounded-[2.5rem] p-8 border-2 border-white shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
            <h3 className="text-xl font-bold text-center mb-2 !text-slate-900">ยืนยันการลบหน่วยงาน?</h3>
            <p className="text-slate-500 text-sm text-center mb-6 font-bold">ข้อมูลจะถูกซ่อนจากระบบ แต่สามารถกู้คืนได้ภายหลังโดย Admin</p>
            <textarea className="textarea textarea-bordered w-full rounded-2xl min-h-[100px] mb-6 font-bold text-sm !bg-white !text-slate-900 border-slate-200 focus:!border-red-500 outline-none shadow-sm" placeholder="ระบุสาเหตุ..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}></textarea>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-xl font-bold !bg-slate-100 border-none !text-slate-600 h-12">ยกเลิก</button>
              <button onClick={() => handleDelete()} className="btn flex-1 rounded-xl !bg-red-600 !text-white hover:!bg-red-700 border-none font-bold shadow-lg h-12">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrModal(false)}>
          <div className="relative !bg-white p-6 sm:p-8 rounded-[2.8rem] max-w-sm w-full shadow-2xl animate-in zoom-in duration-500 border-4 border-white/50" onClick={(e) => e.stopPropagation()} >
            <button onClick={() => setShowQrModal(false)} className="absolute top-5 right-5 w-10 h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 z-20"><X size={24} strokeWidth={3} /></button>
            <div className="text-center mb-6 mt-4">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight uppercase px-8">QR CODE สำหรับแจ้งเหตุ</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 px-8 truncate opacity-60">{orgName}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-[2.2rem] p-5 shadow-inner mb-8">
              <div className="bg-white rounded-[1.5rem] p-3 shadow-sm"><img src={qrReportUrl} className="w-full h-auto object-contain" alt="QR Large" /></div>
            </div>
            <button onClick={() => handleDownloadQR(qrReportUrl, orgName)} className="btn w-full h-14 !bg-[#0f172a] !text-white !rounded-2xl font-black border-none shadow-xl hover:!bg-black transition-all flex items-center justify-center gap-3 text-xs uppercase"><Download size={20} strokeWidth={3} /> ดาวน์โหลด QR CODE</button>
          </div>
        </div>
      )}
    </div> 
  );
}