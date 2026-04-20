'use client';

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { 
  LogOut, Search, CheckCircle2, AlertCircle, UploadCloud, 
  ArrowLeft, ArrowRight, X, ImageIcon, Music, 
  MapPin, Calendar, FolderOpen, Activity, Filter, 
  Edit3, ShieldCheck, RefreshCw, FileText, Settings2, History,
  Layout, Images, EyeOff, Eye, SlidersHorizontal, RotateCcw
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

const STATIC_TIMELINE = [
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
    const [type, setType] = useState('unknown');

    useEffect(() => {
        if (!file) return;
        const currentType = getMediaTypeFromFile(file);
        setType(currentType);

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
    const fileName = file?.name || (typeof file === 'string' ? file : 'file');
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
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);
  const [showMobileEditPanel, setShowMobileEditPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("urgent"); 
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
      if (currentUser) { 
        setUser(currentUser); 
        setLoading(false); 
      } else { 
        router.push("/"); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  const scrollToEdit = () => {
    setShowMobileEditPanel(true);
    setShowMobileTimeline(false); 
  };

const handleSearch = async (e, manualId = null) => {
    e?.preventDefault(); 
    const targetId = manualId || searchId;
    const cleanId = targetId.trim().replace(/^#/, ''); 
    if (!cleanId) { 
        setInputError(true); 
        inputRef.current?.focus(); 
        return; 
    }
    setIsSearching(true);
    setCurrentCase(null);
    if (manualId) setSearchId(manualId);
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_DB_SEARCH_CASE_API_URL}?id=${cleanId}`);
        const result = await response.json();
        if (response.ok && result.found) {
            const apiData = result.data;
            let allImagesCombined = [];
            if (apiData.timeline) {
                apiData.timeline.forEach((item) => {
                    if(item.photo) {
                        const isCover = item.is_cover === true || item.is_cover === "true" || item.is_cover === 1; 
                        allImagesCombined.push({
                            id: item.id, 
                            mediaType: getMediaTypeFromFile(item.photo), 
                            url: item.photo, 
                            status: item.is_hidden ? 'hidden' : 'active', 
                            isCover: isCover,
                            type: isCover ? "Cover" : "Attachment" 
                        });
                    }
                });
            }
            setCurrentCase({
                id: apiData.ticket_id, 
                dbId: apiData.id, 
                title: apiData.problem_type,
                department: apiData.address, 
                date: apiData.timestamp ? new Date(apiData.timestamp).toLocaleDateString('th-TH') : "N/A",
                allImages: allImagesCombined, 
                status: apiData.status
            });
        } else { 
            alert(result.message || "ไม่พบข้อมูล"); 
        }
    } catch (error) { 
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ"); 
    } finally { 
        setIsSearching(false); 
    }
};

const handleToggleHideImage = async (imgId, currentStatus) => {
    if (typeof window === 'undefined') return;
    const currentIsHidden = currentStatus === 'hidden';
    const newIsHidden = !currentIsHidden; 
    const actionText = newIsHidden ? 'ซ่อน' : 'แสดง';
    if (!window.confirm(`คุณต้องการ ${actionText} รูปภาพนี้ใช่หรือไม่?`)) return;
    try {
        const adminId = localStorage.getItem("current_admin_id")?.replace(/['"]+/g, '') || "unknown_admin";
        const dbPayload = {
            current_admin_id: adminId,
            photo_id: imgId.toString(),
            is_hidden: newIsHidden,
            description: `Admin ${actionText} รูปภาพ (ID: ${imgId})`
        };
        const response = await fetch(`${process.env.NEXT_PUBLIC_DB_MANAGE_CASE_API_URL}?id=${currentCase.dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload)
        });
        if (response.ok) {
            setCurrentCase(prev => ({
                ...prev,
                allImages: prev.allImages.map(img => 
                    img.id === imgId 
                    ? { ...img, status: newIsHidden ? 'hidden' : 'active' } 
                    : img
                )
            }));
        } else {
            const err = await response.json();
            alert(`ไม่สามารถ ${actionText} รูปภาพได้: ${err.message}`);
        }
    } catch (error) {
        console.error("Error toggling visibility:", error);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
    }
};

  const handleSelectImage = (img) => {
    if (selectedImageToReplace?.id === img.id) {
        setSelectedImageToReplace(null);
    } else {
        setSelectedImageToReplace(img);
    }
  };

// ปรับปรุงฟังก์ชันใน page.jsx
const handleUpdateImage = async () => {
    // 1. ตรวจสอบความพร้อมของข้อมูล
    if (!selectedImageToReplace || !newImageFile || !reason.trim()) {
        alert("กรุณาเลือกรูปที่ต้องการแทนที่ อัปโหลดไฟล์ใหม่ และระบุเหตุผลให้ครบถ้วน");
        return;
    }

    setIsSubmitting(true);

    try {
        // --- STEP 1: อัปโหลดไฟล์ใหม่ไปยัง Cloud Storage ---
        // แปลงไฟล์เป็น Base64 เพื่อส่งไปยัง File Upload API
        const base64String = await fileToBase64(newImageFile);
        const uploadPayload = { 
            folder_path: `attachment/case_${currentCase.id}`, 
            image: base64String 
        };

        const uploadResponse = await fetch(process.env.NEXT_PUBLIC_FILE_UPLOAD_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadPayload),
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
            throw new Error(uploadResult.message || "Failed to upload file to storage");
        }

        // --- STEP 2: ดึง Link รูปภาพที่อัปโหลดสำเร็จ ---
        // สำคัญ: อิงตาม Response จริงที่คุณส่งมา ต้องใช้ชื่อ 'photo_link'
        const newFileUrl = uploadResult.photo_link; 

        if (!newFileUrl) {
            throw new Error("ไม่ได้รับ photo_link จากระบบฝากไฟล์");
        }

        // --- STEP 3: ส่งข้อมูลไปที่ Manage Case API (POST) เพื่อ Overwrite แถวเดิมใน DB ---
        const adminId = localStorage.getItem("current_admin_id")?.replace(/['"]+/g, '') || "unknown_admin";

        const dbPayload = {
            current_admin_id: adminId,
            photo_id: selectedImageToReplace.id,      // ID เดิมใน voice_attachment ที่จะถูกเขียนทับ
            file_url: newFileUrl,       
            old_url: selectedImageToReplace.url, // *** ส่ง URL เก่าที่มีอยู่ใน State ไปด้วย ***              // URL ใหม่ที่ได้จาก Step 2
            description: reason,                      // เหตุผลจากขั้นตอนที่ 3
            is_cover: selectedImageToReplace.isCover, // คงสถานะหน้าปก (ถ้าเดิมเป็นปก อันใหม่ก็เป็นปก)
            viewed: 0,                                // รีเซ็ตยอดเข้าดูสำหรับไฟล์ใหม่
            is_hidden: false                          // ให้แสดงผลทันทีหลังแทนที่
        };

        const dbResponse = await fetch(`${process.env.NEXT_PUBLIC_DB_MANAGE_CASE_API_URL}?id=${currentCase.dbId}`, {
            method: 'POST', // Backend ของเราตั้ง Logic POST ไว้สำหรับการ Overwrite
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload)
        });

        const dbResult = await dbResponse.json();

        if (dbResponse.ok) {
            // บันทึกสำเร็จ: เปลี่ยนหน้า UI ไปที่หน้า Success (เครื่องหมายถูกสีเขียว)
            setIsSuccess(true);
        } else {
            throw new Error(dbResult.message || "Failed to update database");
        }

    } catch (error) {
        console.error("Update Process Error:", error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
};

  const resetForm = () => {
    setSearchId(""); setCurrentCase(null); setNewImageFile(null);
    setReason(""); setWizardStep(1); setIsSuccess(false); setSelectedImageToReplace(null);
    setShowMobileTimeline(false); setShowMobileEditPanel(false);
  };

const handleSetAsCover = async (imgId) => {
    if (typeof window === 'undefined') return;
    if (!window.confirm("คุณต้องการตั้งรูปนี้เป็นหน้าปกใช่หรือไม่?")) return;
    try {
        const adminId = localStorage.getItem("current_admin_id")?.replace(/['"]+/g, '') || "unknown_admin";
        const dbPayload = {
            current_admin_id: adminId,
            photo_id: imgId.toString(),
            is_cover: true 
        };
        const response = await fetch(`${process.env.NEXT_PUBLIC_DB_MANAGE_CASE_API_URL}?id=${currentCase.dbId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbPayload)
        });
        if (response.ok) {
            setCurrentCase(prev => ({
                ...prev,
                allImages: prev.allImages.map(img => ({
                    ...img,
                    isCover: img.id === imgId, 
                    type: img.id === imgId ? "Cover" : "Attachment",
                    status: img.id === imgId ? 'active' : img.status 
                }))
            }));
            alert("เปลี่ยนรูปหน้าปกสำเร็จ");
        } else {
            alert("ไม่สามารถเปลี่ยนรูปหน้าปกได้");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
};

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

 return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans text-slate-900 overflow-x-hidden">
      <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

<div className={`container mx-auto px-4 pt-16 lg:pt-6 max-w-[1600px] transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-28"}`}>
  <br />
  <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
      <div className={`flex-1 w-full min-w-0 ${showMobileTimeline && currentCase ? "block" : "block"}`}>
  
{!currentCase && (
  <div className="flex flex-col w-full max-w-6xl mx-auto pt-2 lg:mt-4 animate-fade-in space-y-8">
    <header className="flex items-center gap-4 mb-2">
      <div className="w-12 h-12 bg-[#1A1C1E] rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
        <FolderOpen size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-1.5 tracking-tight">
          จัดการ <span className="text-indigo-600">Case</span>
        </h1>
        <p className="text-slate-500 font-bold text-xs sm:text-sm">ค้นหา Ticket ID เพื่อจัดการรูปภาพใน case</p>
      </div>
    </header><br></br>
    
    <div className="w-full"> 
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
        <div className={`relative w-full sm:flex-1 bg-white rounded-2xl shadow-sm border-2 flex items-center h-14 sm:h-16 px-5 transition-all ${inputError ? 'border-red-400' : 'border-slate-100 focus-within:border-indigo-500 focus-within:shadow-md'}`}>
          <Search size={22} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchId}
            onChange={(e) => { setSearchId(e.target.value); setInputError(false); }}
            className="flex-1 bg-transparent border-none outline-none font-bold ml-3 text-slate-800 placeholder:text-slate-400"
            placeholder="ระบุ Ticket ID (เช่น TCK-2024-001)..."
          />
        </div>
        <button type="submit" className="btn !h-[60px] px-10 !bg-black !text-white !font-bold !rounded-2xl shadow-lg">
            {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
          </button>
      </form>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
          <Layout size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">เคสทั้งหมด</p>
          <h3 className="text-2xl font-black text-slate-900">1,248</h3>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
          <CheckCircle2 size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">มีรูปครบถ้วน</p>
          <h3 className="text-2xl font-black text-slate-900">1,120</h3>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
          <AlertCircle size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">รออัปโหลดรูป</p>
          <h3 className="text-2xl font-black text-slate-900">128</h3>
        </div>
      </div>
    </div>

<div className="w-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
  <div className="flex border-b border-slate-50 px-8 pt-6 bg-white overflow-x-auto no-scrollbar">
    <button 
      onClick={() => setActiveTab("urgent")} 
      className={`pb-4 px-6 text-sm font-black transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === "urgent" || activeTab === "manage" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
    >
      ต้องจัดการด่วน (12)
      {(activeTab === "urgent" || activeTab === "manage") && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
    </button>
    <button 
      onClick={() => setActiveTab("history_edit")} 
      className={`pb-4 px-6 text-sm font-black transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === "history_edit" ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
    >
      ประวัติการแก้ไขเคส
      {activeTab === "history_edit" && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></div>}
    </button>
  </div>

  <div className="p-4 sm:p-8 space-y-5 bg-[#FBFCFD]">
    {(activeTab === "urgent" || activeTab === "manage") && (
      <>
        {[
          { id: "TCK-2024-0891", title: "แจ้งปัญหาน้ำรั่วซึม", status: "ขาดรูปปก", statusColor: "bg-orange-50 text-orange-600", coverUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=200&auto=format&fit=crop" },
          { id: "TCK-2024-0885", title: "เปลี่ยนหลอดไฟ", status: "ครบถ้วน", statusColor: "bg-emerald-50 text-emerald-600", coverUrl: "https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=200&auto=format&fit=crop" },
          { id: "TCK-2024-0870", title: "แอร์ไม่เย็น", status: "ขาดรูปประกอบ", statusColor: "bg-orange-50 text-orange-600", coverUrl: null },
          { id: "TCK-2024-0862", title: "ซ่อมปริ้นเตอร์", status: "ครบถ้วน", statusColor: "bg-emerald-50 text-emerald-600", coverUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=200&auto=format&fit=crop" },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-[2rem] bg-white border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-indigo-100 transition-all duration-300 group animate-fade-in" >
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border-4 border-slate-50 shadow-sm ${!item.coverUrl ? (item.status === 'ครบถ้วน' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500') : 'bg-slate-100'}`}>
                {item.coverUrl ? (
                  <img src={item.coverUrl} alt={item.id} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : ( <ImageIcon size={26} /> )}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 text-lg leading-tight">{item.id}</h4>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">{item.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.statusColor} bg-opacity-50 backdrop-blur-sm shadow-sm`}> {item.status} </span>
              <button onClick={() => handleSearch(null, item.id)} className="px-8 py-3 bg-[#FFB800] text-white font-black text-sm rounded-2xl hover:bg-[#F2AF00] hover:shadow-lg hover:shadow-yellow-100 active:scale-95 transition-all duration-200 whitespace-nowrap" > จัดการรูป </button>
            </div>
          </div>
        ))}
      </>
    )}

    {activeTab === "history_edit" && (
      <>
        {[
          { id: "TCK-2024-0552", title: "ท่อน้ำอุดตัน", status: "แก้ไขสำเร็จ", statusColor: "bg-emerald-50 text-emerald-600", editor: "ธนกฤต แอดมิน", editTime: "2 ชั่วโมงที่แล้ว", coverUrl: "https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=200&auto=format&fit=crop" },
          { id: "TCK-2024-0410", title: "ไฟฟ้าทางดับ", status: "แก้ไขสำเร็จ", statusColor: "bg-emerald-50 text-emerald-600", editor: "ธนกฤต แอดมิน", editTime: "เมื่อวานนี้, 14:20", coverUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=200&auto=format&fit=crop" },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-[2rem] bg-white/60 border border-slate-100 shadow-sm opacity-90 hover:opacity-100 hover:bg-white transition-all duration-300 group animate-fade-in" >
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border-4 border-white shadow-sm grayscale-[0.4] group-hover:grayscale-0 transition-all">
                <img src={item.coverUrl} alt={item.id} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-700 text-lg leading-tight">{item.id}</h4>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">โดย: {item.editor}</p>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{item.editTime}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${item.statusColor} bg-opacity-50 backdrop-blur-sm shadow-sm`}>{item.status}</span>
                <button onClick={() => handleSearch(null, item.id)} className="px-6 py-2.5 bg-[#6366F1] text-white font-black text-xs rounded-xl hover:bg-[#4F46E5] hover:shadow-lg hover:shadow-indigo-100 active:scale-95 transition-all duration-200 flex items-center gap-2" >
                    <Eye size={14} strokeWidth={3} /> ดูรายละเอียด
                </button>
            </div>
          </div>
        ))}
      </>
    )}
  </div>
</div>
  </div>
)}


 {currentCase && (
    <div className="w-full space-y-6">
        <div className="xl:hidden grid grid-cols-2 gap-3">
             <button onClick={() => { setShowMobileEditPanel(!showMobileEditPanel); setShowMobileTimeline(false); }} className={`btn h-16 rounded-2xl border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-tight ${showMobileEditPanel ? 'bg-indigo-700 text-white' : 'bg-white text-slate-900 border-2 border-slate-100'}`}>
               <Settings2 size={16} /> {showMobileEditPanel ? 'ปิดการจัดการ' : 'จัดการข้อมูล'}
             </button>
             <button onClick={() => { setShowMobileTimeline(!showMobileTimeline); setShowMobileEditPanel(false); }} className={`btn h-16 rounded-2xl border-none shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-tight ${showMobileTimeline ? 'bg-black text-white' : 'bg-white text-slate-900 border-2 border-slate-100'}`}>
               <History size={16} /> {showMobileTimeline ? 'ปิดไทม์ไลน์' : 'ดูไทม์ไลน์'}
             </button>
        </div>

    {/* Mobile Timeline View */}
    {showMobileTimeline && (
      <div className="xl:hidden animate-fade-in">
          <TimelineContent data={STATIC_TIMELINE} />
      </div>
    )}

    {/* Desktop & Mobile Edit View */}
    <div className={`${showMobileTimeline ? 'hidden xl:block' : 'block'}`}>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-5 lg:p-10 relative overflow-hidden mb-6 animate-fade-in">
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
                              <div>
                                  <h5 className="font-black text-slate-800 mb-6 flex items-center gap-3 px-2 text-lg uppercase">
                                      <Layout size={24} className="text-indigo-600" /> หน้าปก (Cover Image)
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                      {currentCase.allImages.filter(img => img.isCover).map((img) => (
                                          <ImageCard key={img.id} img={img} isSelected={selectedImageToReplace?.id === img.id} onSelect={() => handleSelectImage(img)} onToggleHide={() => handleToggleHideImage(img.id, img.status)} onSetCover={() => handleSetAsCover(img.id)} />
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <h5 className="font-black text-slate-800 mb-6 flex items-center gap-3 px-2 text-lg uppercase">
                                      <Images size={24} className="text-indigo-600" /> รูปประกอบอื่นๆ
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                  {currentCase.allImages.filter(img => !img.isCover).map((img) => (
                                      <ImageCard key={img.id} img={img} isSelected={selectedImageToReplace?.id === img.id} onSelect={() => handleSelectImage(img)} onToggleHide={() => handleToggleHideImage(img.id, img.status)} onSetCover={() => handleSetAsCover(img.id)} />
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
                              <div className="flex flex-col items-center">
                                  <div className="mb-4 flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ไฟล์เดิม</p>
                                  </div>
                                  <div className="w-full max-w-[280px] aspect-square rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-50 relative group">
                                      <FilePreviewRender file={selectedImageToReplace} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
                                      <div className="absolute bottom-4 left-0 right-0">
                                          <p className="text-white text-[10px] font-black uppercase tracking-tighter">{selectedImageToReplace?.isCover ? "Cover Image" : "Attachment"}</p>
                                      </div>
                                  </div>
                              </div>
                              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-20 w-12 h-12 bg-indigo-600 text-white rounded-2xl items-center justify-center shadow-xl border-4 border-[#F4F6F8]">
                                  <ArrowRight size={24} strokeWidth={3} />
                              </div>
                              <div className="flex flex-col items-center">
                                  <div className="mb-4 flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ไฟล์ใหม่</p>
                                  </div>
                                  <label className={`relative flex flex-col items-center justify-center w-full max-w-[280px] aspect-square rounded-[2.5rem] border-4 border-dashed transition-all duration-500 cursor-pointer overflow-hidden ${ newImageFile ? 'border-green-400 bg-white shadow-2xl scale-100' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:scale-105 shadow-sm' }`}>
                                      <input type="file" className="hidden" accept="image/*, video/*, audio/*, text/*, application/*, .jpg, .jpeg, .png, .gif, .mp4, .mov, .webm, .mp3, .wav, .m4a" onChange={(e) => { if(e.target.files[0]) setNewImageFile(e.target.files[0]); }} />
                                      {newImageFile ? (
                                          <div className="w-full h-full p-0 animate-fade-in"> <div className="w-full h-full shadow-inner"> <FilePreviewRender file={newImageFile} /> </div> </div>
                                      ) : (
                                          <div className="text-center p-8">
                                              <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-sm mx-auto mb-4 text-slate-300 group-hover:text-indigo-500 transition-colors"> <UploadCloud size={40} strokeWidth={1.5} /> </div>
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
                      <button onClick={resetForm} className="px-6 sm:px-10 py-4 bg-white border-2 border-red-50 text-red-500 rounded-2xl text-xs sm:text-sm font-black uppercase hover:bg-red-50 flex items-center gap-3 transition-all">
                          <X size={20} /> <span>ยกเลิก</span>
                      </button>
                  ) : (
                      <button onClick={() => setWizardStep(p => p - 1)} className="px-6 sm:px-10 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs sm:text-sm font-black uppercase hover:bg-slate-200 flex items-center gap-3 transition-all">
                          <ArrowLeft size={20} /> <span>ย้อนกลับ</span>
                      </button>
                  )}
                  <button 
                      onClick={() => wizardStep < 3 ? setWizardStep(p => p + 1) : handleUpdateImage()} 
                      disabled={(wizardStep === 1 && !selectedImageToReplace) || (wizardStep === 2 && !newImageFile) || (wizardStep === 3 && !reason.trim())}
                      className={`px-8 sm:px-12 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase transition-all flex items-center gap-3 ${wizardStep === 3 ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 disabled:opacity-50'}`}
                  >
                      {wizardStep === 3 ? (isSubmitting ? "กำลังบันทึก..." : "ยืนยัน") : "ถัดไป"} <ArrowRight size={20} />
                  </button>
              </div>
          )}
      </div>
    </div>
    </div>
 )}
</div>

      {currentCase && (
        <div className="hidden xl:block w-full xl:w-[320px] 2xl:w-[400px] shrink-0 xl:sticky xl:top-8 animate-fade-in">
            <TimelineContent data={STATIC_TIMELINE} />
        </div>
      )}
    </div>
  </div>

  <style jsx global>{`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
</div>
 );
}

function TimelineContent({ data }) {
    if (!data || data.length === 0) return <div className="p-10 text-center font-bold text-slate-400">ไม่มีข้อมูลกิจกรรม</div>;

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative w-full">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-white z-0"></div>
            <div className="p-6 pb-4 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md shrink-0"><Activity size={20} /></div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Activity Log</h3>
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="px-6 pb-6 relative z-10 max-h-[500px] overflow-y-auto scrollbar-hide">
                <div className="absolute left-[39px] top-4 bottom-12 w-[2px] bg-slate-100 z-0 rounded-full"></div>
                <div className="space-y-4 pt-2">
                {data.map((item) => {
                    const styles = getTypeStyles(item.type);
                    return (
                    <div key={item.id} className="relative flex gap-4 group z-10">
                        <div className={`relative w-9 h-9 shrink-0 rounded-xl ${styles.bg} ${styles.text} border-2 border-white flex items-center justify-center transition-all duration-500 group-hover:scale-110 z-20 shadow-sm bg-white`}>{styles.icon}</div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <h4 className="text-xs font-black text-slate-900 truncate">{item.action}</h4>
                                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{item.time}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <p className="text-[11px] text-slate-600 font-medium leading-tight">{item.detail}</p>
                                <div className="flex items-center gap-1.5 mt-2 opacity-60">
                                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">{item.user.charAt(0)}</div>
                                    <span className="text-[9px] font-bold text-slate-500 tracking-tight">By: {item.user}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
        </div>
    );
}

function ImageCard({ img, isSelected, onSelect, onToggleHide, onSetCover }) {
    return (
        <div className={`group relative rounded-[2.5rem] overflow-hidden transition-all border-4 aspect-[4/3] shadow-md hover:shadow-xl ${ isSelected ? 'border-indigo-600 scale-[1.03] z-10' : 'border-white hover:border-slate-200' }`} >
            <div className="w-full h-full cursor-pointer relative" onClick={onSelect}>
                <FilePreviewRender file={img} />
                {img.status === 'hidden' && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] flex flex-col items-center justify-center text-white z-20">
                        <EyeOff size={40} className="mb-2 opacity-90" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hidden from Public</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-70"></div>
            </div>

            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30">
                {img.isCover ? (
                    <div className="w-8 h-8 bg-indigo-600/90 backdrop-blur text-white rounded-full flex items-center justify-center shadow-lg border border-indigo-400"> <CheckCircle2 size={16} strokeWidth={3} /> </div>
                ) : (
                    <button onClick={(e) => { e.stopPropagation(); onSetCover(); }} className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur text-indigo-600 shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-indigo-100 hover:bg-indigo-600 hover:text-white" title="ตั้งเป็นรูปหน้าปก" > <Layout size={18} /> </button>
                )}

                <button onClick={(e) => { e.stopPropagation(); onToggleHide(); }} className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl transition-all active:scale-95 border ${ img.status === 'hidden' ? 'bg-rose-600 text-white border-rose-400' : 'bg-white/90 backdrop-blur text-slate-800 border-slate-100 hover:bg-white' }`} >
                    {img.status === 'hidden' ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between z-30 pointer-events-none gap-3">
                <div className="flex-1 min-w-0">
                    {!isSelected && (
                        <span className="text-[10px] text-white/90 font-black drop-shadow-lg uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl w-fit flex items-center gap-2 whitespace-nowrap overflow-hidden">
                            <Edit3 size={12} className="shrink-0" /> 
                            <span className="truncate">แตะเพื่อเลือก</span>
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-center shrink-0">
                    {isSelected ? (
                        <div className="bg-white rounded-full p-0.5 shadow-2xl scale-110"> <CheckCircle2 size={30} className="text-indigo-600 fill-white" /> </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 shadow-inner backdrop-blur-sm"></div>
                    )}
                </div>
            </div>
        </div>
    );
}