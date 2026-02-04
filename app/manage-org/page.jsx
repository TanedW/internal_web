'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Copy, 
  QrCode, Trash2, RefreshCcw, FileSpreadsheet, ShieldCheck
} from "lucide-react";

// Helper function
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [cases, setCases] = useState([]); 
  const [orgId, setOrgId] = useState("");      
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [selectedImageToReplace, setSelectedImageToReplace] = useState(null);

  // New States for requested features
  const [staffCode, setStaffCode] = useState("ST-123456"); // Mock data
  const [adminCode, setAdminCode] = useState("AD-987654"); // Mock data
  const [isCsvEnabled, setIsCsvEnabled] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 
  const uploadApiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL;
  const dbManageUrl = process.env.NEXT_PUBLIC_DB_MANAGE_ORG_API_URL;

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
          is_deleted: item.is_deleted || false, // สมมติว่า API คืนสถานะลบมาให้
          is_official: item.is_official || false,
          allow_csv: item.allow_csv || false
        })));
      } else {
        setCases([]);
      }
    } catch (e) {
      // Mock data สำหรับทดสอบ UI
      setCases([{ 
        org_id: "1", 
        org_name: "หน่วยงานทดสอบ (ถูกลบ)", 
        logo_url: "https://via.placeholder.com/150",
        is_deleted: true,
        is_official: true,
        allow_csv: false
      }]);
    } finally { setIsSearching(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("คัดลอกรหัสแล้ว: " + text);
  };

  const handleSoftDelete = async () => {
    if (!deleteReason) return alert("กรุณาระบุเหตุผลการลบ");
    // logic call API delete with reason
    console.log("Deleting org:", orgId, "Reason:", deleteReason);
    alert("ลบหน่วยงานสำเร็จ");
    setShowDeleteModal(false);
    setDeleteReason("");
    fetchOrgData(searchId);
  };

  const handleRestore = async (id) => {
    // logic call API restore
    alert("คืนค่าหน่วยงานรหัส " + id + " สำเร็จ");
    fetchOrgData(searchId);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-20">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>
      
      <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        
        <div className="max-w-3xl mx-auto">
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg"><Building2 size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">จัดการหน่วยงานระดับสูง</h1>
              <p className="text-slate-500 font-bold text-xs">ตั้งค่าสิทธิ์ รหัสเข้าใช้งาน และสถานะหน่วยงาน</p>
            </div>
          </header>
            
          {/* Search Box */}
          <div className="flex items-center gap-2 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-20" size={18} />
              <input 
                type="text" 
                className="input input-ghost w-full h-12 !pl-11 pr-4 !bg-white !rounded-full !border !border-slate-200 focus:!border-black shadow-sm outline-none font-bold text-sm" 
                placeholder="ค้นหาด้วยชื่อหรือรหัสหน่วยงาน..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
              />
            </div>
            <button onClick={() => fetchOrgData(searchId)} className="btn h-12 px-6 !bg-black !text-white !font-bold !rounded-full hover:!bg-slate-800 border-none">
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
            </button>
          </div>

          {/* Result Grid */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 px-1">ผลการค้นหา</h3>
            {cases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cases.map((item) => (
                  <div 
                    key={item.org_id} 
                    onClick={() => { 
                      setOrgId(item.org_id); 
                      setOrgName(item.org_name); 
                      setLogoPreview(item.logo_url);
                      setIsOfficial(item.is_official);
                      setIsCsvEnabled(item.allow_csv);
                      setSelectedImageToReplace({ url: item.logo_url });
                    }} 
                    className={`relative p-4 bg-white rounded-3xl cursor-pointer transition-all border-2 flex items-center gap-4 ${
                      orgId === item.org_id ? 'border-black shadow-lg scale-[1.02]' : 'border-slate-100 hover:border-slate-300'
                    } ${item.is_deleted ? 'opacity-75 bg-slate-50' : ''}`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.logo_url} className="w-10 h-10 object-contain" alt="Logo" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm truncate">{item.org_name}</h4>
                        {item.is_deleted && <span className="badge badge-error badge-xs text-[8px] text-white">DELETED</span>}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">ID: {item.org_id}</p>
                    </div>
                    {item.is_deleted && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRestore(item.org_id); }}
                        className="btn btn-circle btn-sm bg-blue-500 hover:bg-blue-600 border-none text-white"
                      >
                        <RefreshCcw size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200 py-12 flex flex-col items-center justify-center text-slate-400">
                <MousePointerClick size={32} className="mb-3 opacity-20" /><p className="font-bold text-sm">ไม่พบข้อมูลหน่วยงาน</p>
              </div>
            )}
          </div>

          {/* Edit Form */}
          {orgId && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Main Info & Logo */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="relative shrink-0 mx-auto md:mx-0">
                    <div className="w-32 h-32 bg-slate-50 rounded-3xl flex items-center justify-center p-4 border-2 border-slate-100 shadow-inner">
                      {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain" /> : <ImageIcon size={32} className="text-slate-300" />}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-black text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer border-4 border-white">
                      <Upload size={18} />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {}} />
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ชื่อหน่วยงาน</label>
                      <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input input-bordered w-full rounded-2xl font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Staff Code</label>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-bold text-blue-600">{staffCode}</code>
                          <button onClick={() => copyToClipboard(staffCode)} className="text-slate-400 hover:text-black"><Copy size={16}/></button>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-2">Admin Code</label>
                        <div className="flex items-center justify-between">
                          <code className="text-sm font-bold text-red-600">{adminCode}</code>
                          <button onClick={() => copyToClipboard(adminCode)} className="text-slate-400 hover:text-black"><Copy size={16}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><FileSpreadsheet size={20}/></div>
                    <div>
                      <p className="font-bold text-sm">การส่งออก CSV</p>
                      <p className="text-[10px] text-slate-400 font-bold">อนุญาตให้ดาวน์โหลดรายงาน</p>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle toggle-success" checked={isCsvEnabled} onChange={(e) => setIsCsvEnabled(e.target.checked)} />
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><ShieldCheck size={20}/></div>
                    <div>
                      <p className="font-bold text-sm">Official Account</p>
                      <p className="text-[10px] text-slate-400 font-bold">ยืนยันตัวตนหน่วยงานทางการ</p>
                    </div>
                  </div>
                  <input type="checkbox" className="toggle toggle-info" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} />
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-white p-6 rounded-[2rem] shadow-md border border-slate-100">
                 <div className="flex items-center gap-3 mb-4">
                    <QrCode size={20} className="text-slate-400" />
                    <p className="font-bold text-sm">QR Code สำหรับแจ้งเหตุ</p>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white border-2 border-slate-100 rounded-2xl p-2">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/@org_${orgId}`} alt="QR" className="w-full h-full" />
                    </div>
                    <div className="flex-1">
                       <p className="text-xs text-slate-500 font-bold mb-2">ลิงก์แจ้งเหตุประจำหน่วยงาน</p>
                       <button className="btn btn-sm btn-outline rounded-full text-[10px] font-bold">ดาวน์โหลดไฟล์ QR</button>
                    </div>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="btn flex-1 h-14 !rounded-2xl !bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-100 font-bold"
                >
                  <Trash2 size={18} /> ลบหน่วยงาน
                </button>
                <button 
                  className="btn flex-[2] h-14 !rounded-2xl !bg-green-600 hover:!bg-green-700 !text-white !border-none font-bold shadow-lg shadow-green-200"
                >
                  <CheckCircle2 size={18} /> ยืนยันการอัปเดตทั้งหมด
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">ยืนยันการลบหน่วยงาน?</h3>
            <p className="text-slate-500 text-sm text-center mb-6 font-bold">ข้อมูลจะถูกซ่อนจากระบบ แต่สามารถกู้คืนได้ภายหลังโดยแอดมิน</p>
            
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">เหตุผลการลบ (จำเป็น)</label>
            <textarea 
              className="textarea textarea-bordered w-full rounded-2xl min-h-[100px] mb-6 font-bold text-sm focus:border-red-500"
              placeholder="ระบุสาเหตุ เช่น ปิดทำการ, ซ้ำซ้อน..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            ></textarea>

            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-xl font-bold">ยกเลิก</button>
              <button onClick={handleSoftDelete} className="btn flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700 border-none font-bold">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}