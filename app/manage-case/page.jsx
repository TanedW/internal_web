'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { 
  LogOut, Search, CheckCircle2, AlertCircle, UploadCloud, 
  ArrowLeft, ArrowRight, X, ImageIcon, Music, 
  MapPin, Calendar, FolderOpen, Activity, Filter, 
  Edit3, ShieldCheck, RefreshCw, FileText, Settings2, History,
  Layout, Images, EyeOff, Eye
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import Sidebar from "../components/sidebar";

// --- Config: MIME Types ---
const MIME_TYPE_MAP = {
  'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
  'bmp': 'image/bmp', 'webp': 'image/webp', 'heic': 'image/heic', 'heif': 'image/heif',
  'ico': 'image/x-icon', 'tiff': 'image/tiff', 'apng': 'image/apng',
  'mp4': 'video/mp4', 'mov': 'video/quicktime', 'avi': 'video/avi',
  'mkv': 'video/x-matroska', 'wmv': 'video/x-matroska', 'm4v': 'video/m4v', 'mpg': 'video/mpeg', 
  'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'aac': 'audio/aac', 'ogg': 'audio/ogg',
  'm4a': 'audio/m4a', 'x-m4a': 'audio/x-m4a', 'flac': 'audio/flac', 'wma': 'audio/x-ms-wma',
  'zip': 'application/zip', '7z': 'application/x-7z-compressed', 'pdf': 'application/pdf',
  'rar': 'application/vnd.rar', 'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint', 'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'rtf': 'application/rtf', 'csv': 'text/csv', 'txt': 'text/plain', 
};

const STORAGE_BASE_URL = "https://storage.googleapis.com/traffy_public_bucket/";

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
    if (!file || !file.name) return reject("Invalid file");
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
    const fileName = file.name || (typeof file === 'string' ? file : (file.url || file.photo || ""));
    if (!fileName || typeof fileName !== 'string' || !fileName.includes('.')) return 'unknown';
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeType = MIME_TYPE_MAP[extension] || file.type || "";
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
};

const getFileStyle = (ext) => {
    const e = ext?.toLowerCase();
    if (e === 'pdf') return { bg: 'bg-red-100', text: 'text-red-500' };
    if (['doc', 'docx'].includes(e)) return { bg: 'bg-blue-100', text: 'text-blue-500' };
    if (['csv', 'xls', 'xlsx'].includes(e)) return { bg: 'bg-emerald-100', text: 'text-emerald-500' };
    return { bg: 'bg-slate-100', text: 'text-slate-500' };
};

const FilePreviewRender = ({ file }) => {
    const [previewUrl, setPreviewUrl] = useState("");
    if (!file) return null;
    const type = getMediaTypeFromFile(file);
    useEffect(() => {
        let url = "";
        if (file instanceof File) {
            url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            const rawPath = file.url || file.photo || (typeof file === 'string' ? file : "");
            if (rawPath) {
                url = (rawPath.startsWith('blob:') || rawPath.startsWith('http')) ? rawPath : STORAGE_BASE_URL + rawPath;
                setPreviewUrl(url);
            }
        }
        return () => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); };
    }, [file]);
    if (!previewUrl && type !== 'file') return null;
    const fileName = file.name || (typeof file === 'string' ? file : 'file');
    const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : "";
    const style = getFileStyle(extension);
    switch (type) {
        case 'image': return <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />;
        case 'video': return <video src={previewUrl} className="w-full h-full object-cover" muted />;
        default: return (
           <div className={`w-full h-full flex flex-col items-center justify-center ${style.bg} p-4`}>
                <FileText size={48} className={style.text} />
                <span className={`text-xs font-bold uppercase mt-2 ${style.text}`}>.{extension || 'file'}</span>
            </div>
        );
    }
};

