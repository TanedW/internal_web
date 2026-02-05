'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Copy, 
  QrCode, Trash2, FileSpreadsheet, ShieldCheck
} from "lucide-react";

export default function ManageOrgPage() {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [cases, setCases] = useState([]); 
  const [orgId, setOrgId] = useState("");       
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);

  const [staffCode, setStaffCode] = useState("ST-123456");
  const [adminCode, setAdminCode] = useState("AD-987654");
  const [isCsvEnabled, setIsCsvEnabled] = useState(false);
  const [isOfficial, setIsOfficial] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 

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
          is_deleted: item.is_deleted || false,
          is_official: item.is_official || false,
          allow_csv: item.allow_csv || false
        })));
      } else {
        setCases([]);
      }
    } catch (e) {
      setCases([{ 
        org_id: "1", 
        org_name: "หน่วยงานทดสอบระบบ", 
        logo_url: "https://via.placeholder.com/150",
        is_deleted: false,
        is_official: true,
        allow_csv: false
      }]);
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
            
          {/* Search Box */}
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

          {/* Result Grid  */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 px-1">ผลการค้นหา</h3><br></br>
            {cases.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 sm:gap-6">
                {cases.map((item) => {
                  const isSelected = orgId === item.org_id;
                  return (
                    <div 
                      key={item.org_id} 
                      onClick={() => { 
                        setOrgId(isSelected ? "" : item.org_id);
                        setOrgName(isSelected ? "" : item.org_name);
                        setLogoPreview(isSelected ? null : item.logo_url);
                        setIsOfficial(item.is_official);
                        setIsCsvEnabled(item.allow_csv);
                      }} 
  
                      className={`relative !bg-white rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 border-2 flex flex-col ${
                        isSelected 
                          ? '!border-black shadow-[0_0_30px_rgba(0,0,0,0.12)] scale-[1.03] z-10' 
                          : '!border-white shadow-[0_0_20px_rgba(0,0,0,0.06)] hover:shadow-[0_0_25px_rgba(0,0,0,0.1)] hover:!border-slate-100'
                      } ${item.is_deleted ? 'opacity-75 grayscale' : ''}`}
                    >
                      <div className="h-28 w-full !bg-[#f8fafc] flex items-center justify-center relative overflow-hidden">
                        <img src={item.logo_url} className="w-full h-full object-cover" alt="Logo" />
                        {isSelected && (
                          <div className="absolute top-3 right-3 bg-black text-white rounded-full p-1 shadow-lg animate-in zoom-in duration-300 z-10">
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

          {/* Edit Form */}
          {orgId && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Form Card */}
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
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 !bg-black text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer border-4 border-white hover:scale-110 transition-transform">
                      <Upload size={18} /><input type="file" className="hidden" />
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ชื่อหน่วยงาน</label>
                      <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="input input-bordered w-full rounded-2xl font-bold !bg-white !text-slate-900 border-slate-200 focus:!border-black" />
                    </div>

                    {/* Adjusted Staff & Admin Codes for Mobile */}
                    <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Staff Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm md:text-base font-bold text-blue-600 break-all">{staffCode}</code>
                          <button onClick={() => copyToClipboard(staffCode)} className="shrink-0 p-2 !bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-black transition-colors shadow-sm">
                            <Copy size={16}/>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 !bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Admin Code</label>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-sm md:text-base font-bold text-red-600 break-all">{adminCode}</code>
                          <button onClick={() => copyToClipboard(adminCode)} className="shrink-0 p-2 !bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-black transition-colors shadow-sm">
                            <Copy size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
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
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 !bg-white border-2 border-slate-100 rounded-2xl p-2 flex items-center justify-center overflow-hidden">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://line.me/R/ti/p/@org_${orgId}`} alt="QR" className="w-full h-full" />
                    </div>
                    <div className="flex-1">
                       <p className="text-xs text-slate-500 font-bold mb-2">ลิงก์แจ้งเหตุประจำหน่วยงาน</p>
                       <button className="btn btn-sm btn-outline rounded-full text-[10px] font-bold !bg-white !text-slate-600 border-slate-200 hover:!border-black transition-colors">ดาวน์โหลดไฟล์ QR</button>
                    </div>
                 </div>
              </div>

              {/* Action Buttons: 50/50 Layout */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button 
                  onClick={() => setShowDeleteModal(true)} 
                  className="btn flex-1 h-14 !rounded-2xl !bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-100 font-bold transition-all"
                >
                  <Trash2 size={18} /> ลบหน่วยงาน
                </button>
                
                <button 
                  className="btn flex-1 h-14 !rounded-2xl !bg-[#16a34a] hover:!bg-[#15803d] !text-white !border-none font-bold shadow-[0_0_20px_rgba(22,163,74,0.2)] transition-all"
                >
                  <CheckCircle2 size={18} /> ยืนยันการอัปเดตทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal  */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="!bg-white w-full max-w-md rounded-[2.5rem] p-8 border-2 border-white shadow-[0_0_60px_rgba(0,0,0,0.15)] animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={32} /></div>
            <h3 className="text-xl font-bold text-center mb-2 !text-slate-900">ยืนยันการลบหน่วยงาน?</h3>
            <p className="text-slate-500 text-sm text-center mb-6 font-bold">ข้อมูลจะถูกซ่อนจากระบบ แต่สามารถกู้คืนได้ภายหลังโดยAdmin</p>
            <textarea className="textarea textarea-bordered w-full rounded-2xl min-h-[100px] mb-6 font-bold text-sm !bg-white !text-slate-900 border-slate-200 focus:!border-red-500 outline-none shadow-sm" placeholder="ระบุสาเหตุ..." value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}></textarea>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-xl font-bold !bg-slate-100 border-none !text-slate-600 hover:!bg-slate-200">ยกเลิก</button>
              <button onClick={() => setShowDeleteModal(false)} className="btn flex-1 rounded-xl !bg-red-600 !text-white hover:!bg-red-700 border-none font-bold shadow-lg">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}