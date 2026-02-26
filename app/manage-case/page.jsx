'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { 
  LogOut, Search, CheckCircle2, AlertCircle, UploadCloud, 
  ArrowLeft, ArrowRight, X, ImageIcon, Music, FileAudio, 
  MapPin, Calendar, Users ,Mail, Briefcase, LayoutGrid, Menu,
  // เพิ่ม icon สำหรับไทม์ไลน์
  Activity, Filter, Edit3, ShieldCheck, RefreshCw, FileText
} from "lucide-react"; 
import Link from 'next/link';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 

// ✅ นำเข้า Sidebar จากไฟล์ภายนอกตามที่คุณต้องการ
import Sidebar from "../components/sidebar"; 

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

const STORAGE_BASE_URL = "https://storage.googleapis.com/traffy_public_bucket/";

// --- ข้อมูลสำหรับ Timeline ---
const TIMELINE_DATA = [
 { id: 1, type: "edit", action: "แก้ไขรูปภาพเคส", detail: "เปลี่ยนรูปภาพประกอบเนื่องจากรูปเดิมไม่ชัดเจน", user: "ธนกฤต แอดมิน", time: "10 นาทีที่แล้ว" },
 { id: 2, type: "security", action: "อัปเดตสิทธิ์", detail: "ตรวจสอบข้อมูลเคสโดย Admin", user: "ศิริลักษณ์ ระบบ", time: "2 ชั่วโมงที่แล้ว" },
 { id: 3, type: "restore", action: "กู้คืนข้อมูล", detail: "กู้คืนไฟล์แนบเดิมจากฐานข้อมูล", user: "Super Admin", time: "เมื่อวานนี้, 14:30" }
];

const getTypeStyles = (type) => {
 switch (type) {
   case 'edit': return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <Edit3 size={16} strokeWidth={2.5} />, border: 'border-indigo-100' };
   case 'security': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <ShieldCheck size={16} strokeWidth={2.5} />, border: 'border-amber-100' };
   case 'restore': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <RefreshCw size={16} strokeWidth={2.5} />, border: 'border-emerald-100' };
   default: return { bg: 'bg-slate-50', text: 'text-slate-600', icon: <FileText size={16} strokeWidth={2.5} />, border: 'border-slate-100' };
 }
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

const getFileStyle = (ext) => {
    if (ext === 'pdf') return { bg: 'bg-red-100', text: 'text-red-500', iconBg: 'bg-white' };
    if (['doc', 'docx'].includes(ext)) return { bg: 'bg-blue-100', text: 'text-blue-500', iconBg: 'bg-white' };
    if (['csv', 'xls', 'xlsx'].includes(ext)) return { bg: 'bg-emerald-100', text: 'text-emerald-500', iconBg: 'bg-white' };
    return { bg: 'bg-slate-100', text: 'text-slate-500', iconBg: 'bg-white' };
};