export default function ManageCase() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileEditPanel, setShowMobileEditPanel] = useState(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState("manage"); 
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { setUser(currentUser); setLoading(false); } 
      else { router.push("/"); }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSearch = async (e) => {
    e?.preventDefault(); 
    const cleanId = searchId.trim().replace(/^#/, ''); 
    if (!cleanId) { setInputError(true); inputRef.current?.focus(); return; }
    setIsSearching(true);
    setCurrentCase(null);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DB_SEARCH_CASE_API_URL}?id=${cleanId}`);
        const result = await response.json();
        if (response.ok && result.found) {
            const apiData = result.data;
            let allImagesCombined = [];
            if (apiData.timeline) {
    apiData.timeline.forEach((item) => {
        if(item.photo) {
            // ปรับตรงนี้: ตรวจสอบให้แน่ใจว่าได้ค่า Boolean จริงๆ
            // เช็คทั้งกรณีที่เป็น boolean true หรือ เป็น string 'true' หรือ number 1
            const isCover = item.is_cover === true || item.is_cover === "true" || item.is_cover === 1; 
            
            allImagesCombined.push({
                id: item.id, 
                mediaType: getMediaTypeFromFile(item.photo), 
                url: item.photo, 
                status: item.is_hidden ? 'hidden' : 'active', 
                isCover: isCover, // ค่านี้จะเป็น true/false แน่นอนแล้ว
                type: isCover ? "Cover" : "Attachment" 
            });
        }
    });
}
            setCurrentCase({
                id: apiData.ticket_id, dbId: apiData.id, title: apiData.problem_type,
                department: apiData.address, date: apiData.timestamp ? new Date(apiData.timestamp).toLocaleDateString('th-TH') : "N/A",
                allImages: allImagesCombined, status: apiData.status
            });
        } else { alert(result.message || "ไม่พบข้อมูล"); }
    } catch (error) { alert("เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    finally { setIsSearching(false); }
  };

  const handleToggleHideImage = async (imgId, currentStatus) => {
    const newStatus = currentStatus === 'hidden' ? 'active' : 'hidden';
    if (!window.confirm(`คุณต้องการ${newStatus === 'hidden' ? 'ซ่อน' : 'แสดง'}รูปภาพนี้ใช่หรือไม่?`)) return;
    try {
        const adminId = localStorage.getItem("current_admin_id") || "unknown_admin";
        const dbPayload = {
            current_admin_id: adminId.replace(/['"]+/g, ''),
            photo_id: imgId.toString(),
            status: newStatus,
            description: `Admin ${newStatus === 'hidden' ? 'ซ่อน' : 'แสดง'} รูปภาพ`
        };
        const response = await fetch(`${process.env.NEXT_PUBLIC_DB_MANAGE_CASE_API_URL}?id=${currentCase.dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload)
        });
        if (response.ok) {
            setCurrentCase(prev => ({
                ...prev,
                allImages: prev.allImages.map(img => img.id === imgId ? { ...img, status: newStatus } : img)
            }));
        } else { alert("ไม่สามารถเปลี่ยนสถานะรูปภาพได้"); }
    } catch (error) { alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล"); }
  };

  const handleSelectImage = (img) => {
    if (selectedImageToReplace?.id === img.id) {
        setSelectedImageToReplace(null);
    } else {
        setSelectedImageToReplace(img);
    }
  };

  const handleUpdateImage = async () => {
    if (!selectedImageToReplace || !newImageFile || !reason.trim()) return;
    setIsSubmitting(true);
    try {
        const base64String = await fileToBase64(newImageFile);
        const payload = { folder_path: `attachment/case_${currentCase.id}`, image: base64String };
        const response = await fetch(process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), 
        });
        const result = await response.json();
        if (response.ok) { setIsSuccess(true); }
    } catch (error) { alert(`เกิดข้อผิดพลาด: ${error.message}`); }
    finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    setSearchId(""); setCurrentCase(null); setNewImageFile(null);
    setReason(""); setWizardStep(1); setIsSuccess(false); setSelectedImageToReplace(null);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

 return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-900">
      <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

