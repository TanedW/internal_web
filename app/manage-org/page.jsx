'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Copy, 
  QrCode, Trash2, FileSpreadsheet, ShieldCheck,
  RefreshCcw, X, ImageOff, Download, Info,
  Maximize2, Save
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
  
  // Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false); 
  const [deleteReason, setDeleteReason] = useState("");
  
  // New: Update Modal State
  const [updateModal, setUpdateModal] = useState({
    show: false,
    type: "", // 'name', 'logo', 'csv', 'official'
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

  // ฟังก์ชันหลักในการอัปเดตแยกส่วน
  // ฟังก์ชันหลักในการอัปเดตแยกส่วน รวมถึงการ Restore
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
        restore: false // ค่าเริ่มต้นเป็น false
      };

      // จัดการ Payload ตามประเภทการแก้ไข
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
        // ส่วนที่ปรับปรุง: ให้ทำงานเหมือนไฟล์ที่แนบมา
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

  return (
    <div data-theme="light" className="min-h-screen !bg-[#F4F6F8] !text-slate-900 font-sans pb-20">
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
              
              <div className="!bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border-2 border-white">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode size={20} className="text-slate-400" />
                  <p className="font-bold text-sm !text-slate-900">QR CODE สำหรับแจ้งเหตุ</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                  <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
                    {qrReportUrl ? (
                      <div className="w-full h-full bg-white border border-slate-100 rounded-[1.8rem] p-4 shadow-sm group cursor-pointer overflow-hidden" onClick={() => setShowQrModal(true)}>
                        <img src={qrReportUrl} alt="QR" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.8rem] flex flex-col items-center justify-center gap-2">
                        <ImageOff size={28} className="text-slate-200" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-6 text-center sm:text-left">
                    {qrReportUrl ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900 opacity-70">พร้อมสำหรับการใช้งานและดาวน์โหลด</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button onClick={() => setShowQrModal(true)} className="btn btn-md sm:btn-sm h-12 sm:h-10 px-6 !bg-[#0f172a] !text-white !rounded-full !border-none font-bold text-[11px] active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto shadow-md">
                            <Maximize2 size={16} strokeWidth={2.5} /> ดูภาพขยาย
                          </button>
                          <button onClick={() => handleDownloadQR(qrReportUrl, orgName)} className="btn btn-md sm:btn-sm h-12 sm:h-10 px-6 !bg-white !text-slate-900 !border-slate-300 !rounded-full font-bold text-[11px] border-2 flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm hover:!bg-slate-50 transition-all">
                            <Download size={16} strokeWidth={3} className="text-slate-600" /> ดาวน์โหลด QR CODE
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-red-50 rounded-full border border-red-100 shadow-sm mx-auto sm:mx-0">
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                           <span className="text-[11px] font-bold text-red-600 uppercase tracking-tight">หน่วยงานนี้ไม่มี QR Code ในระบบ</span>
                        </div>
                        <div className="flex items-start gap-2 max-w-sm mx-auto sm:mx-0">
                           <Info size={14} className="text-slate-300 mt-0.5 shrink-0" />
                           <p className="text-[10px] font-bold text-slate-400 leading-relaxed text-left">ยังไม่มีการสร้างลิงก์สำหรับหน่วยงานนี้ กรุณาตรวจสอบข้อมูลในฐานข้อมูล</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ปุ่มลบด้านล่าง (คงไว้แต่ลบปุ่มยืนยันรวมออก) */}
              <div className="flex pt-2">
  {cases.find(c => c.org_id === orgId)?.is_deleted ? (
    // ปุ่ม Restore แบบใหม่: เปิด Modal แทน
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

      {/* Modal ยืนยันการแก้ไขรายส่วน (Universal Update Modal) */}
      {updateModal.show && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="!bg-white w-full max-w-md rounded-[2.5rem] p-8 border-2 border-white shadow-2xl animate-in zoom-in duration-300">
      <div className={`w-16 h-16 ${updateModal.type === 'restore' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <AlertCircle size={32} />
      </div>
      <h3 className="text-xl font-bold text-center mb-2 !text-slate-900">ยืนยัน{updateModal.title}?</h3>
      <p className="text-slate-500 text-sm text-center mb-6 font-bold">
          {updateModal.type === 'restore' ? "ข้อมูลจะกลับมาแสดงผลในระบบตามปกติ" : "กรุณาระบุรายละเอียดการแก้ไขเพื่อบันทึก Log"}
      </p>
      <textarea 
          className="textarea textarea-bordered w-full rounded-2xl min-h-[100px] mb-6 font-bold text-sm !bg-white !text-slate-900 border-slate-200 focus:!border-black outline-none shadow-sm" 
          placeholder="ระบุเหตุผลในการดำเนินการ..." 
          value={updateModal.reason} 
          onChange={(e) => setUpdateModal({...updateModal, reason: e.target.value})}
      ></textarea>
      <div className="flex gap-3">
        <button 
          onClick={() => setUpdateModal({ show: false, type: "", title: "", newValue: null, reason: "" })} 
          className="btn flex-1 rounded-xl font-bold !bg-slate-100 border-none !text-slate-600 h-12"
        >
          ยกเลิก
        </button>
        <button 
          onClick={handleIndividualUpdate} 
          disabled={isSearching || !updateModal.reason.trim()}
          className={`btn flex-1 rounded-xl !text-white border-none font-bold shadow-lg h-12 ${
            updateModal.type === 'restore' ? '!bg-indigo-600 hover:!bg-indigo-700' : '!bg-black hover:!bg-slate-800'
          }`}
        >
          {isSearching ? <Loader2 className="animate-spin" /> : "ยืนยัน"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal ยืนยันการลบ */}
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

      {/* Pop-up ดู QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowQrModal(false)}>
          <div className="relative !bg-white p-6 sm:p-8 rounded-[2.8rem] max-w-sm w-full shadow-2xl animate-in zoom-in duration-500 border-4 border-white/50" onClick={(e) => e.stopPropagation()} >
            <button onClick={() => setShowQrModal(false)} className="absolute top-5 right-5 w-10 h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90">
              <X size={24} strokeWidth={3} />
            </button>
            <div className="text-center mb-6 mt-4">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight uppercase px-8">QR CODE สำหรับแจ้งเหตุ</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 px-8 truncate opacity-60">{orgName}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-[2.2rem] p-5 shadow-inner mb-8">
              <div className="bg-white rounded-[1.5rem] p-3 shadow-sm">
                <img src={qrReportUrl} className="w-full h-auto object-contain" alt="QR Large" />
              </div>
            </div>
            <button onClick={() => handleDownloadQR(qrReportUrl, orgName)} className="btn w-full h-14 !bg-[#0f172a] !text-white !rounded-2xl font-black border-none shadow-xl hover:!bg-black transition-all flex items-center justify-center gap-3 text-xs uppercase">
              <Download size={20} strokeWidth={3} /> ดาวน์โหลด QR CODE
            </button>
          </div>
        </div>
      )}
    </div> 
  );
}
