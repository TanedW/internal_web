'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Copy, 
  QrCode, Trash2, FileSpreadsheet, ShieldCheck,
  RefreshCcw
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
  const [logoFile, setLogoFile] = useState(null);
  const [updateDescription, setUpdateDescription] = useState("");
  const [selectedImageToReplace, setSelectedImageToReplace] = useState(null);

  const [staffCode, setStaffCode] = useState("-");
  const [adminCode, setAdminCode] = useState("-");
  const [isCsvEnabled, setIsCsvEnabled] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 
  const API_URL_MANAGE = process.env.NEXT_PUBLIC_DB_MANAGE_ORG_API_URL || "";
  const uploadApiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL;

  // 1. ฟังก์ชันสำหรับการอัปเดตข้อมูล (PUT)
  const handleUpdate = async () => {
    if (!orgId) return;

    const currentOrgData = cases.find(item => item.org_id === orgId);
    const rawAdminId = localStorage.getItem('current_admin_id');  
    const adminId = rawAdminId ? rawAdminId.replace(/"/g, '') : null;

    if (!adminId) {
      alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");
      return;
    }

    if (!updateDescription.trim()) {
      alert("กรุณาระบุรายละเอียดการแก้ไขเพื่อบันทึก Log");
      return;
    }

    setIsSearching(true);
    try {
      let currentPhotoUrl = selectedImageToReplace?.url;
      if (logoFile) {
        const base64Image = await fileToBase64(logoFile);
        const response = await fetch(uploadApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder_path: `attachment/org_${orgId}`, image: base64Image }), 
        });
        const result = await response.json();
        if (response.ok && result.photo_link) currentPhotoUrl = result.photo_link;
      }
      
      const response = await fetch(`${API_URL_MANAGE}?id=${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_admin_id: adminId,
          name: orgName,
          file_url: currentPhotoUrl,
          official_group: isOfficial,
          download_csv: isCsvEnabled,
          old_official: currentOrgData?.is_official,
          old_download: currentOrgData?.allow_csv,
          old_name: currentOrgData?.org_name,
          old_url: selectedImageToReplace?.url,
          restore: false, 
          description: updateDescription
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("อัปเดตข้อมูลหน่วยงานสำเร็จ");
        setUpdateDescription("");
        await fetchOrgData(searchId); 
      } else {
        alert("เกิดข้อผิดพลาด: " + (result.message || result.error));
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsSearching(false);
    }
  };

  // 2. ฟังก์ชันสำหรับการลบหน่วยงาน (DELETE)
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

  // 3. ฟังก์ชันสำหรับการกู้คืนหน่วยงาน (RESTORE)
  const handleRestore = async () => {
    if (!orgId) return;

    if (!updateDescription.trim()) {
      alert("กรุณาระบุรายละเอียดในช่อง 'Admin Log' เพื่อกู้คืนข้อมูล");
      return;
    }

    const rawAdminId = localStorage.getItem('current_admin_id');
    const adminId = rawAdminId ? rawAdminId.replace(/"/g, '') : null;

    setIsSearching(true);
    try {
      const response = await fetch(`${API_URL_MANAGE}?id=${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_admin_id: adminId,
          restore: true, // ส่ง flag เพื่อให้ API ทำการเคลียร์ deleted_at
          description: updateDescription
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("กู้คืนหน่วยงานสำเร็จ");
        setUpdateDescription("");
        await fetchOrgData(searchId);
      } else {
        alert("เกิดข้อผิดพลาด: " + (result.message || result.error));
      }
    } catch (error) {
      alert("Restore error: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

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
          admin_codes: item.admin_codes || []
        })));
      } else {
        setCases([]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally { setIsSearching(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("คัดลอกรหัสแล้ว: " + text);
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
            
          <div className="flex items-center gap-2 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 z-20" size={18} />
              <input 
                type="text" 
                className="input input-bordered w-full h-12 !pl-11 pr-4 !bg-white !text-slate-900 !rounded-full !border-slate-200 focus:!border-black shadow-[0_0_20px_rgba(0,0,0,0.03)] outline-none font-bold text-sm" 
                placeholder="ค้นหาหน่วยงาน..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
              />
            </div>
            <button onClick={() => fetchOrgData(searchId)} className="btn h-12 px-6 !bg-black !text-white !font-bold !rounded-full hover:!bg-slate-800 border-none">
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
            </button>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 px-1">ผลการค้นหา</h3>
            <br />
            {cases.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 sm:gap-6">
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
                          setSelectedImageToReplace({ url: item.logo_url });
                          setIsOfficial(item.is_official); 
                          setIsCsvEnabled(item.allow_csv);
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
                          ? '!border-black shadow-[0_0_30px_rgba(0,0,0,0.12)] scale-[1.03] z-10' 
                          : '!border-white shadow-[0_0_20px_rgba(0,0,0,0.06)] hover:shadow-[0_0_25px_rgba(0,0,0,0.1)] hover:!border-slate-100'
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
              <div className="!bg-white rounded-[2.5rem] p-8 shadow-[0_0_40px_rgba(0,0,0,0.04)] border-2 border-white">
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
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => { 
                          const file = e.target.files[0]; 
                          if (file) { 
                            setLogoFile(file); 
                            const reader = new FileReader(); 
                            reader.onloadend = () => setLogoPreview(reader.result); 
                            reader.readAsDataURL(file); 
                          } 
                        }} 
                      />
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ชื่อหน่วยงาน</label>
                      <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input input-bordered w-full rounded-2xl font-bold !bg-white !text-slate-900 border-slate-200 focus:!border-black" />
                    </div>

                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Staff Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-bold text-blue-600 break-all">{staffCode}</code>
                          <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-2 !bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-black transition-colors shadow-sm">
                            <Copy size={16}/>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Admin Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm font-bold text-red-600 break-all">{adminCode}</code>
                          <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-2 !bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-black transition-colors shadow-sm">
                            <Copy size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="!bg-white p-6 rounded-[2rem] shadow-[0_0_20px_rgba(0,0,0,0.03)] border-2 border-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><FileSpreadsheet size={20}/></div>
                    <div className="leading-tight">
                      <p className="font-bold text-sm !text-slate-900">การส่งออก CSV</p>
                      <p className="text-[10px] text-slate-400 font-bold">อนุญาตให้ดาวน์โหลดรายงาน</p>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle toggle-success" checked={isCsvEnabled} onChange={(e) => setIsCsvEnabled(e.target.checked)} />
                </div>

                <div className="!bg-white p-6 rounded-[2rem] shadow-[0_0_20px_rgba(0,0,0,0.03)] border-2 border-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20}/></div>
                    <div className="leading-tight">
                      <p className="font-bold text-sm !text-slate-900">Official Account</p>
                      <p className="text-[10px] text-slate-400 font-bold">ยืนยันตัวตนหน่วยงานทางการ</p>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle toggle-info" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} />
                </div>
              </div>
              
              {/* QR Section */}
              <div className="!bg-white p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.03)] border-2 border-white">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode size={20} className="text-slate-400" />
                  <p className="font-bold text-sm !text-slate-900">QR Code สำหรับแจ้งเหตุ</p>
                </div>
                <div className="flex flex-nowrap items-center gap-4 sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 !bg-white border-2 border-slate-100 rounded-2xl p-2 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/@org_${orgId}`} 
                      alt="QR" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
           
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold mb-2 truncate">ลิงก์แจ้งเหตุประจำหน่วยงาน</p><br></br>
                    <button className="btn btn-sm btn-outline rounded-full text-[9px] sm:text-[10px] font-bold !bg-white !text-slate-600 border-slate-200 hover:!border-black transition-colors whitespace-nowrap">
                      ดาวน์โหลดไฟล์ QR
                    </button>
                  </div>
                </div>
              </div>

              <div className="!bg-white p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.03)] border-2 border-white">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={20} className="text-slate-400" />
                  <p className="font-bold text-sm !text-slate-900">บันทึกรายละเอียดการแก้ไข (Admin Log)</p>
                </div>
                <textarea 
                  className="textarea textarea-bordered w-full rounded-2xl min-h-[80px] font-bold text-sm !bg-white !text-slate-900 border-slate-200 focus:!border-black outline-none shadow-sm" 
                  placeholder="ระบุเหตุผล เช่น 'กู้คืนข้อมูลหน่วยงานเนื่องจาก...' หรือ 'เปิดสิทธิ์ CSV'"
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {cases.find(c => c.org_id === orgId)?.is_deleted ? (
                  <button 
                    onClick={handleRestore}
                    className="btn flex-1 h-14 !rounded-2xl !bg-indigo-600 hover:!bg-indigo-700 !text-white !border-none font-bold shadow-lg transition-all"
                  >
                    <RefreshCcw size={18} className={isSearching ? "animate-spin" : ""} /> กู้คืนหน่วยงาน
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="btn flex-1 h-14 !rounded-2xl !bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-100 font-bold transition-all"
                  >
                    <Trash2 size={18} /> ลบหน่วยงาน
                  </button>
                )}
                <button 
                  onClick={handleUpdate}
                 
                  disabled={isSearching || !updateDescription.trim()}
                  className={`btn flex-1 h-14 !rounded-2xl !text-white !border-none font-bold transition-all ${
                    (isSearching || !updateDescription.trim()) 
                      ? '!bg-slate-300 !cursor-not-allowed shadow-none'
                      : '!bg-[#16a34a] hover:!bg-[#15803d] shadow-[0_0_20px_rgba(22,163,74,0.2)]' 
                  }`}
                >
                  {isSearching ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {cases.find(c => c.org_id === orgId)?.is_deleted ? "อัปเดตและกู้คืน" : "ยืนยันการอัปเดตทั้งหมด"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="!bg-white w-full max-w-md rounded-[2.5rem] p-8 border-2 border-white shadow-[0_0_60px_rgba(0,0,0,0.15)] animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
            <h3 className="text-xl font-bold text-center mb-2 !text-slate-900">ยืนยันการลบหน่วยงาน?</h3>
            <p className="text-slate-500 text-sm text-center mb-6 font-bold">ข้อมูลจะถูกซ่อนจากระบบ แต่สามารถกู้คืนได้ภายหลังโดย Admin</p>
            <textarea className="textarea textarea-bordered w-full rounded-2xl min-h-[100px] mb-6 font-bold text-sm !bg-white !text-slate-900 border-slate-200 focus:!border-red-500 outline-none shadow-sm" placeholder="ระบุสาเหตุ..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}></textarea>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-xl font-bold !bg-slate-100 border-none !text-slate-600 hover:!bg-slate-200">ยกเลิก</button>
              <button onClick={() => handleDelete()} className="btn flex-1 rounded-xl !bg-red-600 !text-white hover:!bg-red-700 border-none font-bold shadow-lg">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}