<div className={`container mx-auto px-4 pt-16 lg:pt-6 max-w-[1600px] transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-96" : "lg:pl-24"}`}>
  <br />
  <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
      <div className={`flex-1 w-full min-w-0 ${activeTab === "timeline" && currentCase ? "hidden xl:block" : "block"}`}>
  
  {!currentCase && (
    <div className="flex flex-col justify-start w-full max-w-4xl mx-auto pt-2 lg:mt-4 animate-fade-in">
      <header className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
          <FolderOpen size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1.5 tracking-tight">
            จัดการ <span className="text-indigo-600">Case</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs sm:text-sm">ค้นหา Ticket ID เพื่อจัดการรูปภาพประกอบ</p>
        </div>
      </header>
      <div className="w-full px-4 sm:px-0"> 
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
          <div className={`relative w-full sm:flex-1 bg-white rounded-2xl shadow-sm border-2 flex items-center h-14 sm:h-16 px-5 ${inputError ? 'border-red-400' : 'border-slate-100 focus-within:border-indigo-500'}`}>
            <Search size={22} className="text-indigo-600" />
            <input
              ref={inputRef}
              type="text"
              value={searchId}
              onChange={(e) => { setSearchId(e.target.value); setInputError(false); }}
              className="flex-1 bg-transparent border-none outline-none font-bold ml-3 text-slate-800"
              placeholder="ระบุ Ticket ID..."
            />
          </div>
          <button type="submit" className="btn !h-[60px] px-10 !bg-black !text-white !font-bold !rounded-2xl shadow-lg">
            {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
          </button>
        </form>
      </div>
    </div>
  )}

 {currentCase && (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-5 lg:p-10 relative overflow-hidden mb-6">
        {!isSuccess && (
            <div className="mb-12">
                <div className="flex items-center justify-between max-w-md mx-auto relative">
                    <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100 -z-0"></div>
                    {[1, 2, 3].map((step) => (
                        <div key={step} className="relative flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all ${
                                wizardStep === step 
                                ? 'bg-white border-[3px] border-indigo-600 text-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] scale-110' 
                                : wizardStep > step ? 'bg-indigo-600 text-white' : 'bg-white border-[3px] border-slate-100 text-slate-300'
                            }`}>
                                {wizardStep > step ? <CheckCircle2 size={18} /> : step}
                            </div>
                            <span className={`mt-2 text-[10px] font-black uppercase tracking-widest ${wizardStep >= step ? 'text-indigo-600' : 'text-slate-300'}`}>
                                {step === 1 ? 'SELECT' : step === 2 ? 'UPLOAD' : 'REASON'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="min-h-[300px] flex flex-col items-center">
            {isSuccess ? (
                <div className="text-center py-10 animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} /></div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h2>
                    <button onClick={resetForm} className="mt-8 px-8 py-3 bg-slate-800 text-white font-bold rounded-2xl shadow-lg">กลับหน้าหลัก</button>
                </div>
            ) : (
                <div className="w-full">
                {wizardStep === 1 && (
                    <div className="w-full animate-fade-in">
                        <div className="text-center mb-10">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Step 1: เลือกรายการที่ต้องการแก้ไข</h3>
                            <p className="text-slate-400 font-bold text-sm">คลิกเลือกรูปภาพประกอบที่ต้องการจัดการ</p>
                        </div>

                        <div className="max-w-6xl mx-auto space-y-12">
                            {/* ส่วนหน้าปก */}
                            <div>
                                <h5 className="font-black text-slate-800 mb-6 flex items-center gap-3 px-2 text-lg uppercase">
                                    <Layout size={24} className="text-indigo-600" /> หน้าปก (Cover Image)
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {currentCase.allImages.filter(img => img.isCover).map((img) => (
                                        <ImageCard 
                                            key={img.id} 
                                            img={img} 
                                            isSelected={selectedImageToReplace?.id === img.id}
                                            onSelect={() => handleSelectImage(img)}
                                            onToggleHide={() => handleToggleHideImage(img.id, img.status)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* ส่วนรูปประกอบ */}
                            <div>
                                <h5 className="font-black text-slate-800 mb-6 flex items-center gap-3 px-2 text-lg uppercase">
                                    <Images size={24} className="text-indigo-600" /> รูปประกอบอื่นๆ
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {/* กรองเฉพาะอันที่เป็น false มาลงที่นี่ */}
                                {currentCase.allImages.filter(img => !img.isCover).map((img) => (
                                    <ImageCard 
                                        key={img.id} 
                                        img={img} 
                                        isSelected={selectedImageToReplace?.id === img.id}
                                        onSelect={() => handleSelectImage(img)}
                                        onToggleHide={() => handleToggleHideImage(img.id, img.status)}
                                    />
                                ))}
                            </div>
                            </div>
                        </div>
                    </div>
                )}

                {wizardStep === 2 && (
    <div className="w-full max-w-3xl mx-auto animate-fade-in text-center">
        <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">อัปโหลดไฟล์ใหม่</h3>
        <p className="text-slate-400 font-bold text-sm mb-10">เปรียบเทียบและเลือกไฟล์ใหม่เพื่อแทนที่รายการเดิม</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center justify-center">
            {/* --- ฝั่งรูปเก่า (Current File) --- */}
            <div className="flex flex-col items-center">
                <div className="mb-4 flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ไฟล์เดิม</p>
                </div>
                
                <div className="w-full max-w-[280px] aspect-square rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-50 relative group">
                    <FilePreviewRender file={selectedImageToReplace} />
                    {/* Overlay บอกประเภทเบาๆ ด้านล่าง */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute bottom-4 left-0 right-0">
                        <p className="text-white text-[10px] font-black uppercase tracking-tighter">
                            {selectedImageToReplace?.isCover ? "Cover Image" : "Attachment"}
                        </p>
                    </div>
                </div>
            </div>

            {/* ไอคอนลูกศรคั่นกลาง (แสดงเฉพาะจอใหญ่) */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-20 w-12 h-12 bg-indigo-600 text-white rounded-2xl items-center justify-center shadow-xl border-4 border-[#F4F6F8]">
                <ArrowRight size={24} strokeWidth={3} />
            </div>

            {/* --- ฝั่งรูปใหม่ (New File) --- */}
            <div className="flex flex-col items-center">
                <div className="mb-4 flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ไฟล์ใหม่</p>
                </div>

                <label className={`relative flex flex-col items-center justify-center w-full max-w-[280px] aspect-square rounded-[2.5rem] border-4 border-dashed transition-all duration-500 cursor-pointer overflow-hidden ${
                    newImageFile 
                    ? 'border-green-400 bg-white shadow-2xl scale-100' 
                    : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:scale-105 shadow-sm'
                }`}>
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*, video/*, audio/*"
                        onChange={(e) => {
                            if(e.target.files[0]) setNewImageFile(e.target.files[0]);
                        }} 
                    />
                    
                    {newImageFile ? (
                        <div className="w-full h-full p-0 animate-fade-in">
                            <div className="w-full h-full shadow-inner">
                                <FilePreviewRender file={newImageFile} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-sm mx-auto mb-4 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                <UploadCloud size={40} strokeWidth={1.5} />
                            </div>
                            <p className="font-black text-slate-700 uppercase tracking-widest text-xs">คลิกเลือกไฟล์</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 leading-relaxed uppercase">Image / Video / Audio</p>
                        </div>
                    )}
                </label>
            </div>
        </div>

        {newImageFile && (
            <div className="mt-10 animate-bounce">
                <div className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg">
                    <CheckCircle2 size={18} strokeWidth={3} />
                    <span className="text-xs font-black uppercase tracking-widest">พร้อมเปลี่ยนรูปภาพ</span>
                </div>
            </div>
        )}
    </div>
)}

                {wizardStep === 3 && (
                    <div className="w-full max-w-xl mx-auto animate-fade-in">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-black text-slate-800 mb-1">Step 3: สรุปผลและระบุเหตุผล</h3>
                            <p className="text-slate-400 font-bold text-sm">ระบุสาเหตุในการเปลี่ยนไฟล์ <span className="text-indigo-600">{selectedImageToReplace?.isCover ? "Cover Image" : "Attachment"}</span></p>
                        </div>
                        <textarea className="textarea w-full h-48 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 p-6 font-bold text-slate-800 text-lg shadow-inner" placeholder="พิมพ์เหตุผล..." value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                )}
                </div>
            )}
        </div>

        {!isSuccess && (
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-50 gap-4">
                {wizardStep === 1 ? (
                    <button onClick={resetForm} className="px-10 py-4 bg-white border-2 border-red-50 text-red-500 rounded-2xl text-sm font-black uppercase hover:bg-red-50 flex items-center gap-3 transition-all"><X size={20} /> ยกเลิก</button>
                ) : (
                    <button onClick={() => setWizardStep(p => p - 1)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black uppercase hover:bg-slate-200 flex items-center gap-3 transition-all"><ArrowLeft size={20} /> ย้อนกลับ</button>
                )}
                <button 
                    onClick={() => wizardStep < 3 ? setWizardStep(p => p + 1) : handleUpdateImage()} 
                    disabled={(wizardStep === 1 && !selectedImageToReplace) || (wizardStep === 2 && !newImageFile) || (wizardStep === 3 && !reason.trim())}
                    className={`px-12 py-4 rounded-2xl text-sm font-black uppercase transition-all flex items-center gap-3 ${wizardStep === 3 ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 disabled:opacity-50'}`}
                >
                    {wizardStep === 3 ? (isSubmitting ? "กำลังบันทึก..." : "ยืนยัน") : "ถัดไป"} <ArrowRight size={20} />
                </button>
            </div>
        )}
    </div>
 )}
</div>

      {currentCase && (
        <div className="w-full xl:w-[320px] 2xl:w-[400px] shrink-0 xl:sticky xl:top-8">
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6">
             <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg"><Activity size={20} /></div><h3 className="text-lg font-black text-slate-900 tracking-tight">Activity Log</h3></div>
             <div className="space-y-6">
               {TIMELINE_DATA.map((item) => {
                 const styles = getTypeStyles(item.type);
                 return (
                   <div key={item.id} className="flex gap-4">
                     <div className={`w-9 h-9 shrink-0 rounded-xl ${styles.bg} ${styles.text} flex items-center justify-center border-2 border-white shadow-sm`}>{styles.icon}</div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1"><h4 className="text-xs font-black text-slate-900">{item.action}</h4><span className="text-[8px] font-bold text-slate-400">{item.time}</span></div>
                       <p className="text-[11px] text-slate-500 font-bold leading-tight bg-slate-50 p-3 rounded-2xl">{item.detail}</p>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      )}
    </div>
  </div>

  <style jsx global>{`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `}</style>
</div>
 );
}

function ImageCard({ img, isSelected, onSelect, onToggleHide }) {
    return (
        <div 
            className={`group relative rounded-[2.5rem] overflow-hidden transition-all border-4 aspect-[4/3] shadow-md hover:shadow-xl ${
                isSelected ? 'border-indigo-600 scale-[1.03] z-10' : 'border-white hover:border-slate-200'
            }`}
        >
            {/* พื้นที่รูปภาพ - ลบ Overlay ข้อความออกทั้งหมด */}
            <div className="w-full h-full cursor-pointer relative" onClick={onSelect}>
                <FilePreviewRender file={img} />
                
                {/* Layer ซ่อนรูปภาพ */}
                {img.status === 'hidden' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] flex flex-col items-center justify-center text-white z-20">
                        <EyeOff size={40} className="mb-2 opacity-90" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hidden from Public</span>
                    </div>
                )}
                
                {/* Gradient บางๆ ด้านล่างเพื่อให้มองเห็นสถานะเลือกได้ชัดเจน */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-70"></div>
            </div>

            {/* ปุ่มดวงตา (ซ่อน/แสดง) */}
            <button 
                onClick={(e) => {
                    e.stopPropagation(); 
                    onToggleHide();
                }}
                className={`absolute top-4 right-4 z-30 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${
                    img.status === 'hidden' ? 'bg-indigo-600 text-white' : 'bg-white/90 backdrop-blur text-slate-800 hover:bg-white'
                }`}
            >
                {img.status === 'hidden' ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>

            {/* ส่วนสถานะการเลือกด้านล่าง - ลบ img.type ออกเพื่อไม่ให้มีคำว่า Cover/Attachment กวนใจ */}
            <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end z-30 pointer-events-none">
                <div className="flex-1 min-w-0">
                    {!isSelected && (
                        <span className="text-[10px] text-red-400 font-black animate-pulse drop-shadow-lg uppercase tracking-widest bg-red-950/20 px-2 py-0.5 rounded-lg w-fit">
                             แตะเพื่อเลือก
                        </span>
                    )}
                </div>

                {/* วงกลมแสดงสถานะการเลือก */}
                <div className="flex items-center justify-center ml-2">
                    {isSelected ? (
                        <div className="bg-white rounded-full p-0.5 shadow-xl">
                             <CheckCircle2 size={32} className="text-indigo-600 fill-white" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100/40 border-2 border-white/60 shadow-inner backdrop-blur-sm"></div>
                    )}
                </div>
            </div>
        </div>
    );
}