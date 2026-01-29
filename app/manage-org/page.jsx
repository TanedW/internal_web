'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link"; 
import { usePathname, useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { 
  Building2, Upload, Image as ImageIcon, 
  CheckCircle2, AlertCircle, Loader2, Search,
  Mail, Briefcase, LayoutGrid, Users, X, LogOut,
  ChevronRight, MousePointerClick, Menu 
} from "lucide-react";


const MIME_TYPE_MAP = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeType = MIME_TYPE_MAP[extension] || file.type;
    const reader = new FileReader();
    reader.readAsDataURL(file); 
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};


// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "", 
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
    };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function ManageOrgPage() {
  const pathname = usePathname(); 
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoles, setCurrentRoles] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [cases, setCases] = useState([]); 
  const [orgId, setOrgId] = useState("");      
  const [orgName, setOrgName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [selectedImageToReplace, setSelectedImageToReplace] = useState(null);
  // const [reason, setReason] = useState("");



  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;
  const API_URL_ORG = process.env.NEXT_PUBLIC_DB_SEARCH_ORG_API_URL || ""; 
  const uploadApiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL;
  const dbManageUrl = process.env.NEXT_PUBLIC_DB_MANAGE_ORG_API_URL

  
  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "User")}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  const getUserAvatar = (u) => u?.photoURL || getAvatarUrl("Admin");

  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      return storedId ? storedId.replace(/^"|"$/g, '') : null;
    }
    return null;
  };

  const hasAccess = (requiredRoles) => currentRoles.some(myRole => requiredRoles.includes(myRole));
  
  const showCaseMenu = hasAccess(['admin', 'editor', 'editor_manage_case']);
  const showMenuMenu = hasAccess(['admin', 'editor', 'editor_manage_menu']);
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  const getMenuClass = (targetPath) => {
    const isActive = pathname === targetPath;
    return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
      isActive 
        ? "bg-[#111827] !text-white shadow-lg shadow-slate-300 scale-[1.02]" 
        : "text-black hover:bg-slate-50 hover:text-black"
    }`;
  };

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
      {currentRoles.length > 0 ? (
        <>
          {isSidebarRolesExpanded ? (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 w-full items-center">
              {currentRoles.map((role, idx) => (
                <span key={idx} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[160px]">
                  {role.replace(/_/g, ' ')}
                </span>
              ))}
              <button onClick={() => setIsSidebarRolesExpanded(false)} className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm">Show less</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center items-center">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[150px]">
                {currentRoles[0].replace(/_/g, ' ')}
              </span>
              {currentRoles.length > 1 && (
                <button onClick={() => setIsSidebarRolesExpanded(true)} className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm">+{currentRoles.length - 1} more</button>
              )}
            </div>
          )}
        </>
      ) : (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest</span>
      )}
    </div>
  );

  const fetchAdmins = async () => {
    if (!API_URL_ADMIN) return;
    const adminId = getCurrentAdminId();
    try {
      const res = await fetch(adminId ? `${API_URL_ADMIN}?requester_id=${adminId}` : API_URL_ADMIN);
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.data || []);
      if (adminId && data.length > 0) {
        const myProfile = data.find(u => String(u.admin_id) === String(adminId));
        if (myProfile) {
          const roles = Array.isArray(myProfile.roles) ? myProfile.roles : [myProfile.role || 'guest'];
          setCurrentRoles(roles);
        }
      }
    } catch (error) { console.error("Error loading roles:", error); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push('/');
    } catch (error) { console.error("Logout error:", error); }
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
        })));
      } else {
        setCases([]);
      }
    } catch (e) {
      setCases([{ org_id: "1", org_name: "กลุ่มอาสาสมัครพัฒนาเมือง", logo_url: "https://upload.wikimedia.org/wikipedia/sco/thumb/b/bf/KFC_logo.svg/1200px-KFC_logo.svg.png" }]);
    } finally { setIsSearching(false); }
  };

// const handleSubmit = async (e) => {
//   e.preventDefault();
//   if (!orgId) return;
  
//   setIsSubmitting(true);
//   try {
//     // let finalLogoUrl = logoPreview; // ค่าเดิม (URL จาก API)
//     // console.log("Logo File:", finalLogoUrl);

//     // ถ้ามีการเลือกไฟล์ใหม่ (logoFile ไม่เป็น null)
//     if (logoFile) {
//       // 1. แปลงไฟล์เป็น Base64
//       const base64Image = await fileToBase64(logoFile, );
//       console.log("Org Id:", orgId);
//       const payload = {
//             folder_path: `attachment/Test_internal_web/org_${orgId}`, 
//             image: base64Image
//         };

//       const response = await fetch(uploadApiUrl, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload), 
//         });
        
//         const result = await response.json();
//         // console.log("Upload API Response:", result);

      
//       // 2. เก็บลง LocalStorage (จำลองการแปลง URL)
//       // ในการใช้งานจริง มักจะส่ง base64 นี้ไปที่ API เพื่อให้ Server อัปโหลดขึ้น Cloud Storage


//      if (response.ok && result.photo_link) {
//              localStorage.setItem(`org_logo_${orgId}`, result.photo_link);
             
//              const adminId = localStorage.getItem("current_admin_id") || "unknown_admin";


//              console.log("Admin ID:", `current_admin_id: ${adminId.toString().replace(/['"]+/g, '')}`);
//              console.log("Photo Link:", result.photo_link);
//              console.log("Old URL:", selectedImageToReplace.url);


//              const dbPayload = {
//                 current_admin_id: adminId.toString().replace(/['"]+/g, ''),
//                 name: orgName, 
//                 file_url: result.photo_link,           
//                 // description: reason,
//                 old_url: selectedImageToReplace.url
//              };

//              const orgIdParam = orgId;

//              const dbResponse = await fetch(`${dbManageUrl}?id=${orgIdParam}`, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(dbPayload)
//              });

//              const dbResult = await dbResponse.json();

//             if (dbResponse.ok && (dbResult.success === undefined || dbResult.success)) {
//                 localStorage.removeItem("photo_link");
//                 setIsSuccess(true);
//             } else {
//                 throw new Error(dbResult.message || "Database update failed");
//             }
//     }


//       // localStorage.setItem(`org_logo_${orgId}`, result.photo_link);
      
//       // console.log("Saved Base64 to LocalStorage for Org:", orgId);
//     }

//     // จำลองการเรียก API อัปเดตข้อมูล
//     // const updatePayload = {
//     //   id: orgId, 
//     //   name: orgName,
//     //   logo: result.photo_link 
//     // };
    
//     // console.log("Updating organization...", updatePayload);
//     await new Promise(resolve => setTimeout(resolve, 1500));
    
//     alert("อัปเดตข้อมูลหน่วยงานสำเร็จ!");
    
//   } catch (error) {
//     console.error("Update Error:", error);
//     alert("เกิดข้อผิดพลาดในการอัปโหลด");
//   } finally {
//     setIsSubmitting(false);
//   }
// };

// ... ภายในฟังก์ชัน handleSubmit ...
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!orgId) return;
  
  setIsSubmitting(true);
  try {
    let currentPhotoUrl = selectedImageToReplace.url;
    let hasImageChanged = false;

    // 1. ถ้ามีการเลือกไฟล์ใหม่ ให้ Upload ก่อน
    if (logoFile) {
      const base64Image = await fileToBase64(logoFile);
      const payload = {
        folder_path: `attachment/Test_internal_web/org_${orgId}`, 
        image: base64Image
      };

      const response = await fetch(uploadApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), 
      });
      
      const result = await response.json();
      if (response.ok && result.photo_link) {
        currentPhotoUrl = result.photo_link;
        hasImageChanged = true;
      }
    }

    const adminId = localStorage.getItem("current_admin_id") || "unknown_admin";
    
    // หาค่า Org เดิมจากลิสต์ cases เพื่อส่ง old_name
    const originalOrg = cases.find(c => c.org_id === orgId);

    // 2. เตรียม Payload ส่งไป Update DB
    const dbPayload = {
      current_admin_id: adminId.toString().replace(/['"]+/g, ''),
      name: orgName, 
      file_url: currentPhotoUrl,           
      old_url: selectedImageToReplace.url,
      old_name: originalOrg?.org_name || "" // เพิ่มการส่งชื่อเก่า
    };

    const dbResponse = await fetch(`${dbManageUrl}?id=${orgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbPayload)
    });

    const dbResult = await dbResponse.json();

    if (dbResponse.ok) {
      setIsSuccess(true);
      alert("อัปเดตข้อมูลหน่วยงานสำเร็จ!");
      // อาจจะสั่ง fetchOrgData อีกครั้งเพื่อ refresh UI

      // 1. ดึงข้อมูลใหม่จาก API เพื่อให้ UI อัปเดตเป็นค่าล่าสุด
      await fetchOrgData(orgId); 

      // 2. เคลียร์สถานะไฟล์ที่เลือกค้างไว้ (Optional)
      setLogoFile(null); 
      
      // 3. ปิดกล่องแก้ไขข้อมูล (ถ้าต้องการ) หรือเปิดค้างไว้ก็ได้
      // setOrgId("");
      
      // window.location.reload();
    } else {
      throw new Error(dbResult.message || "Database update failed");
    }
  } catch (error) {
    console.error("Update Error:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
  } finally {
    setIsSubmitting(false);
  }
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAdmins();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-[#F4F6F8]"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      
      {/* MOBILE NAVBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F4F6F8]/95 backdrop-blur-sm z-40 px-5 flex justify-between items-center border-b border-slate-200/50">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="btn btn-square btn-ghost btn-sm text-slate-800">
                  <Menu className="w-6 h-6" />
              </button>
           
           </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-6 rounded-r-[2rem] animate-in slide-in-from-left duration-300">
                <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"><X className="w-5 h-5" /></button>
                <div className="flex flex-col items-center text-center mb-8 mt-6">
                      <div className="w-24 h-24 rounded-full p-1 border-2 border-slate-100 mb-4 overflow-hidden">
                          <img src={getUserAvatar(user)} alt="User" className="object-cover w-full h-full"/>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800 break-words w-full px-2">{user?.displayName || "Admin"}</h2>
                      <SidebarRoleDisplay />
                </div>
                <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
                    <Link href="/manage" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage')}><Mail size={20} /><span className="font-bold text-sm">จัดการ Email</span></Link>
                    {showCaseMenu && <Link href="/manage-case" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-case')}><Briefcase size={20} /><span className="font-bold text-sm">จัดการ Case</span></Link>}
                    {showMenuMenu && <Link href="/manage-richmenu" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-richmenu')}><LayoutGrid size={20} /><span className="font-bold text-sm">จัดการ Menu</span></Link>}
                    {showORGMenu && <Link href="/manage-org" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-org')}><Users size={20} /><span className="font-bold text-sm">จัดการ ORG</span></Link>}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full text-left">
                        <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                            <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2rem] shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-8 px-6 z-50 transition-all duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
          <button onClick={() => setIsDesktopSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all duration-200">
              <X className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center mb-10 mt-2">
              <div className="w-24 h-24 rounded-full p-1 border-2 border-slate-100 mb-4 overflow-hidden">
                  <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 px-2 break-words w-full">{user?.displayName || "Admin"}</h2>
              <SidebarRoleDisplay />
          </div>
          <div className="flex flex-col gap-2 w-full flex-1">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
              <Link href="/manage" className={getMenuClass('/manage')}><Mail size={20} /><span className="font-bold text-sm">จัดการ Email</span></Link>
              {showCaseMenu && <Link href="/manage-case" className={getMenuClass('/manage-case')}><Briefcase size={20} /><span className="font-bold text-sm">จัดการ Case</span></Link>}
              {showMenuMenu && <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}><LayoutGrid size={20} /><span className="font-bold text-sm">จัดการ Menu</span></Link>}
              {showORGMenu && <Link href="/manage-org" className={getMenuClass('/manage-org')}><Users size={20} /><span className="font-bold text-sm">จัดการ ORG</span></Link>}
          </div>
          <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200 w-full text-left">
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
          </button>
      </div>

      {/* MAIN CONTENT */}
      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
         {!isDesktopSidebarOpen && (
             <div className="hidden lg:block fixed top-8 left-8 z-30">
                <button 
                    onClick={() => setIsDesktopSidebarOpen(true)}
                    // ปรับแต่งปุ่ม Hamburger ตรงนี้ตามที่คุณต้องการ
                    className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition-all duration-200 active:scale-95"
                    title="Open Sidebar"
                >
                    <Menu className="w-7 h-7" />
                </button>
             </div>
        )}

        <div className={`max-w-2xl mx-auto px-4 transition-all duration-300 ${!isDesktopSidebarOpen ? 'lg:mt-10' : ''}`}>
          
          <header className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white shadow-lg"><Building2 size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">จัดการหน่วยงาน</h1>
              <p className="text-slate-500 font-bold text-xs">ค้นหาและอัปเดตข้อมูลหน่วยงานในระบบ</p>
            </div>
          </header>
              
          <div className="flex items-center gap-2 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" className="w-full h-12 pl-11 pr-4 bg-white rounded-full border border-slate-200 focus:border-black shadow-sm outline-none transition-all font-bold text-sm" placeholder="ค้นหาหน่วยงาน..." value={searchId} onChange={(e) => setSearchId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchOrgData(searchId)} />
            </div>
            <button onClick={() => fetchOrgData(searchId)} className="h-12 px-6 bg-black text-white font-bold rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-md text-sm">{isSearching ? <Loader2 className="animate-spin" size={18} /> : "ค้นหา"}</button>
          </div>

          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 px-1">ผลการค้นหา</h3>
            {cases.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {cases.map((item) => (
                  <div 
                    key={item.org_id} 
                    onClick={() => { 
                      if (orgId === item.org_id) {
                        setOrgId(""); setOrgName(""); setLogoPreview(null);
                        setSelectedImageToReplace(null); // ล้างค่า
                      } else {
                        setOrgId(item.org_id); setOrgName(item.org_name); setLogoPreview(item.logo_url); 
                        setSelectedImageToReplace({ url: item.logo_url });
                      }
                    }} 
                    className={`relative bg-white rounded-[1.2rem] sm:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 border-2 flex flex-col ${
                      orgId === item.org_id ? 'border-black shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="h-20 sm:h-28 w-full bg-[#f8fafc] flex items-center justify-center relative overflow-hidden border-b border-slate-50">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-slate-100 rounded-full -mr-4 -mt-4 opacity-30"></div>
                      <div className="relative w-10 h-10 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm p-1.5 sm:p-2.5">
                        <img src={item.logo_url} className="w-full h-full object-contain" alt="Org Logo" onError={(e) => { e.target.src = getAvatarUrl(item.org_id); }} />
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-4 flex flex-col flex-1 min-w-0">
                        <h4 className="text-slate-900 font-bold text-[10px] sm:text-sm tracking-tight leading-tight mb-1 truncate">{item.org_name}</h4>
                        <div className="mb-2">
                            {orgId === item.org_id ? 
                                <span className="bg-black text-white text-[7.5px] font-black px-1 py-0.5 rounded uppercase tracking-wider inline-block">SELECTED</span> : 
                                <p className="text-slate-400 text-[7.5px] font-bold uppercase tracking-widest">Global Org</p>
                            }
                        </div>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2">
                        <span className="text-slate-500 bg-slate-50 px-1 py-0.5 rounded text-[8.5px] font-bold">ID: {item.org_id}</span>
                        <div className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${orgId === item.org_id ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'}`}><ChevronRight size={10} strokeWidth={4} /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200 py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                <MousePointerClick size={32} className="mb-3 opacity-20" /><p className="text-slate-600 font-bold text-sm">ระบุรหัสหน่วยงานเพื่อเริ่มต้น</p>
              </div>
            )}
          </div>

          {orgId && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-slate-100 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-50 rounded-[2rem] flex items-center justify-center p-5 border-2 border-slate-100 shadow-inner overflow-hidden">
                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain" /> : <ImageIcon size={32} className="text-slate-300" />}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-black hover:bg-slate-800 text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer transition-all active:scale-90 border-4 border-white">
                    <Upload size={16} strokeWidth={3} />
                    {/* <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setLogoFile(file); const reader = new FileReader(); reader.onloadend = () => setLogoPreview(reader.result); reader.readAsDataURL(file); } }} /> */}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => { 
                        const file = e.target.files[0]; 
                        if (file) { 
                          setLogoFile(file); // เก็บไฟล์ต้นฉบับไว้เพื่อแปลง Base64 ตอนกด Submit
                          const reader = new FileReader(); 
                          reader.onloadend = () => setLogoPreview(reader.result); // แสดง Preview ทันที
                          reader.readAsDataURL(file); 
                        } 
                      }} 
                    />
                  </label>
                </div>
                <div className="flex-1 space-y-5 w-full">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block">Display Name</label>
                    <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-slate-50 focus:border-black outline-none transition-all shadow-sm" placeholder="กรอกชื่อหน่วยงาน..." />
                  </div>
                  <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-50"><AlertCircle size={14} className="text-amber-600" strokeWidth={3} /></div>
                    <p className="text-[10px] text-amber-900 font-bold leading-tight">การเปลี่ยนแปลงจะส่งผลต่อ <span className="text-orange-700 underline">LINE</span> และ <span className="text-black underline">Dashboard</span> ทันที</p>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <button onClick={handleSubmit} disabled={isSubmitting} className={`w-full h-13 rounded-xl flex items-center justify-center gap-3 text-sm font-bold transition-all active:scale-[0.98] shadow-lg py-3.5 ${isSubmitting ? "bg-slate-300 text-slate-600" : "bg-[#16a34a] hover:bg-[#15803d] text-white"}`}>
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
