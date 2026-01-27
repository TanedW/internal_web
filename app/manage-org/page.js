'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { 
  Building2, Upload, Save, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  Mail, Briefcase, LayoutGrid, Users, X, Menu, LogOut 
} from "lucide-react";
import Link from "next/link";

export default function ManageOrg() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- State ข้อมูลหน่วยงาน ---
  const [searchId, setSearchId] = useState(""); // สำหรับค้นหา
  const [orgId, setOrgId] = useState("");       // ID ของหน่วยงานที่กำลังแก้ไข
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  // --- State Sidebar & Role ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [currentRoles, setCurrentRoles] = useState([]);

  const API_URL_ORG = process.env.NEXT_PUBLIC_ORG_CONFIG_API_URL;
  const API_URL_USER = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      return storedId ? storedId.replace(/^"|"$/g, '') : null;
    }
    return null;
  };

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        Promise.all([fetchUserRoles(), fetchOrgData()]).finally(() => {
          setLoading(false);
        });
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchUserRoles = async () => {
    const currentAdminId = getCurrentAdminId();
    if (!currentAdminId || !API_URL_USER) return;
    try {
      const res = await fetch(`${API_URL_USER}?requester_id=${currentAdminId}`);
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
      if (myProfile) {
        setCurrentRoles(Array.isArray(myProfile.roles) ? myProfile.roles : [myProfile.role]);
      }
    } catch (e) { console.error("Error fetching roles:", e); }
  };

  // ดึงข้อมูลหน่วยงาน (กรณีโหลดครั้งแรก หรือค้นหา)
  const fetchOrgData = async (targetId = null) => {
    if (!API_URL_ORG) return;
    try {
      // ตัวอย่าง: API_URL_ORG?org_id=123
      const url = targetId ? `${API_URL_ORG}?org_id=${targetId}` : API_URL_ORG;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data) {
        setOrgId(data.org_id || targetId || "");
        setOrgName(data.org_name || data.name || "");
        setLogoPreview(data.logo_url || null);
        if (targetId) {
            setStatus({ type: 'success', message: 'ดึงข้อมูลหน่วยงานเรียบร้อย' });
        }
      } else if (targetId) {
        setStatus({ type: 'error', message: 'ไม่พบข้อมูลรหัสหน่วยงานนี้' });
      }
    } catch (e) {
      console.error("Error fetching org data:", e);
      setStatus({ type: 'error', message: 'ไม่สามารถติดต่อฐานข้อมูลได้' });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    fetchOrgData(searchId.trim());
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push("/");
    } catch (error) { console.error(error); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });
    try {
      const formData = new FormData();
      formData.append('org_id', orgId); // ส่ง ID ไปด้วยเพื่อให้อัปเดตถูก Record
      formData.append('org_name', orgName);
      if (logoFile) formData.append('logo', logoFile);

      const res = await fetch(API_URL_ORG, {
        method: 'POST', 
        body: formData,
      });

      if (res.ok) {
        setStatus({ type: 'success', message: 'อัปเดตข้อมูลหน่วยงานเรียบร้อยแล้ว' });
        setLogoFile(null);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAccess = (requiredRoles) => currentRoles.some(r => requiredRoles.includes(r));
  const getMenuClass = (targetPath) => {
    const isActive = pathname === targetPath;
    return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
      isActive ? "bg-[#111827] !text-white shadow-lg scale-[1.02]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
      {currentRoles.length > 0 ? (
        <div className="flex flex-col gap-2 items-center">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            {currentRoles[0].replace(/_/g, ' ')}
          </span>
          {currentRoles.length > 1 && (
            <span className="text-[9px] text-slate-400 font-bold">+{currentRoles.length - 1} more roles</span>
          )}
        </div>
      ) : <span className="text-[10px] font-bold text-slate-400 uppercase">Guest</span>}
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F4F6F8] gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* --- SIDEBARS (คงเดิม) --- */}
      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[280px] h-full bg-white p-6 flex flex-col shadow-2xl">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
            <div className="flex flex-col items-center mb-8 mt-6">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-indigo-100 shadow-sm">
                <img src={user?.photoURL || getAvatarUrl(user?.email || "Admin")} alt="User" />
              </div>
              <h2 className="font-extrabold text-slate-800">{user?.displayName || "Admin"}</h2>
              <SidebarRoleDisplay />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <Link href="/manage" className={getMenuClass('/manage')}><Mail size={20} /><span className="text-sm font-bold">จัดการ Email</span></Link>
              {hasAccess(['admin', 'editor', 'editor_manage_case']) && <Link href="/manage-case" className={getMenuClass('/manage-case')}><Briefcase size={20} /><span className="text-sm font-bold">จัดการ Case</span></Link>}
              {hasAccess(['admin', 'editor', 'editor_manage_menu']) && <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}><LayoutGrid size={20} /><span className="text-sm font-bold">จัดการ Menu</span></Link>}
              <Link href="/manage-org" className={getMenuClass('/manage-org')}><Users size={20} /><span className="text-sm font-bold">จัดการ ORG</span></Link>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-100">
                <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                    <LogOut className="text-red-500" size={20} />
                    <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex-col py-8 px-6 z-50 transition-all duration-300 ${isDesktopSidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}`}>
        <button onClick={() => setIsDesktopSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
        <div className="flex flex-col items-center mb-10 mt-2">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 mb-4 shadow-md">
            <img src={user?.photoURL || getAvatarUrl(user?.email || "Admin")} alt="User" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">{user?.displayName || "Admin"}</h2>
          <SidebarRoleDisplay />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 pl-4">Main Navigation</div>
          <Link href="/manage" className={getMenuClass('/manage')}><Mail size={20} /><span className="font-bold text-sm">จัดการ Email</span></Link>
          {hasAccess(['admin', 'editor', 'editor_manage_case']) && <Link href="/manage-case" className={getMenuClass('/manage-case')}><Briefcase size={20} /><span className="font-bold text-sm">จัดการ Case</span></Link>}
          {hasAccess(['admin', 'editor', 'editor_manage_menu']) && <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}><LayoutGrid size={20} /><span className="font-bold text-sm">จัดการ Menu</span></Link>}
          <Link href="/manage-org" className={getMenuClass('/manage-org')}><Users size={20} /><span className="font-bold text-sm">จัดการ ORG</span></Link>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100">
            <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                <LogOut className="text-red-500" size={20} />
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
            </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className={`container mx-auto px-4 lg:px-8 pt-24 lg:pt-12 max-w-4xl transition-all duration-300 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}>
        {!isDesktopSidebarOpen && (
          <button onClick={() => setIsDesktopSidebarOpen(true)} className="hidden lg:flex fixed top-8 left-8 btn btn-square bg-white border-slate-200 shadow-lg z-30"><Menu /></button>
        )}
        {/* Toggle Mobile Menu Button */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden fixed top-6 left-6 btn btn-square bg-white border-slate-200 shadow-md z-30"><Menu /></button>

        <div className="mb-6 flex items-center gap-5">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg">
            <Building2 className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">จัดการข้อมูลหน่วยงาน</h1>
            <p className="text-slate-500 font-medium">ค้นหาและแก้ไขข้อมูลพื้นฐาน</p>
          </div>
        </div>

        {/* SEARCH SECTION */}
<div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8">
  <form onSubmit={handleSearch} className="flex gap-3">
    <div className="relative flex-1">
      {/* ไอคอนแว่นขยาย - ปรับตำแหน่งให้ไม่ทับตัวหนังสือ */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input 
        type="text" 
        placeholder="ค้นหาด้วยรหัสหน่วยงาน (Org ID)..." 
        className="input input-bordered w-full pl-11 h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium focus:bg-white focus:border-indigo-500 transition-all text-slate-600"
        value={searchId}
        onChange={(e) => setSearchId(e.target.value)}
      />
    </div>
    <button 
      type="submit" 
      className="btn h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 border-none text-white font-bold transition-all shadow-lg shadow-indigo-100"
    >
      ค้นหา
    </button>
  </form>
</div>

        {status.message && (
          <div className={`mb-8 p-4 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
            <span className="font-bold">{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-8 lg:p-12 space-y-10">
              
              {/* Logo Section */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative group">
                  <div className="w-32 h-32 lg:w-44 lg:h-44 rounded-full overflow-hidden bg-slate-50 border-4 border-white shadow-2xl ring-1 ring-slate-200">
                    {logoPreview ? (
                      <img src={logoPreview} className="w-full h-full object-cover" alt="Org Logo" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                        <ImageIcon size={50} />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-xl cursor-pointer hover:scale-110 transition-all duration-200 active:scale-95">
                    <Upload size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <div className="text-center mt-4">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wide">โลโก้หน่วยงาน</h3>
                    <p className="text-xs text-slate-400 mt-1 italic">รหัสหน่วยงาน: {orgId || 'ยังไม่ได้ระบุ'}</p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent w-full"></div>

              {/* Name Input Section */}
              <div className="form-control w-full">
                <label className="label mb-1">
                  <span className="label-text font-black text-slate-700 text-base">ชื่อหน่วยงานที่แสดงในระบบ</span>
                </label>
                <input 
                  type="text" 
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)} 
                  placeholder="เช่น กรมการปกครอง..." 
                  className="input input-bordered h-16 bg-white border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-2xl text-lg font-bold text-slate-800 transition-all" 
                  required 
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-slate-50/80 p-10 flex justify-center border-t border-slate-100">
              <button 
                type="submit" 
                disabled={isSubmitting || !orgName} 
                className="btn btn-primary min-w-[280px] h-16 rounded-2xl text-white font-black text-xl shadow-xl shadow-indigo-200 hover:scale-[1.03] active:scale-[0.98] transition-all border-none bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> กำลังบันทึก...</span>
                ) : (
                  <span className="flex items-center gap-2"><Save size={24} /> บันทึกการเปลี่ยนแปลง</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}