const FilePreviewRender = ({ file }) => {
    const [previewUrl, setPreviewUrl] = useState("");
    const type = getMediaTypeFromFile(file);
    
    useEffect(() => {
        let url = "";
        
        if (file instanceof File) {
            // สร้าง URL สำหรับไฟล์ที่เลือกจากเครื่อง
            url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            // จัดการ Path จาก Database
            const rawPath = file.url || file.photo || file;
            if (typeof rawPath === 'string') {
                // ถ้าเป็น URL เต็มอยู่แล้ว หรือเป็น blob ไม่ต้องต่อ Base
                url = (rawPath.startsWith('blob:') || rawPath.startsWith('http'))
                    ? rawPath
                    : STORAGE_BASE_URL + rawPath;
                setPreviewUrl(url);
            }
        }

        // Cleanup function: ล้าง URL ออกจากหน่วยความจำเมื่อ Component ถูกทำลาย
        return () => {
            if (url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        };
    }, [file]);

    const fileName = file.name || (typeof file === 'string' ? file : 'Unknown File');
    const extension = fileName.split('.').pop().toLowerCase();
    const style = getFileStyle(extension);

    if (!previewUrl) return null;

    switch (type) {
        case 'image':
            return <img src={previewUrl} className="w-full max-h-[50vh] object-contain mx-auto" alt="Preview" />;
        case 'video':
            return <video src={previewUrl} className="w-full max-h-[50vh] object-contain mx-auto" controls autoPlay muted playsInline />;
        case 'audio':
            return (
                <div className="w-full min-h-[150px] flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600 p-6">
                    <Music size={48} className="mb-3" />
                    <audio src={previewUrl} controls className="w-full" />
                </div>
            );
        default:
            return (
               <div className={`w-full h-full flex flex-col items-center justify-center ${style.bg} transition-all duration-300 min-h-[inherit]`}>
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-2">
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
  const [currentRoles, setCurrentRoles] = useState([]); 

  // State สำหรับ Desktop Sidebar (Toggle)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

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

  // Helper: ดึง ID ตัวเองจาก LocalStorage
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  };

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
                        
                        // ✅ ปรับ Logic การตรวจสอบประเภทไฟล์ใหม่ทั้งหมด
                        let mType = 'image'; // Default เป็น image สำหรับ viewed = 0
                        
                        const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(fileUrl);
                        const isAudio = /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileUrl);
                        const isFile = /\.(zip|7z|rar|pdf|doc|docx|rtf|csv|xls|xlsx|ppt|pptx|txt)$/i.test(fileUrl);

                        if (item.viewed === 1 || isVideo) {
                            mType = 'video';
                        } else if (item.viewed === 3 || isAudio) {
                            mType = 'audio';
                        } else if (item.viewed === 2 || isFile) {
                            mType = 'file';
                        } else {
                            mType = 'image';
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
        const newViewedValue = getMediaTypeValue(newImageFile);      
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
        // ✅ นำ Logic จาก ManageOrgPage มาใช้ตรงนี้
        // ตัด Domain ออกเพื่อให้เหลือเฉพาะ Path เช่น attachment/case_123/file.jpg
        const relativePath = result.photo_link.replace(STORAGE_BASE_URL, "");

        const adminId = localStorage.getItem("current_admin_id") || "unknown_admin";

        const dbPayload = {
            current_admin_id: adminId.toString().replace(/['"]+/g, ''), 
            photo_id: selectedImageToReplace.id.toString().replace(/['"]+/g, ''), 
            file_url: relativePath, // 👈 ส่งตัวแปรที่ตัด Domain แล้วเข้าไปแทน
            description: reason,
            viewed: newViewedValue,
            old_url: selectedImageToReplace.url
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
    /* เพิ่มคลาสเพื่อล็อกสีพื้นหลังไม่ให้เปลี่ยนตาม dark mode */
    <div className="min-h-screen bg-[#F4F6F8] dark:bg-[#F4F6F8] font-sans text-slate-900 dark:text-slate-900">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ✅ เรียกใช้คอมโพเนนต์ Sidebar ที่ดึงมาจากภายนอกเพียงจุดเดียว */}
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      {/* ================= MAIN CONTENT ================= */}
      <div className={`container mx-auto px-4 pt-24 lg:pt-8 max-w-[1600px] transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {/* ================= โครงสร้างแบ่ง 2 คอลัมน์ (เนื้อหาซ้าย ไทม์ไลน์ขวา) ================= */}
        <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
            
            {/* คอลัมน์ซ้าย: เนื้อหาหลักเดิม */}
            <div className="flex-1 w-full min-w-0">
                {!currentCase && (
                    <div className="flex flex-col justify-start relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl animate-fade-in pt-12 lg:mt-24">
                        <div className="flex flex-col items-center text-center space-y-5 relative z-10 px-4">
                            <div className="space-y-2 px-2">
                                <p className="text-slate-500 dark:text-slate-500 text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                                    กรอกรหัส Ticket ID เพื่อค้นหาและแก้ไขรูปภาพ<br className="hidden sm:block"/> วิดีโอ หรือไฟล์เสียง (สำหรับ Admin)
                                </p>
                            </div>

                            <div className="w-full relative max-w-lg mx-auto pb-4">
                                <form 
                                    onSubmit={handleSearch} 
                                    className={`relative group transition-all duration-200 ${inputError ? '-translate-x-1' : 'translate-x-0'}`}
                                >
                                    <div className={`relative bg-white dark:bg-white rounded-full shadow-lg border-2 flex items-center p-1.5 lg:p-2 transition-all duration-300 ${inputError ? 'border-red-400 ring-4 ring-red-500/10' : 'border-indigo-50 hover:border-indigo-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'}`}>
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
                                            placeholder="ระบุ Ticket ID..."
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

                {currentCase && (
                <div className="bg-white dark:bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 dark:border-slate-100 p-5 lg:p-10 relative overflow-hidden transition-all duration-300 mb-6 animate-fade-in-up">
                        
                        {!isSuccess && (
                            <div className="mb-8 lg:mb-12">
                                <div className="flex items-center justify-center relative">
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-100 -z-10 rounded-full"></div>
                                    <div className={`absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500 ease-out`} style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}></div>
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className="relative flex flex-col items-center flex-1">
                                            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center font-bold text-base lg:text-lg border-4 transition-all duration-300 z-10 bg-white dark:bg-white ${wizardStep >= step ? 'border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-200 scale-110' : 'border-slate-200 text-slate-300'}`}>
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

                        <div className="min-h-[300px] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                            
                            {isSuccess ? (
                                <div className="text-center py-6 lg:py-10 animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] w-full text-slate-800">
                                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
                                        <CheckCircle2 size={40} className="lg:w-12 lg:h-12" />
                                    </div>
                                    <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h2>
                                    <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm lg:text-base">ระบบได้ทำการอัปเดตข้อมูลไฟล์แนบเรียบร้อยแล้ว</p>
                                    <div className="bg-slate-50 dark:bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left max-w-sm mx-auto mb-8 space-y-3 shadow-sm">
                                        <div><p className="text-xs text-slate-400 font-bold uppercase">Case ID</p><p className="font-bold text-slate-800">{currentCase.id}</p></div>
                                        <div><p className="text-xs text-slate-400 font-bold uppercase">Replaced File</p><p className="font-bold text-indigo-600 truncate">{selectedImageToReplace?.type}</p></div>
                                        <div><p className="text-xs text-slate-400 font-bold uppercase">New File Name</p><p className="font-bold text-slate-800 truncate">{newImageFile?.name}</p></div>
                                    </div>
                                    <button onClick={resetForm} className="w-full sm:w-auto px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg">กลับหน้าหลัก</button>
                                </div>
                            ) : (
                                <>
                                {wizardStep === 1 && (
                                    <div className="w-full max-w-3xl animate-fade-in text-slate-800">
                                        <div className="bg-white dark:bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">
                                            <div className="p-5 md:p-8">
                                                <div className="text-center mb-8">
                                                    <h3 className="text-xl lg:text-2xl font-bold text-slate-800">Step 1: เลือกรายการที่ต้องการแก้ไข</h3>
                                                    <p className="text-slate-500 text-sm mt-1">คลิกเลือกรูปภาพ, วิดีโอ หรือไฟล์เสียงที่ต้องการดำเนินการ</p>
                                                </div>
                                                
                                                <div className="bg-slate-100 dark:bg-slate-100 rounded-2xl p-5 border border-slate-200 mb-8 flex flex-col gap-4">
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
                                                    <div className="h-px bg-slate-200 w-full"></div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-slate-800 leading-tight">
                                                            {currentCase.title}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                                                            <Calendar size={14} className="text-slate-400"/>
                                                            <span>แจ้งเมื่อ: {currentCase.date}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white dark:bg-white rounded-xl p-3 border border-slate-200/60 flex items-start gap-3 shadow-sm">
                                                        <MapPin size={18} className="text-indigo-500 mt-0.5 shrink-0"/>
                                                        <div className="text-sm text-slate-600 leading-relaxed">
                                                            {currentCase.department}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-4 px-1">
                                                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                            <ImageIcon size={18} />
                                                        </div>
                                                        <h5 className="font-bold text-slate-800 text-base">รายการไฟล์ประกอบ:</h5>
                                                    </div>

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
                                                                            ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg scale-[1.02] z-10 bg-indigo-50 dark:bg-indigo-50' 
                                                                            : 'border-transparent bg-slate-50 dark:bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-100 hover:border-indigo-200/50 hover:shadow-md'
                                                                        }
                                                                    `}
                                                                >
                                                                        <div className="aspect-video w-full flex items-center justify-center bg-slate-900/5 dark:bg-slate-900/5 relative overflow-hidden rounded-t-lg">
                                                                            <div className="w-full h-full pointer-events-auto">
                                                                                <FilePreviewRender file={{
                                                                                    url: img.url,
                                                                                    name: img.url,
                                                                                    type: img.mediaType
                                                                                }} />
                                                                            </div>
                                                                            {!isSelected && (
                                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all duration-300 pointer-events-none">
                                                                                    <span className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                                                                        เลือกรายการนี้
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className={`p-3 flex justify-between items-center transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-50' : 'bg-white/50 dark:bg-white/50 group-hover:bg-indigo-50/30'}`}>
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
                                                                                            <CheckCircle2 size={20} className="text-indigo-600 shrink-0"/>
                                                                                        ) : (
                                                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-blue-100 shrink-0"></div>
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
                                {wizardStep === 2 && (
                                    <div className="w-full max-w-xl mx-auto animate-fade-in text-slate-800">
                                        <div className="text-center mb-6 lg:mb-8">
                                            <h3 className="text-xl lg:text-2xl font-black text-slate-800 mb-2">อัปโหลดไฟล์ใหม่</h3>
                                            <p className="text-slate-500 text-sm">เลือกไฟล์เพื่อแทนที่รายการเดิม</p>
                                        </div>

                                        {selectedImageToReplace && (
                                            <div className="mb-6 lg:mb-8 w-full max-w-sm mx-auto flex flex-col items-center p-4 lg:p-5 bg-white dark:bg-white rounded-3xl border border-slate-100 shadow-sm">
                                                <p className="text-[10px] font-bold mb-3 flex items-center gap-1 uppercase tracking-[0.2em] text-slate-400">
                                                    <AlertCircle size={12}/> กำลังแก้ไขไฟล์เดิม
                                                </p>
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
                                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white dark:bg-white rounded-2xl mb-4 lg:mb-6 flex items-center justify-center shadow-sm border border-slate-100 group-hover:shadow-md group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all text-slate-300"><UploadCloud size={32} className="lg:w-10 lg:h-10" strokeWidth={1.5} /></div>
                                                <h4 className="font-bold text-base lg:text-lg text-slate-700 mb-2 group-hover:text-indigo-700 transition-colors">เลือกไฟล์มีเดีย</h4>
                                                <p className="text-slate-400 text-xs lg:text-sm mb-4 lg:mb-6">แตะเพื่อเลือกไฟล์ รูปภาพ, วิดีโอ หรือเสียง</p>
                                            </div>
                                        )}
                                        {!newImageFile && (<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>)}
                                        </label>
                                    </div>
                                )}

                                

                                {wizardStep === 3 && (
                                    <div className="w-full max-w-xl text-center animate-fade-in text-slate-800">
                                        <h3 className="text-lg lg:text-xl font-bold text-slate-800 mb-1">Step 3: สรุปผลและระบุเหตุผล</h3>
                                        <p className="text-slate-500 mb-6 lg:mb-8 text-xs lg:text-sm">
                                            ระบุสาเหตุในการเปลี่ยนแปลงไฟล์ <span className="font-bold text-indigo-600">{selectedImageToReplace?.type}</span>
                                        </p>
                                        <br></br>
                                        <div className="relative">
                                            <textarea 
                                                className="textarea textarea-bordered w-full h-32 lg:h-40 text-base lg:text-lg shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300" 
                                                style={{ backgroundColor: 'white', color: '#0f172a' }} // Force inline style เพื่อความแน่นอน
                                                placeholder="พิมพ์เหตุผลที่ต้องเปลี่ยนไฟล์..." 
                                                value={reason} 
                                                onChange={(e) => setReason(e.target.value)}
                                            ></textarea>
                                            <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-300 pointer-events-none">
                                                {reason.length} CHARS
                                            </div>
                                        </div>
                                    </div>
                                )}
                                                        </>
                        )}
                        </div>

                        {!isSuccess && (
                            <div className="flex flex-row justify-between items-center mt-8 lg:mt-10 pt-6 border-t border-slate-100 gap-4">
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
                                className={`px-8 py-3 rounded-full text-base font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none border-2 ${
                                    reason.trim() && !isSubmitting
                                        ? 'bg-white border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:shadow-lg hover:-translate-y-1' // ใส่เหตุผล: ตัวหนังสือเขียว ขอบเขียว พื้นขาว
                                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' // ยังไม่ใส่เหตุผล: สีเทาทั้งหมด
                                }`}
                            >
                                {isSubmitting ? (
                                    <span className="loading loading-spinner loading-md text-emerald-500"></span>
                                ) : (
                                    <CheckCircle2 
                                        size={22} 
                                        className={`lg:w-6 lg:h-6 ${reason.trim() && !isSubmitting ? 'text-emerald-600' : 'text-slate-400'}`} 
                                        strokeWidth={3}
                                    />
                                )}
                                <span className={reason.trim() && !isSubmitting ? 'text-emerald-600' : 'text-slate-400'}>
                                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการแก้ไข'}
                                </span>
                            </button>
                                )}
                            </div>
                        )}
                </div>
                )}
            </div>

            {/* คอลัมน์ขวา: ไทม์ไลน์ (จะปรากฏเฉพาะเมื่อค้นหาเคสพบ) */}
            {currentCase && (
                <div className="hidden xl:block w-full xl:w-[320px] 2xl:w-[400px] shrink-0 sticky top-8 animate-fade-in-right">
                   <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative w-full">
                     <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-white z-0"></div>
                     <div className="p-4 sm:p-6 pb-4 relative z-10">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                             <Activity size={20} />
                           </div>
                           <div>
                             <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Activity Log</h3>
                             <div className="flex items-center gap-1.5 mt-1.5">
                               <span className="relative flex h-2 w-2">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                               </span>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case Updates</p>
                             </div>
                           </div>
                         </div>
                         <button className="w-10 h-10 shrink-0 bg-white border border-slate-200 hover:border-black hover:bg-black hover:text-white rounded-full flex items-center justify-center text-slate-400 transition-all duration-300 shadow-sm active:scale-95">
                           <Filter size={16} strokeWidth={2.5} />
                         </button>
                       </div>
                     </div>
                     <div className="px-4 sm:px-6 pb-6 relative z-10 max-h-[500px] overflow-y-auto custom-scrollbar">
                       <div className="absolute left-[31px] sm:left-[39px] top-4 bottom-12 w-[2px] bg-slate-100 z-0 rounded-full"></div>
                       <div className="space-y-4 pt-2">
                         {TIMELINE_DATA.map((item) => {
                           const styles = getTypeStyles(item.type);
                           return (
                             <div key={item.id} className="relative flex gap-3 sm:gap-4 group z-10">
                               <div className={`relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl ${styles.bg} ${styles.text} border-2 ${styles.border} flex items-center justify-center transition-all duration-500 group-hover:scale-110 z-20 shadow-sm bg-white`}>
                                 {styles.icon}
                               </div>
                               <div className="flex-1 min-w-0 pt-0.5">
                                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1 sm:gap-2">
                                   <h4 className="text-[11px] sm:text-xs font-black text-slate-900 truncate">{item.action}</h4>
                                   <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 w-fit">{item.time}</span>
                                 </div>
                                 <div className="bg-slate-50 group-hover:bg-white border border-slate-100 group-hover:border-slate-200 rounded-xl p-2.5 sm:p-3 transition-all duration-300">
                                   <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium leading-tight break-words">{item.detail}</p>
                                   <div className="flex items-center gap-1.5 mt-2 opacity-60">
                                     <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] sm:text-[8px] font-bold">{item.user.charAt(0)}</div>
                                     <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 tracking-tight">{item.user}</span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                     <div className="p-4 pt-2 bg-white border-t border-slate-50 relative z-20">
                       <button className="relative w-full py-2.5 sm:py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] shadow-sm text-slate-900">
                         View Case History <ArrowRight size={12} strokeWidth={3} />
                       </button>
                     </div>
                   </div>
                </div>
            )}
        </div>
      </div>

      {/* Global CSS สำหรับการทำอนิเมชั่นเล็ก ๆ น้อย ๆ */}
      <style jsx global>{`
        @keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } } 
        @keyframes slide-in-left { from { transform: translateX(-100%); } to { transform: translateX(0); } } 
        .animate-slide-in-left { animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}