'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, Search, CheckCircle2, AlertCircle, UploadCloud, 
  ArrowLeft, ArrowRight, X, ImageIcon, Music, FileAudio, 
  MapPin, Calendar
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
  // Videos
  'mp4': 'video/mp4',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  'mkv': 'video/x-matroska',
  'wmv': 'video/x-ms-wmv',
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'm4a': 'audio/m4a',
  'flac': 'audio/flac',
  'wma': 'audio/x-ms-wma'
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
    return 'unknown';
};

export default function ManageCase() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
  
  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { 
        setUser(currentUser); 
        setLoading(false); 
      } else { 
        router.push("/"); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        router.push("/");
    } catch (error) {
        console.error("Logout error", error);
    }
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
                        } else if (fileUrl.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/)) {
                            mType = 'audio';
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

    try {
        const base64String = await fileToBase64(newImageFile);
        
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
                description: reason
             };

             const caseIdParam = currentCase.dbId || currentCase.id;

             const dbResponse = await fetch(`${dbManageUrl}?id=${caseIdParam}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbPayload)
             });

             const dbResult = await dbResponse.json();
             
             if (!dbResponse.ok) {
                 throw new Error(dbResult.message || "Database update failed");
             }

             setIsSuccess(true);
        } else {
             throw new Error(result.message || "Upload failed");
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
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-28 lg:pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE ================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-50 px-4 flex justify-between items-center border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-9 h-9 rounded-full ring ring-offset-2 ring-indigo-50">
              <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName}`} alt="User" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-bold text-slate-800 text-sm truncate max-w-[160px]">{user?.displayName || 'Admin User'}</span>
            <span className="text-[10px] text-indigo-500 font-bold uppercase">SYSTEM ADMIN</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-circle btn-sm hover:bg-red-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)] bg-white">
        <div className="flex w-full h-16 border-t border-gray-100">
          <Link href="/manage" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            <span className="text-[10px] font-bold">Email</span>
          </Link>
          <Link href="/manage-case" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-900 bg-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <span className="text-[10px] font-bold">Case</span>
          </Link>
          <Link href="/manage-richmenu" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"></path></svg>
            <span className="text-[10px] font-bold">Menu</span>
          </Link>
        </div>
      </div>

      {/* ================= NAVBAR DESKTOP ================= */}
      <div className="hidden lg:block sticky top-0 z-40 font-sans">
        <div className="navbar bg-white/95 backdrop-blur-xl px-6 lg:px-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border-b border-slate-50/50 transition-all py-3">
            <div className="navbar-start">
                <div className="flex items-center gap-3 group cursor-default">
                    <div className="avatar">
                        <div className="w-11 h-11 rounded-full ring-[3px] ring-primary/20 ring-offset-[3px] ring-offset-white transition-all group-hover:ring-primary/40">
                            <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User" className="object-cover"/>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-extrabold text-slate-800 text-[15px] tracking-tight leading-tight">{user?.displayName || "Admin"}</span>
                        <span className="text-[11px] font-bold text-primary/70 uppercase tracking-wider">System Admin</span>
                    </div>
                </div>
            </div>
            <div className="navbar-center">
                <ul className="menu menu-horizontal px-1 gap-3">
                    <li><a href="/manage" className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-full px-6 py-2.5 font-bold hover:shadow-md hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">จัดการ Email</a></li>
                    <li><a href="/manage-case" className="!bg-slate-900 !text-white shadow-lg shadow-slate-400/50 rounded-full px-6 py-2.5 font-bold hover:!bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">จัดการ Case</a></li>
                    <li><a href="/manage-richmenu" className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-full px-6 py-2.5 font-bold hover:shadow-md hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">จัดการ Menu</a></li>
                </ul>
            </div>
            <div className="navbar-end">
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
        </div>
      </div>


      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 mt-16 lg:mt-12 max-w-4xl">
        
        {/* --- Header & Search Section (แสดงเฉพาะตอนที่ยังไม่มี Case) --- */}
        {!currentCase && (
            <div className="flex flex-col justify-start relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl animate-fade-in pt-12">
        
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
                            {/* Removed blurry background behind input for clarity */}
                            <div className={`relative bg-white rounded-full shadow-lg border-2 flex items-center p-1.5 lg:p-2 transition-all duration-300 ${inputError ? 'border-red-400 ring-4 ring-red-500/10' : 'border-indigo-50 hover:border-indigo-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10'}`}>
                                <div className={`pl-4 pr-3 transition-colors ${inputError ? 'text-red-500' : 'text-slate-400'}`}>
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
                                            {/* Row 1: ID & Status (Mobile Optimized) */}
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
                                        <div className="mb-6 lg:mb-8 w-full max-w-sm mx-auto flex flex-col items-center p-4 lg:p-5 bg-orange-50 rounded-3xl border border-orange-100 text-orange-700/70 shadow-sm">
                                            <p className="text-xs font-bold mb-3 flex items-center gap-1 uppercase tracking-wider">
                                                <AlertCircle size={14}/> กำลังแก้ไขไฟล์เดิม:
                                            </p><br></br>
                                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-orange-200 shadow-sm bg-black flex items-center justify-center">
                                                {selectedImageToReplace.mediaType === 'video' ? (
                                                    <div className="relative w-full h-full bg-black group/video">
                                                        <video src={selectedImageToReplace.url} className="w-full h-full object-contain" controls playsInline />
                                                    </div>
                                                ) : selectedImageToReplace.mediaType === 'audio' ? (
                                                    <div className="flex flex-col items-center p-4 w-full h-full bg-amber-50 justify-center">
                                                        <FileAudio size={40} className="mb-2 text-orange-400"/>
                                                        <audio src={selectedImageToReplace.url} controls className="w-full max-w-[200px]" />
                                                    </div>
                                                ) : (
                                                    <img src={selectedImageToReplace.url} className="h-full w-auto object-contain bg-white" alt="Replacing" />
                                                )}
                                            </div><br></br>
                                            <p className="text-xs lg:text-sm font-bold mt-3 bg-orange-100 px-3 py-1 rounded-full">{selectedImageToReplace.type}</p>
                                        </div>
                                    )}
                                    <label className={`group relative flex flex-col items-center justify-center w-full min-h-[18rem] lg:min-h-[22rem] h-auto p-4 lg:p-6 rounded-3xl border-3 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${newImageFile ? 'border-green-400 bg-white' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-100/50'}`}>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*, video/*, audio/*, .jpg, .jpeg, .png, .gif, .mp4, .mov, .webm, .mp3, .wav, .m4a"
                                            onChange={(e) => {
                                                if(e.target.files[0]) setNewImageFile(e.target.files[0]);
                                            }} 
                                        />
                                        {newImageFile ? (
                                            <div className="flex flex-col items-center w-full animate-fade-in z-10">
                                                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center mb-4 min-h-[200px]">
                                                    {getMediaTypeFromFile(newImageFile) === 'video' ? (
                                                        <div className="relative w-full bg-black">
                                                            <video src={URL.createObjectURL(newImageFile)} className="w-full max-h-[50vh] object-contain mx-auto" controls autoPlay muted playsInline />
                                                        </div>
                                                    ) : getMediaTypeFromFile(newImageFile) === 'audio' ? (
                                                        <div className="w-full min-h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-orange-600 px-6 py-4">
                                                            <FileAudio size={48} className="mb-3 drop-shadow-sm" />
                                                            <p className="text-xs font-bold text-center break-all mb-3 max-w-full">{newImageFile.name}</p>
                                                            <audio src={URL.createObjectURL(newImageFile)} controls className="w-full shadow-sm rounded-lg" />
                                                        </div>
                                                    ) : (
                                                        <img src={URL.createObjectURL(newImageFile)} className="w-full max-h-[50vh] object-contain" alt="Preview" />
                                                    )}
                                                </div>
                                                <span className="font-bold text-base lg:text-lg text-slate-800 mb-1 drop-shadow-sm truncate max-w-[90%]">{newImageFile.name}</span>
                                                <span className="text-xs lg:text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <CheckCircle2 size={12}/> พร้อมอัปโหลด
                                                </span><br></br>
                                                <p className="text-xs text-slate-400 mt-2 group-hover:text-indigo-500 transition-colors font-medium">แตะเพื่อเปลี่ยนไฟล์</p>
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
                                                {getMediaTypeFromFile(newImageFile) === 'video' ? (
                                                    <div className="relative w-full bg-black">
                                                        <video src={URL.createObjectURL(newImageFile)} className="w-full max-h-[50vh] object-contain mx-auto" controls playsInline />
                                                    </div>
                                                ) : getMediaTypeFromFile(newImageFile) === 'audio' ? (
                                                    <div className="flex flex-col items-center justify-center w-full min-h-[150px] bg-amber-50 p-4">
                                                        <FileAudio size={32} className="text-amber-500 mb-2" />
                                                        <audio src={URL.createObjectURL(newImageFile)} controls className="w-full scale-90" />
                                                    </div>
                                                ) : (
                                                    <img src={URL.createObjectURL(newImageFile)} className="w-full max-h-[50vh] object-contain" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">{newImageFile.name}</p>
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
      <style jsx global>{`@keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }`}</style>
    </div>
  );
}