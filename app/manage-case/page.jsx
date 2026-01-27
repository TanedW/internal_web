'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { 
  LogOut, Search, CheckCircle2, AlertCircle, UploadCloud, 
  ArrowLeft, ArrowRight, X, ImageIcon, Music, FileAudio, 
  MapPin, Calendar, Users ,Mail, Briefcase, LayoutGrid
} from "lucide-react"; 
import Link from 'next/link';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 

// --- Config: MIME Types ---
const MIME_TYPE_MAP = {
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'heic': 'image/heic',
  'heif': 'image/heif',
  'ico': 'image/x-icon',
  'tiff': 'image/tiff',
  'apng': 'image/apng',
  // Videos
  'mp4': 'video/mp4',
  'mov': 'video/quicktime',
  'avi': 'video/avi',
  'mkv': 'video/x-matroska',
  'wmv': 'video/x-ms-wmv',
  'm4v': 'video/m4v',
  'mpg': 'video/mpeg', 
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'aac': 'audio/aac',
  'ogg': 'audio/ogg',
  'm4a': 'audio/m4a',
  'x-m4a': 'audio/x-m4a',
  'flac': 'audio/flac',
  'wma': 'audio/x-ms-wma',
  //file
  'zip': 'application/zip',
  '7z': 'application/x-7z-compressed',
  'pdf': 'application/pdf',
  'rar': 'application/vnd.rar',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'rtf': 'application/rtf',  
  'csv': 'text/csv', 
  'txt': 'text/plain', 
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeType = MIME_TYPE_MAP[extension] || file.type;
    const blob = new Blob([file], { type: mimeType });
    const reader = new FileReader();
    reader.readAsDataURL(blob); 
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const getMediaTypeFromFile = (file) => {
    if (!file) return 'unknown';
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeType = MIME_TYPE_MAP[extension] || file.type;

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/')) return 'file';
    if (mimeType.startsWith('application/')) return 'file';

    return 'unknown';
};

const FilePreviewRender = ({ file }) => {
    const type = getMediaTypeFromFile(file);
    
    const fileUrl = file instanceof File 
        ? URL.createObjectURL(file) 
        : (file.url || file.photo || file);

    const fileName = file.name || (typeof file === 'string' ? file : 'Unknown File');
    const extension = fileName.split('.').pop().toLowerCase();

    // กำหนดสีตามเงื่อนไขที่คุณระบุ
const getFileStyle = (ext) => {
        // ปรับระดับสีให้สดขึ้นตามรูปตัวอย่าง (100 -> 200/500)
        if (ext === 'pdf') return { bg: 'bg-red-100', text: 'text-red-500', iconBg: 'bg-white' };
        if (['doc', 'docx'].includes(ext)) return { bg: 'bg-blue-100', text: 'text-blue-500', iconBg: 'bg-white' };
        if (['csv', 'xls', 'xlsx'].includes(ext)) return { bg: 'bg-emerald-100', text: 'text-emerald-500', iconBg: 'bg-white' };
        return { bg: 'bg-slate-100', text: 'text-slate-500', iconBg: 'bg-white' };
    };  

    const style = getFileStyle(extension);

    switch (type) {
        case 'image':
            return <img src={fileUrl} className="w-full max-h-[50vh] object-contain mx-auto" alt="Preview" />;
        case 'video':
            return <video src={fileUrl} className="w-full max-h-[50vh] object-contain mx-auto" controls autoPlay muted playsInline />;
        case 'audio':
            return (
                <div className="w-full min-h-[150px] flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600 p-6">
                    <Music size={48} className="mb-3" />
                    <audio src={fileUrl} controls className="w-full" />
                </div>
            );
        case 'file':
        default:
            // กรณีเป็นไฟล์เอกสาร หรือไฟล์ที่ไม่รองรับการเล่น/แสดงผลตรงๆ
            return (
                <div className={`w-full h-full flex flex-col items-center justify-center ${style.bg} transition-all duration-300`}>
                    <div className="bg-white/50 p-4 rounded-2xl shadow-sm mb-2">
                        <UploadCloud size={48} className={style.text} strokeWidth={1.5} />
                    </div>
                    <span className={`text-sm font-black uppercase tracking-widest ${style.text}`}>
                        .{extension}
                    </span>
                </div>
            );
    }
};

export default function ManageCase() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- State สำหรับ Menu & Permission ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState([]); 

  // State สำหรับ Desktop Sidebar (Toggle)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  // ✅ State สำหรับ Toggle การแสดง Role (Sidebar)
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  // --- State Business Logic ---
  const [searchId, setSearchId] = useState("");
  const [currentCase, setCurrentCase] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [inputError, setInputError] = useState(false);
  
  const [wizardStep, setWizardStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const [selectedImageToReplace, setSelectedImageToReplace] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [reason, setReason] = useState("");

  const inputRef = useRef(null);
  
  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // Helper: ดึง ID ตัวเองจาก LocalStorage
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  };

  // Helper: Check Permission
  const hasAccess = (requiredRoles) => {
      return currentRoles.some(myRole => requiredRoles.includes(myRole));
  };

  // Logic: Menu Visibility
  const showCaseMenu = hasAccess(['admin', 'editor', 'editor_manage_case']);
  const showMenuMenu = hasAccess(['admin', 'editor', 'editor_manage_menu']);
  // ✅ เพิ่มสิทธิ์สำหรับเมนู ORG
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  // ✅ Component SidebarRoleDisplay (Logic เดียวกับหน้า Manage)
  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
        {currentRoles.length > 0 ? (
            <>
                {/* --- 1. กรณีขยาย (Expanded) --- */}
                {isSidebarRolesExpanded ? (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 w-full items-center">
                        {currentRoles.map((role, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[160px]">
                                {role.replace(/_/g, ' ')}
                            </span>
                        ))}
                        <button 
                            onClick={() => setIsSidebarRolesExpanded(false)}
                            className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm"
                        >
                            Show less
                        </button>
                    </div>
                ) : (
                    /* --- 2. กรณีปกติ (Collapsed) --- */
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        {/* Role แรก */}
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[150px]">
                            {currentRoles[0].replace(/_/g, ' ')}
                        </span>

                        {/* ปุ่ม +X more */}
                        {currentRoles.length > 1 && (
                            <button
                                onClick={() => setIsSidebarRolesExpanded(true)}
                                className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm"
                            >
                                +{currentRoles.length - 1} more
                            </button>
                        )}
                    </div>
                )}
            </>
        ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Guest</span>
        )}
    </div>
  );

  // Function: Fetch Admin Roles
  const fetchAdmins = async () => {
    if (!API_URL_ADMIN) return;
    
    const currentAdminId = getCurrentAdminId();

    try {
      const url = currentAdminId 
        ? `${API_URL_ADMIN}?requester_id=${currentAdminId}` 
        : API_URL_ADMIN;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admins");
      
      const jsonResponse = await res.json();
      const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);

      if (currentAdminId && data.length > 0) {
        const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
        if (myProfile) {
            let roles = [];
            if (Array.isArray(myProfile.roles)) {
                roles = myProfile.roles;
            } else if (myProfile.role) {
                roles = [myProfile.role];
            }
            setCurrentRoles(roles);
        }
      }
    } catch (error) {
      console.error("Error loading admins:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { 
        setUser(currentUser); 
        fetchAdmins(); 
        setLoading(false); 
      } else { 
        router.push("/"); 
      }
    });
    return () => unsubscribe();
  }, [router, API_URL_ADMIN]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        localStorage.removeItem("current_admin_id");
        router.push("/");
    } catch (error) {
        console.error("Logout error", error);
    }
  };

  const getMenuClass = (targetPath) => {
      const isActive = pathname === targetPath;
      return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
        isActive 
          ? "bg-[#111827] !text-white shadow-lg shadow-slate-300 scale-[1.02]" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`;
  };

  const handleSearch = async (e) => {
    e?.preventDefault(); 
    if (!searchId.trim()) {
        setInputError(true);
        inputRef.current?.focus();
        return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_DB_SEARCH_CASE_API_URL;
    if (!apiUrl) {
        alert("Configuration Error: API URL not found.");
        return;
    }

    setIsSearching(true);
    setCurrentCase(null);
    setNewImageFile(null); 
    setReason("");
    setWizardStep(1); 
    setIsSuccess(false);
    setSelectedImageToReplace(null);

    try {
        const response = await fetch(`${apiUrl}?id=${searchId.trim()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok && result.found) {
            const apiData = result.data;
            let allImagesCombined = [];
            
            if (apiData.timeline && Array.isArray(apiData.timeline)) {
                apiData.timeline.forEach((item, index) => {
                    if(item.photo) {
                        const fileUrl = item.photo.toLowerCase();
                        let mType = 'image';
                        if (item.viewed === 1 || fileUrl.match(/\.(mp4|mov|webm|avi|mkv)$/)) {
                            mType = 'video';
                        } else if (item.viewed === 3  || fileUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)) {
                            mType = 'audio';
                        } else if (item.viewed === 2  || fileUrl.match(/\.(zip|7z|rar|pdf|doc|docx|rtf|csv|xls|ppt|pptx|txt|)$/)) {
                            mType = 'file';
                        }

                        allImagesCombined.push({
                            id: item.id, 
                            mediaType: mType,
                            type: `${mType.charAt(0).toUpperCase() + mType.slice(1)} (${index+1})`,
                            url: item.photo,
                            status: item.status, 
                            timestamp: item.updated_on
                        });
                    }
                });
            }

            if (allImagesCombined.length === 0) {
                alert("Case นี้ไม่มีไฟล์แนบ");
            }

            const caseDate = apiData.timestamp 
                ? new Date(apiData.timestamp).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
                : "ไม่ระบุวันที่";

            setCurrentCase({
                id: apiData.ticket_id,      
                dbId: apiData.id,          
                title: apiData.problem_type || "แจ้งปัญหาทั่วไป", 
                department: apiData.address || "ไม่ระบุพิกัด", 
                assignee: "System",
                date: caseDate,
                allImages: allImagesCombined, 
                status: apiData.status
            });
        } else {
            alert(result.message || "ไม่พบข้อมูล Case ID นี้");
        }

    } catch (error) {
        console.error("Search Error:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
        setIsSearching(false);
    }
  };

  const handleUpdateImage = async (e) => {
    e.preventDefault();
    
    if (!selectedImageToReplace) {
        alert("กรุณาเลือกรายการที่ต้องการแก้ไขในขั้นตอนที่ 1");
        setWizardStep(1);
        return;
    }
    if (!newImageFile || !reason.trim()) { 
        alert("กรุณาอัปโหลดไฟล์ใหม่และระบุเหตุผล"); 
        return; 
    }
    
    const uploadApiUrl = process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL;
    const dbManageUrl = process.env.NEXT_PUBLIC_DB_MANAGE_CASE_API_URL;
    
    if (!uploadApiUrl || !dbManageUrl) {
         alert("Configuration Error: API URLs not found.");
         return;
    }

    setIsSubmitting(true);

    const getMediaTypeValue = (file) => {
    const type = getMediaTypeFromFile(file);
    switch (type) {
        case 'image': return 0;
        case 'video': return 1;
        case 'file': return 2;
        case 'audio': return 3;
        default: return 2; // Default เป็นไฟล์ทั่วไป
    }
};

    try {
        const base64String = await fileToBase64(newImageFile);
        const newViewedValue = getMediaTypeValue(newImageFile); // <--- เพิ่มบรรทัดนี้         
        const payload = {
            folder_path: `attachment/Test_internal_web/case_${currentCase.id}`, 
            image: base64String
        };

        const response = await fetch(uploadApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });

        const result = await response.json();

        if (response.ok && result.photo_link) {
             localStorage.setItem('photo_link', result.photo_link);
             
             const adminId = localStorage.getItem("current_admin_id") || "unknown_admin";

             const dbPayload = {
                current_admin_id: adminId.toString().replace(/['"]+/g, ''), 
                photo_id: selectedImageToReplace.id.toString().replace(/['"]+/g, ''), 
                file_url: result.photo_link,           
                description: reason,
                viewed: newViewedValue
             };

             const caseIdParam = currentCase.dbId || currentCase.id;

             const dbResponse = await fetch(`${dbManageUrl}?id=${caseIdParam}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
             });

             const dbResult = await dbResponse.json();

            if (dbResponse.ok && (dbResult.success === undefined || dbResult.success)) {
                localStorage.removeItem("photo_link");
                setIsSuccess(true);
            } else {
                throw new Error(dbResult.message || "Database update failed");
            }
    }
    } catch (error) {
        console.error("Update Error:", error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
        setIsSubmitting(false); 
    }
  };

  const resetForm = () => {
    setSearchId("");
    setCurrentCase(null);
    setNewImageFile(null);
    setReason("");
    setWizardStep(1);
    setIsSuccess(false);
    setSelectedImageToReplace(null);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

 return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE HEADER ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#F4F6F8]/95 backdrop-blur-sm z-40 px-5 flex justify-between items-center border-b border-slate-200/50">
           <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className="btn btn-square btn-ghost btn-sm text-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
              </button>
              <h1 className="font-bold text-slate-800 text-lg">Case Manage</h1>
           </div>
      </div>

     {/* ================= MOBILE SIDEBAR DRAWER ================= */}
     {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
            ></div>

            <div className="relative w-[280px] h-full bg-white shadow-2xl flex flex-col p-6 animate-slide-in-left rounded-r-[2rem]">
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-center text-center mb-8 mt-6">
                      <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                            <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
                        </div>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-800 break-words w-full px-2">{user?.displayName || "Admin"}</h2>
                      
                      {/* ✅ เรียกใช้ SidebarRoleDisplay (Mobile) */}
                      <SidebarRoleDisplay />
                </div>

                <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
                    
                    <Link href="/manage" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage')}>
                        <Mail size={20} />
                        <span className="font-bold text-sm">จัดการ Email</span>
                    </Link>
                    
                    {showCaseMenu && (
                        <Link href="/manage-case" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-case')}>
                            <Briefcase size={20} />
                            <span className="font-bold text-sm">จัดการ Case</span>
                        </Link>
                    )}
                    
                    {showMenuMenu && (
                        <Link href="/manage-richmenu" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-richmenu')}>
                            <LayoutGrid size={20} />
                            <span className="font-bold text-sm">จัดการ Menu</span>
                        </Link>
                    )}

                    {/* ✅ เพิ่มลิงก์ไปยังหน้า จัดการ ORG (Mobile) */}
                    {showORGMenu && (
                        <Link href="/manage-org" onClick={() => setIsMobileMenuOpen(false)} className={getMenuClass('/manage-org')}>
                            <Users size={20} />
                            <span className="font-bold text-sm">จัดการ ORG</span>
                        </Link>
                    )}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full">
                        <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 transition-transform group-hover:translate-x-0.5">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </div>
                        <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                    </button>
                </div>
            </div>
        </div>
     )}

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className={`hidden lg:flex fixed top-4 bottom-4 left-4 w-72 bg-white rounded-[2rem] shadow-[0_0_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-8 px-6 z-50 overflow-y-auto no-scrollbar transition-all duration-300 ease-in-out ${
          isDesktopSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0 pointer-events-none"
      }`}>
          
          <button 
                onClick={() => setIsDesktopSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all duration-200"
                title="Close Sidebar"
          >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
          </button>

          <div className="flex flex-col items-center text-center mb-10 mt-2">
              <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-slate-200 mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-50">
                      <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover w-full h-full"/>
                  </div>
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 px-2 break-words w-full">{user?.displayName || "Admin"}</h2>
              
              {/* ✅ เรียกใช้ SidebarRoleDisplay (Desktop) */}
              <SidebarRoleDisplay />
          </div>

          <div className="flex flex-col gap-2 w-full flex-1">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 pl-4">Menu</div>
              
              <Link href="/manage" className={getMenuClass('/manage')}>
                  <Mail size={20} />
                  <span className="font-bold text-sm">จัดการ Email</span>
              </Link>
              
              {showCaseMenu && (
                  <Link href="/manage-case" className={getMenuClass('/manage-case')}>
                     <Briefcase size={20} />
                      <span className="font-bold text-sm">จัดการ Case</span>
                  </Link>
              )}
              
              {showMenuMenu && (
                  <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}>
                      <LayoutGrid size={20} />
                      <span className="font-bold text-sm">จัดการ Menu</span>
                  </Link>
              )}

              {/* ✅ เพิ่มลิงก์ไปยังหน้า จัดการ ORG (Desktop) */}
              {showORGMenu && (
                  <Link href="/manage-org" className={getMenuClass('/manage-org')}>
                      <Users size={20} />
                      <span className="font-bold text-sm">จัดการ ORG</span>
                  </Link>
              )}
          </div>

          <button onClick={handleLogout} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 transition-all duration-200">
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 transition-transform group-hover:translate-x-0.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </div>
                <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
          </button>
      </div>


      {/* ================= MAIN CONTENT ================= */}
      {/* ✅ ปรับ Padding ซ้าย (pl) ให้ขยับตามสถานะ Sidebar */}
      <div className={`container mx-auto px-4 pt-24 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {/* ✅ 2. ปุ่ม Open (Hamburger) แสดงเฉพาะตอน Sidebar ปิด + ข้อความ Manage Case */}
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:flex items-center gap-4 fixed top-8 left-8 z-30 animate-slide-in-left">
                <button 
                    onClick={() => setIsDesktopSidebarOpen(true)}
                    className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"
                    title="Open Sidebar"
                >
                    {/* ไอคอน Hamburger (3 ขีด) */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight drop-shadow-sm">
                    Manage Case
                </h1>
             </div>
        )}
        
        {/* --- Header & Search Section --- */}
        {!currentCase && (
            <div className="flex flex-col justify-start relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl animate-fade-in pt-12 lg:mt-24">
        
                <div className="flex flex-col items-center text-center space-y-5 relative z-10 px-4">
                    {/* Text Group */}
                    <div className="space-y-2 px-2">
                        <p className="text-slate-500 text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                            กรอกรหัส Case ID เพื่อค้นหาและแก้ไขรูปภาพ<br className="hidden sm:block"/> วิดีโอ หรือไฟล์เสียง (สำหรับ Admin)
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="w-full relative max-w-lg mx-auto pb-4">
                        <form 
                            onSubmit={handleSearch} 
                            className={`relative group transition-all duration-200 ${inputError ? '-translate-x-1' : 'translate-x-0'}`}
                        >
                            <div className={`relative bg-white rounded-full shadow-lg border-2 flex items-center p-1.5 lg:p-2 transition-all duration-300 ${inputError ? 'border-red-400 ring-4 ring-red-500/10' : 'border-indigo-50 hover:border-indigo-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'}`}>
                                <div className={`pl-4 pr-3 transition-colors ${inputError ? 'text-red-500' : 'text-indigo-600'}`}>
                                    <Search size={22} className="lg:w-6 lg:h-6" strokeWidth={2.5} />
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchId}
                                    onChange={(e) => {
                                        setSearchId(e.target.value);
                                        if(inputError) setInputError(false);
                                    }}
                                    className={`flex-1 bg-transparent border-none outline-none font-bold placeholder:text-slate-300 placeholder:font-medium h-12 lg:h-14 w-full text-lg ${inputError ? 'text-red-600' : 'text-slate-800'}`}
                                    placeholder="ระบุ Case ID..."
                                    disabled={isSearching}
                                />
                                {searchId && !isSearching && (
                                    <button 
                                        type="button" 
                                        onClick={() => setSearchId("")}
                                        className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={isSearching}
                                    className={`rounded-full px-6 py-2.5 font-bold text-sm transition-all duration-300 shadow-md transform active:scale-95 flex items-center gap-2 text-white min-w-[100px] justify-center ml-1 ${inputError ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                                >
                                    {isSearching ? <span className="loading loading-spinner loading-xs"></span> : "ค้นหา"}
                                </button>
                            </div>
                        </form>
                        {inputError && (
                            <div className="absolute top-full left-0 right-0 mt-3 text-center animate-fade-in z-20">
                                <span className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2 rounded-full border border-red-100 shadow-sm inline-flex items-center gap-1">
                                    <AlertCircle size={14}/> กรุณาระบุ ID
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- Wizard Content (Step 1, 2, 3) --- */}
        {currentCase && (
           <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-5 lg:p-10 relative overflow-hidden transition-all duration-300 mb-6 animate-fade-in-up">
                
                {/* Wizard Progress */}
                {!isSuccess && (
                    <div className="mb-8 lg:mb-12">
                        <div className="flex items-center justify-center relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                            <div className={`absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500 ease-out`} style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}></div>
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="relative flex flex-col items-center flex-1">
                                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center font-bold text-base lg:text-lg border-4 transition-all duration-300 z-10 bg-white ${wizardStep >= step ? 'border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-200 scale-110' : 'border-slate-200 text-slate-300'}`}>
                                                        {step}
                                    </div>
                                    <span className={`absolute top-12 lg:top-14 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${wizardStep >= step ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                        {step === 1 ? 'Select' : step === 2 ? 'Upload' : 'Reason'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step Content */}
                <div className="min-h-[300px] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                    
                    {isSuccess ? (
                          <div className="text-center py-6 lg:py-10 animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] w-full">
                            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
                                <CheckCircle2 size={40} className="lg:w-12 lg:h-12" />
                            </div>
                            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm lg:text-base">ระบบได้ทำการอัปเดตข้อมูลไฟล์แนบเรียบร้อยแล้ว</p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left max-w-sm mx-auto mb-8 space-y-3 shadow-sm">
                                <div><p className="text-xs text-slate-400 font-bold uppercase">Case ID</p><p className="font-bold text-slate-800">{currentCase.id}</p></div>
                                <div><p className="text-xs text-slate-400 font-bold uppercase">Replaced File</p><p className="font-bold text-indigo-600 truncate">{selectedImageToReplace?.type}</p></div>
                                <div><p className="text-xs text-slate-400 font-bold uppercase">New File Name</p><p className="font-bold text-slate-800 truncate">{newImageFile?.name}</p></div>
                            </div>
                            <button onClick={resetForm} className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg">กลับหน้าหลัก</button>
                        </div>
                    ) : (
                        <>
                        {/* STEP 1: Select */}
                        {wizardStep === 1 && (
                            <div className="w-full max-w-3xl animate-fade-in">
                                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                                    <div className="p-5 md:p-8">
                                        {/* Header */}
                                        <div className="text-center mb-8">
                                            <h3 className="text-xl lg:text-2xl font-bold text-slate-800">Step 1: เลือกรายการที่ต้องการแก้ไข</h3>
                                            <p className="text-slate-500 text-sm mt-1">คลิกเลือกรูปภาพ, วิดีโอ หรือไฟล์เสียงที่ต้องการดำเนินการ</p>
                                        </div>
                                        
                                        {/* --- Case Info Card --- */}
                                        <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 mb-8 flex flex-col gap-4">
                                            {/* Row 1: ID & Status */}
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-2"> 
                                                <div className="flex items-center justify-between w-full gap-3"> 
                                                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden"> 
                                                        <span className="text-slate-400 font-bold text-xs shrink-0">ID:</span>
                                                        <span className="text-slate-700 font-bold text-sm truncate">
                                                            {currentCase.id}
                                                        </span>
                                                    </div>
                                                    <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-indigo-100 text-indigo-600 border border-indigo-200`}>
                                                        {currentCase.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Separator Line */}
                                            <div className="h-px bg-slate-200 w-full"></div>

                                            {/* Row 2: Title & Date */}
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800 leading-tight">
                                                    {currentCase.title}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                                                    <Calendar size={14} className="text-slate-400"/>
                                                    <span>แจ้งเมื่อ: {currentCase.date}</span>
                                                </div>
                                            </div>

                                            {/* Row 3: Address */}
                                            <div className="bg-white rounded-xl p-3 border border-slate-200/60 flex items-start gap-3 shadow-sm">
                                                <MapPin size={18} className="text-indigo-500 mt-0.5 shrink-0"/>
                                                <div className="text-sm text-slate-600 leading-relaxed">
                                                    {currentCase.department}
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- Media Section --- */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4 px-1">
                                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <ImageIcon size={18} />
                                                </div>
                                                <h5 className="font-bold text-slate-800 text-base">รายการไฟล์ประกอบ:</h5>
                                            </div>

                                            {/* Grid Layout */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                                {currentCase.allImages.map((img) => {
                                                    const isSelected = selectedImageToReplace?.id === img.id;
                                                    return (
                                                        <div 
                                                            key={img.id}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setSelectedImageToReplace(null);
                                                                } else {
                                                                    setSelectedImageToReplace(img);
                                                                }
                                                            }}
                                                            className={`
                                                                relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group border-2
                                                                ${isSelected 
                                                                    ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg scale-[1.02] z-10 bg-indigo-50' 
                                                                    : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-indigo-200/50 hover:shadow-md'
                                                                }
                                                            `}
                                                        >
                                                                {/* Media Content */}
                                                                <div className="aspect-video w-full flex items-center justify-center bg-slate-900/5 relative overflow-hidden rounded-t-lg">
                                                                        {img.mediaType === 'video' ? (
                                                                            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                                                                                    <video 
                                                                                        src={img.url} 
                                                                                        className="w-full h-full object-contain bg-black" 
                                                                                        controls={false}
                                                                                        playsInline
                                                                                    />
                                                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                                            <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                                                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                                                                            </div>
                                                                                    </div>
                                                                            </div>
                                                                        ) : img.mediaType === 'audio' ? (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 text-amber-500">
                                                                                    <Music size={28} />
                                                                                    <span className="text-xs font-bold mt-2">AUDIO</span>
                                                                            </div>
                                                                        ) : img.mediaType === 'file' ? (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                                                                                <UploadCloud size={32} />
                                                                                <span className="text-[10px] font-bold mt-1 uppercase">{img.url.split('.').pop()}</span>
                                                                            </div>
                                                                        ) : (                                                            
                                                                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={img.type} />
                                                                        )}
                                                                        {!isSelected && (
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                                                                                    <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                                                                        เลือกรายการนี้
                                                                                    </span>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                                {/* Info Strip */}
                                                                <div className={`p-3 flex justify-between items-center transition-colors ${isSelected ? 'bg-indigo-50' : 'bg-white/50 group-hover:bg-indigo-50/30'}`}>
                                                                        <span className={`text-xs font-bold truncate max-w-[45%] ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                                            {img.type}
                                                                        </span>
                                                                        <div className="flex items-center gap-2">
                                                                                {!isSelected && (
                                                                                    <span className="text-[10px] text-red-500 font-bold whitespace-nowrap animate-pulse">
                                                                                        แตะตรงนี้เพื่อเลือก
                                                                                    </span>
                                                                                )}
                                                                                {isSelected ? (
                                                                                    <CheckCircle2 size={20} className="text-indigo-600 animate-[bounceIn_0.3s_ease-out] shrink-0"/>
                                                                                ) : (
                                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-indigo-300 transition-colors bg-blue-100 shrink-0"></div>
                                                                                )}
                                                                        </div>
                                                                </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                            {/* STEP 2: Upload */}
                            {wizardStep === 2 && (
                                <div className="w-full max-w-xl mx-auto animate-fade-in">
                                    <div className="text-center mb-6 lg:mb-8">
                                        <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-2">อัปโหลดไฟล์ใหม่</h3>
                                        <p className="text-slate-500 text-sm">เลือกไฟล์เพื่อแทนที่รายการเดิม</p>
                                    </div>

                                    {selectedImageToReplace && (
                                        <div className="mb-6 lg:mb-8 w-full max-w-sm mx-auto flex flex-col items-center p-4 lg:p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-bold mb-3 flex items-center gap-1 uppercase tracking-[0.2em] text-slate-400">
                                                <AlertCircle size={12}/> กำลังแก้ไขไฟล์เดิม
                                            </p>
                                            
                                            {/* Preview Box */}
                                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner">
                                                <FilePreviewRender file={{
                                                    url: selectedImageToReplace.url,
                                                    name: selectedImageToReplace.url
                                                }} /> 
                                            </div>
                                            
                                            <p className="text-xs font-bold mt-3 text-slate-500">
                                                {selectedImageToReplace.type}
                                            </p>
                                        </div>
                                    )}
                                    <label className={`group relative flex flex-col items-center justify-center w-full min-h-[18rem] lg:min-h-[22rem] h-auto p-4 lg:p-6 rounded-3xl border-3 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${newImageFile ? 'border-green-400 bg-white' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-100/50'}`}>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*, video/*, audio/*, text/*, application/*, .jpg, .jpeg, .png, .gif, .mp4, .mov, .webm, .mp3, .wav, .m4a"
                                        onChange={(e) => {
                                            if(e.target.files[0]) setNewImageFile(e.target.files[0]);
                                        }} 
                                    />
                                    
                                    {newImageFile ? (
                                            <div className="flex flex-col items-center w-full animate-fade-in z-10">
                                                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center mb-4 min-h-[200px]">
                                                    <FilePreviewRender file={newImageFile} />
                                                </div>
                                                <span className="font-bold text-base lg:text-lg text-slate-800 mb-1 truncate max-w-[90%]">{newImageFile.name}</span>
                                                <span className="text-xs lg:text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                                                    <CheckCircle2 size={12}/> พร้อมอัปโหลด
                                                </span>
                                                <p className="text-xs text-slate-400 mt-2 font-medium">แตะเพื่อเปลี่ยนไฟล์</p>
                                            </div>
                                        ) : (
                                        <div className="flex flex-col items-center z-10 p-4 lg:p-6 transition-transform duration-300 group-hover:scale-105 text-center">
                                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-2xl mb-4 lg:mb-6 flex items-center justify-center shadow-sm border border-slate-100 group-hover:shadow-md group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all text-slate-300"><UploadCloud size={32} className="lg:w-10 lg:h-10" strokeWidth={1.5} /></div>
                                            <h4 className="font-bold text-base lg:text-lg text-slate-700 mb-2 group-hover:text-indigo-700 transition-colors">เลือกไฟล์มีเดีย</h4>
                                            <p className="text-slate-400 text-xs lg:text-sm mb-4 lg:mb-6">แตะเพื่อเลือกไฟล์ รูปภาพ, วิดีโอ หรือเสียง</p>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                <span className="bg-white px-2 py-1 rounded border border-slate-100">IMG</span>
                                                <span className="bg-white px-2 py-1 rounded border border-slate-100">VID</span>
                                                <span className="bg-white px-2 py-1 rounded border border-slate-100">MP3</span>
                                            </div>
                                        </div>
                                    )}
                                    {!newImageFile && (<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>)}
                                    </label>
                                </div>
                            )}

                            {/* STEP 3: Reason */}
                            {wizardStep === 3 && (
                                <div className="w-full max-w-xl text-center animate-fade-in">
                                    <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-1">Step 3: สรุปผลและระบุเหตุผล</h3>
                                    <p className="text-slate-500 mb-6 lg:mb-8 text-xs lg:text-sm">ระบุสาเหตุในการเปลี่ยนแปลงไฟล์ <span className="font-bold text-indigo-600">{selectedImageToReplace?.type}</span></p>
                                    
                                    {newImageFile && (
                                        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ไฟล์ใหม่ที่จะใช้งาน</p>
                                            <div className="relative w-full rounded-lg overflow-hidden shadow-md border border-slate-200 bg-white flex items-center justify-center min-h-[150px]">
                                                {/* เปลี่ยนจากการเช็คเงื่อนไขซ้ำซ้อน มาใช้ Component ตัวเดียวกับหน้า Upload */}
                                                <FilePreviewRender file={newImageFile} />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2 font-medium">{newImageFile.name}</p>
                                            {/* เพิ่มการแสดงขนาดไฟล์เพื่อให้ Admin ตรวจสอบก่อนกดยืนยัน */}
                                            <p className="text-[10px] text-slate-300">Size: {(newImageFile.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <textarea 
                                            className="textarea textarea-bordered w-full h-32 lg:h-40 text-base lg:text-lg shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" 
                                            placeholder="พิมพ์เหตุผลที่ต้องเปลี่ยนไฟล์..." 
                                            value={reason} 
                                            onChange={(e) => setReason(e.target.value)}
                                        ></textarea>
                                        <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-300 pointer-events-none">{reason.length} CHARS</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* --- FOOTER BUTTONS --- */}
                {!isSuccess && (
                    <div className="flex flex-row justify-between items-center mt-8 lg:mt-10 pt-6 border-t border-slate-100 gap-4">
                        {/* Left Button (Cancel/Back) */}
                        {wizardStep === 1 ? (
                            <button 
                                onClick={resetForm} 
                                className="px-6 py-3 bg-white border-2 border-red-100 text-red-500 rounded-full text-base font-bold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all shadow-sm flex items-center justify-center gap-2 group flex-1 sm:flex-none"
                            >
                                <div className="p-1 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                                    <X size={18} className="lg:w-5 lg:h-5" strokeWidth={3} />
                                </div>
                                <span>ยกเลิก</span>
                            </button>
                        ) : (
                            <button 
                                onClick={() => setWizardStep(p => p - 1)} 
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full text-base font-bold hover:bg-slate-200 hover:text-slate-800 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                            >
                                <ArrowLeft size={22} className="lg:w-6 lg:h-6"/> 
                                <span>ย้อนกลับ</span>
                            </button>
                        )}

                        {/* Right Button (Next/Submit) */}
                        {wizardStep < 3 ? (
                            <button 
                                onClick={() => setWizardStep(p => p + 1)} 
                                disabled={(wizardStep === 1 && !selectedImageToReplace) || (wizardStep === 2 && !newImageFile)} 
                                className="px-8 py-3 bg-indigo-600 text-white rounded-full text-base font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex-1 sm:flex-none"
                            >
                                <span>ถัดไป</span>
                                <ArrowRight size={22} className="lg:w-6 lg:h-6" strokeWidth={3}/>
                            </button>
                        ) : (
                            <button 
                                onClick={handleUpdateImage} 
                                disabled={!reason.trim() || isSubmitting} 
                                className="px-8 py-3 bg-emerald-500 text-white rounded-full text-base font-bold hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none disabled:shadow-none flex-1 sm:flex-none"
                            >
                                {isSubmitting ? (
                                    <span className="loading loading-spinner loading-md"></span>
                                ) : (
                                    <CheckCircle2 size={22} className="lg:w-6 lg:h-6" strokeWidth={3}/>
                                )}
                                <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการแก้ไข'}</span>
                            </button>
                        )}
                    </div>
                )}
           </div>
        )}

      </div>
      <style jsx global>{`@keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } } @keyframes slide-in-left { from { transform: translateX(-100%); } to { transform: translateX(0); } } .animate-slide-in-left { animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`}</style>
    </div>
  );
}