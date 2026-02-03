'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar"; 
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  ChevronRight, MousePointerClick, Menu 
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [cases, setCases] = useState([]); 
  const [orgId, setOrgId] = useState("");      
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [selectedImageToReplace, setSelectedImageToReplace] = useState(null);

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
        })));
      } else {
        setCases([]);
      }
    } catch (e) {
      setCases([{ org_id: "1", org_name: "กลุ่มอาสาสมัครพัฒนาเมือง", logo_url: "https://via.placeholder.com/150" }]);
    } finally { setIsSearching(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    setIsSubmitting(true);
    try {
      let currentPhotoUrl = selectedImageToReplace.url;
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

      const adminId = localStorage.getItem("current_admin_id")?.replace(/['"]+/g, '') || "unknown";
      const originalOrg = cases.find(c => c.org_id === orgId);

      const dbResponse = await fetch(`${dbManageUrl}?id=${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_admin_id: adminId,
          name: orgName, 
          file_url: currentPhotoUrl,           
          old_url: selectedImageToReplace.url,
          old_name: originalOrg?.org_name || ""
        })
      });

      if (dbResponse.ok) {
        alert("อัปเดตข้อมูลหน่วยงานสำเร็จ!");
        await fetchOrgData(orgId); 
        setLogoFile(null); 
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      {/* CDN Links สำหรับ DaisyUI และ Tailwind */}
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>
      
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        <div className={`max-w-2xl mx-auto px-4 transition-all duration-300 ${!isDesktopSidebarOpen ? 'lg:mt-10' : ''}`}>
          
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg"><Building2 size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">จัดการหน่วยงาน</h1>
              <p className="text-slate-500 font-bold text-xs">ค้นหาและอัปเดตข้อมูลหน่วยงานในระบบ</p>
            </div>
          </header>
              
          {/* Search Box - แก้ไขให้รองรับ DaisyUI */}
          <div className="flex items-center gap-2 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-20 pointer-events-none" size={18} />
              <input 
                type="text" 
                className="input input-ghost w-full h-12 !pl-11 pr-4 !bg-white !rounded-full !border !border-slate-200 focus:!border-black shadow-sm outline-none transition-all font-bold text-sm focus:ring-0 z-10" 
                placeholder="ค้นหาหน่วยงาน..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} 
              />
            </div>
            <button 
              onClick={() => fetchOrgData(searchId)} 
              className="btn h-12 min-h-[3rem] px-6 !bg-black !text-white !font-bold !rounded-full hover:!bg-slate-800 !border-none transition-all active:scale-95 shadow-md text-sm no-animation"
            >
              {isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}
            </button>
          </div>

          {/* Result Grid */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 px-1">ผลการค้นหา</h3>
            {cases.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {cases.map((item) => (
                  <div 
                    key={item.org_id} 
                    onClick={() => { 
                      if (orgId === item.org_id) {
                        setOrgId(""); setOrgName(""); setLogoPreview(null); setSelectedImageToReplace(null);
                      } else {
                        setOrgId(item.org_id); setOrgName(item.org_name); setLogoPreview(item.logo_url); 
                        setSelectedImageToReplace({ url: item.logo_url });
                      }
                    }} 
                    className={`relative !bg-white rounded-[1.2rem] sm:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 border-2 flex flex-col ${
                      orgId === item.org_id ? '!border-black shadow-xl scale-[1.02]' : '!border-slate-100 hover:!border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="h-20 sm:h-28 w-full !bg-[#f8fafc] flex items-center justify-center relative overflow-hidden">
                      <img src={item.logo_url} className="w-10 h-10 sm:w-16 sm:h-16 object-contain" alt="Org Logo" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                        <h4 className="text-slate-900 font-bold text-[10px] sm:text-sm truncate mb-2">{item.org_name}</h4>
                        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2">
                          <span className="text-slate-500 !bg-slate-50 px-1 py-0.5 rounded text-[8.5px] font-bold">ID: {item.org_id}</span>
                          <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${orgId === item.org_id ? '!bg-black !text-white' : '!bg-slate-100 !text-slate-400'}`}>
                            <ChevronRight size={10} strokeWidth={4} />
                          </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="!bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200 py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                <MousePointerClick size={32} className="mb-3 opacity-20" /><p className="text-slate-600 font-bold text-sm">ระบุรหัสหน่วยงานเพื่อเริ่มต้น</p>
              </div>
            )}
          </div>

          {/* Edit Form */}
          {orgId && (
            <div className="!bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-slate-100 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 !bg-slate-50 rounded-[2rem] flex items-center justify-center p-5 border-2 border-slate-100 shadow-inner overflow-hidden">
                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain" /> : <ImageIcon size={32} className="text-slate-300" />}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-9 h-9 !bg-black hover:!bg-slate-800 !text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 border-4 border-white">
                    <Upload size={16} strokeWidth={3} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { 
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
                <div className="flex-1 space-y-5 w-full">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Display Name</label>
                    <input 
                      type="text" 
                      value={orgName} 
                      onChange={(e) => setOrgName(e.target.value)} 
                      className="input input-ghost w-full h-11 !bg-white !border !border-slate-200 !rounded-xl !px-4 text-sm font-bold text-slate-900 focus:!border-black outline-none transition-all shadow-sm focus:ring-0" 
                      placeholder="กรอกชื่อหน่วยงาน..." 
                    />
                  </div>
                  <div className="flex items-start gap-3 p-3.5 !bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-7 h-7 rounded-full !bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-50"><AlertCircle size={14} className="text-amber-600" strokeWidth={3} /></div>
                    <p className="text-[10px] text-amber-900 font-bold leading-tight">การเปลี่ยนแปลงจะส่งผลต่อ <span className="text-orange-700 underline">LINE</span> และ <span className="text-black underline">Dashboard</span> ทันที</p>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className={`btn w-full h-13 min-h-[3.25rem] !rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all active:scale-[0.98] shadow-lg py-3.5 !border-none no-animation ${
                    isSubmitting ? "!bg-slate-300 !text-slate-600" : "!bg-[#16a34a] hover:!bg-[#15803d] !text-white"
                  }`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} strokeWidth={3} /><span>ยืนยันการอัปเดตข้อมูล</span></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}