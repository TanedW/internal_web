'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Search, 
  CheckCircle2, 
  Users, 
  Clock, 
  AlertCircle, 
  UploadCloud, 
  ArrowLeft, 
  ArrowRight,
  X,
  ImageIcon 
} from "lucide-react"; 
import Link from 'next/link';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 

export default function ManageCase() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // --- State ---
  const [searchId, setSearchId] = useState("");
  const [currentCase, setCurrentCase] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [inputError, setInputError] = useState(false);
  
  // State สำหรับ Wizard UI
  const [wizardStep, setWizardStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- State ใหม่สำหรับเก็บรูปที่ user เลือกจะแก้ไข ---
  const [selectedImageToReplace, setSelectedImageToReplace] = useState(null);

  const inputRef = useRef(null);
  
  // --- Form State ---
  const [newImageFile, setNewImageFile] = useState(null);
  const [reason, setReason] = useState("");

  // Helper function for Avatar
  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { setUser(currentUser); setLoading(false); } 
      else { router.push("/"); }
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

  // --- เชื่อมต่อ API และรวมรูปภาพ ---
  const handleSearch = async (e) => {
    e?.preventDefault(); 
    if (!searchId.trim()) {
        setInputError(true);
        inputRef.current?.focus();
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
        const apiUrl = process.env.NEXT_PUBLIC_DB_SEARCH_CASE_API_URL;
        if (!apiUrl) throw new Error("API URL not configured");
        const response = await fetch(`${apiUrl}?id=${searchId.trim()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok && result.found) {
            const apiData = result.data;

            let allImagesCombined = [];
            
            // 1. ใส่รูป Cover
            if (apiData.cover_image_url) {
                allImagesCombined.push({
                    id: 'cover_img',
                    type: 'Cover Image',
                    url: apiData.cover_image_url
                });
            }
            
            // 2. ใส่รูปอื่นๆ
            if (apiData.images && Array.isArray(apiData.images)) {
                apiData.images.forEach((img, index) => {
                    if(img.url) {
                        allImagesCombined.push({
                            id: `detail_img_${index}`,
                            type: `Detail Image ${index + 1}`,
                            url: img.url
                        });
                    }
                });
            }

            if (allImagesCombined.length === 0) {
                allImagesCombined.push({ id: 'placeholder', type: 'No Image', url: "https://via.placeholder.com/150?text=No+Image" });
            }

            // --- [UPDATED] ดึงชื่อหน่วยงานมาต่อกันด้วย comma ---
            const departmentNames = apiData.organizations && apiData.organizations.length > 0 
                ? apiData.organizations.map(org => org.name).join(', ') 
                : "General";

            // --- [UPDATED] แปลงวันที่จาก created_at ---
            const caseDate = apiData.created_at 
                ? new Date(apiData.created_at).toISOString().split('T')[0] 
                : new Date().toISOString().split('T')[0];

            setCurrentCase({
                id: searchId.trim().toUpperCase(),
                uuid: apiData.issue_cases_id,
                title: "Case Details Found", 
                department: departmentNames, 
                assignee: "System",
                date: caseDate,
                allImages: allImagesCombined,
                status: "Active"
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

  const handleUpdateImage = (e) => {
    e.preventDefault();
    if (!selectedImageToReplace) {
        alert("กรุณาเลือกรูปภาพที่ต้องการแก้ไขในขั้นตอนที่ 1");
        setWizardStep(1);
        return;
    }
    if (!newImageFile || !reason.trim()) { 
        alert("กรุณาอัปโหลดรูปภาพใหม่และระบุเหตุผล"); 
        return; 
    }
    
    // เชื่อม API Update ตรงนี้
    
    setIsSuccess(true);
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
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-32 lg:pb-0">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE ================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)] bg-white">
        <div className="flex w-full h-16 border-t border-gray-100">
          <Link href="/manage" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            <span className="text-[10px] font-bold">Email</span>
          </Link>
          
          {/* Active State (Case)  */}
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

       <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-50 px-4 flex justify-between items-center border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="avatar">
                  <div className="w-9 h-9 rounded-full ring ring-offset-2 ring-indigo-50">
                      <img src={user?.photoURL || getAvatarUrl("Admin")} alt="User"/>
                  </div>
              </div>
              <div className="flex flex-col justify-center">
                  <span className="font-bold text-slate-800 text-sm truncate max-w-[160px]">{user?.displayName || "Admin User"}</span>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase">SYSTEM ADMIN</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-circle btn-sm hover:bg-red-50">
                <LogOut size={22} className="text-red-500" />
            </button>
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
                        <LogOut size={20} className="text-red-500 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <span className="text-red-600 font-bold tracking-wide text-[15px]">Logout</span>
                </button>
            </div>
        </div>
      </div>


      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 mt-20 lg:mt-12 max-w-4xl">
        
        {/* --- Header & Search --- */}
        <div className="flex flex-col items-center text-center mb-12 space-y-8">
            <div className="space-y-3 max-w-2xl">
                <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                    ค้นหา Case ID เพื่อแก้ไขข้อมูลรูปภาพ
                </p>
            </div>

            <div className="w-full max-w-xl relative mx-auto z-10">
                <form 
                    onSubmit={handleSearch} 
                    className={`relative group transition-all duration-200 ${inputError ? '-translate-x-1' : 'translate-x-0'}`}
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    
                    <div className={`relative bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex items-center p-2 transition-all duration-300 ${inputError ? 'border-red-300 ring-4 ring-red-500/10' : 'border-slate-100 focus-within:shadow-[0_8px_30px_rgba(99,102,241,0.15)] focus-within:border-indigo-500/30 focus-within:ring-4 focus-within:ring-indigo-500/10'}`}>
                        <div className={`pl-4 pr-3 transition-colors ${inputError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
                            {inputError ? <AlertCircle size={24} strokeWidth={2.5} /> : <Search size={24} strokeWidth={2.5} />}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={searchId}
                            onChange={(e) => {
                                setSearchId(e.target.value);
                                if(inputError) setInputError(false);
                            }}
                            className={`flex-1 bg-transparent border-none outline-none font-bold placeholder:text-slate-300 placeholder:font-medium h-12 w-full text-lg ${inputError ? 'text-red-500' : 'text-slate-700'}`}
                            placeholder="ระบุ Case ID (เช่น CASE-001)"
                            disabled={isSearching}
                        />

                        {searchId && !isSearching && (
                            <button 
                                type="button" 
                                onClick={() => setSearchId("")}
                                className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full mr-1 transition-all"
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        )}

                        <button 
                            type="submit" 
                            disabled={isSearching}
                            className={`rounded-full px-6 py-3 font-bold text-sm transition-all duration-300 shadow-lg transform active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] justify-center text-white ${inputError ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-slate-900 hover:bg-indigo-600 shadow-slate-200 hover:shadow-indigo-200'}`}
                        >
                            {isSearching ? (
                                <span className="loading loading-spinner loading-xs text-white"></span>
                            ) : (
                                <>{inputError ? 'ระบุ ID' : 'ค้นหา'} <ArrowRight size={16} strokeWidth={3}/></>
                            )}
                        </button>
                    </div>
                </form>

                {inputError && (
                    <div className="absolute top-full left-0 right-0 mt-3 text-center">
                        <span className="bg-red-50 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 inline-flex items-center gap-1 animate-pulse">
                            <AlertCircle size={12}/> กรุณาระบุ Case ID ก่อนค้นหา
                        </span>
                    </div>
                )}
            </div>
        </div>

        {/* --- Wizard Content --- */}
        {currentCase ? (
           <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 lg:p-10 relative overflow-hidden transition-all duration-300">
                
                {/* Wizard Progress Header */}
                {!isSuccess && (
                    <div className="mb-12">
                        <div className="flex items-center justify-center relative">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                            <div className={`absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500 ease-out`} style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}></div>

                            {[1, 2, 3].map((step) => (
                                <div key={step} className="relative flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border-4 transition-all duration-300 z-10 bg-white ${wizardStep >= step ? 'border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-200 scale-110' : 'border-slate-200 text-slate-300'}`}>
                                            {step}
                                    </div>
                                    <span className={`absolute top-14 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${wizardStep >= step ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {step === 1 ? 'Select' : step === 2 ? 'Upload' : 'Reason'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step Content Area */}
                <div className="min-h-[320px] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                    
                    {isSuccess ? (
                          <div className="text-center py-10 animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">ระบบได้ทำการอัปเดตข้อมูลรูปภาพเรียบร้อยแล้ว</p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left max-w-sm mx-auto mb-8 space-y-3">
                                <div><p className="text-xs text-slate-400 font-bold uppercase">Case ID</p><p className="font-bold text-slate-800">{currentCase.id}</p></div>
                                <div><p className="text-xs text-slate-400 font-bold uppercase">Replaced Image Type</p><p className="font-bold text-indigo-600 truncate">{selectedImageToReplace?.type}</p></div>
                                <div><p className="text-xs text-slate-400 font-bold uppercase">New File Name</p><p className="font-bold text-slate-800 truncate">{newImageFile?.name}</p></div>
                            </div>
                            <button onClick={resetForm} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg">กลับหน้าหลัก</button>
                        </div>
                    ) : (
                        <>
                            {/* STEP 1: Review & SELECT Image */}
                            {wizardStep === 1 && (
                                <div className="w-full max-w-3xl animate-fade-in">
                                    <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">Step 1: ตรวจสอบและเลือกรูปภาพ (Review & Select)</h3>
                                    <p className="text-slate-500 mb-8 text-center text-sm">คลิกเลือกรูปภาพที่ต้องการแก้ไขจากรายการด้านล่าง</p>
                                    
                                    {/* ส่วนแสดงรายละเอียด Case */}
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-indigo-100 text-indigo-600`}>{currentCase.status}</span>
                                                <span className="text-slate-400 font-bold">|</span>
                                                <span className="text-slate-500 font-bold">{currentCase.id}</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800">{currentCase.title}</h4>
                                        </div>
                                        
                                        <div className="flex flex-col items-end space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <Users size={16} className="text-slate-400"/>
                                                <span>{currentCase.department}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <Clock size={16} className="text-slate-400"/>
                                                <span>{currentCase.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grid แสดงรูปภาพทั้งหมดให้เลือก */}
                                    <div className="">
                                        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <ImageIcon size={20} className="text-indigo-500"/> 
                                            เลือกรูปภาพที่ต้องการเปลี่ยน:
                                        </h4>
                                        <br></br>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {currentCase.allImages.map((img) => {
                                                const isSelected = selectedImageToReplace?.id === img.id;
                                                return (
                                                    <div 
                                                        key={img.id}
                                                        onClick={() => setSelectedImageToReplace(img)}
                                                        className={`
                                                            relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 group bg-slate-100
                                                            ${isSelected 
                                                                ? 'border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg scale-[1.02] z-10' 
                                                                : 'border-slate-200 hover:border-indigo-300 hover:shadow-md scale-100'
                                                            }
                                                        `}
                                                    >
                                                        {/* กรอบพอดีรูป */}
                                                        <img 
                                                            src={img.url} 
                                                            className={`w-full h-auto block transition-opacity ${isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}`}
                                                            alt={img.type}
                                                            onError={(e) => { e.target.src = "https://via.placeholder.com/300?text=Error"; }}
                                                        />
                                                        
                                                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                                            {img.type}
                                                        </span>

                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 bg-indigo-500 text-white rounded-full p-1.5 shadow-sm animate-[bounceIn_0.3s_ease-out]">
                                                                <CheckCircle2 size={18} strokeWidth={3} />
                                                            </div>
                                                        )}
                                                        
                                                        {!isSelected && (
                                                            <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-all"></div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <p className={`text-center text-sm mt-6 font-medium transition-all ${selectedImageToReplace ? 'text-indigo-600' : 'text-slate-400'}`}>
                                            {selectedImageToReplace 
                                                ? <><CheckCircle2 size={16} className="inline mr-1"/> คุณเลือกแก้ไข: <span className="font-bold">{selectedImageToReplace.type}</span></> 
                                                : "กรุณาคลิกที่รูปภาพที่ต้องการแก้ไขเพื่อดำเนินการต่อ"
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Upload Image */}
                            {wizardStep === 2 && (
                                <div className="w-full max-w-xl mx-auto animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-black text-slate-800 mb-2">อัปโหลดรูปภาพใหม่</h3>
                                        <p className="text-slate-500">เลือกไฟล์รูปภาพเพื่อแทนที่รูปเดิม</p>
                                    </div>

                                    {/* --- ส่วนแสดงรูปเก่า --- */}
                                    {selectedImageToReplace && (
        
                                        <div className="mb-8 w-fit mx-auto flex flex-col items-center p-5 bg-orange-50 rounded-3xl border border-orange-100 text-orange-700/70 shadow-sm">
                                            <p className="text-xs font-bold mb-3 flex items-center gap-1 uppercase tracking-wider">
                                                <AlertCircle size={14}/> กำลังแก้ไขรูปภาพเดิม:
                                            </p><br></br>
                                            
                                            <div className="relative h-64 min-w-[200px] rounded-2xl overflow-hidden border-2 border-orange-200 shadow-sm bg-white flex items-center justify-center">
                                                <img 
                                                    src={selectedImageToReplace.url} 
                                                    className="h-full w-auto object-contain" 
                                                    alt="Replacing" 
                                                />
                                                
                                                {/* Overlay  */}
                                                <div className="absolute inset-0 bg-orange-500/10 pointer-events-none"></div>
                                            </div><br></br>
                                            <p className="text-sm font-bold mt-3 bg-orange-100 px-3 py-1 rounded-full">{selectedImageToReplace.type}</p>
                                        </div>
                                    )}
                                    
                                    {/* --- ส่วนอัปโหลดรูปใหม่ --- */}
                                    <label className={`group relative flex flex-col items-center justify-center w-full min-h-[24rem] h-auto p-6 rounded-3xl border-3 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${newImageFile ? 'border-green-400 bg-white' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-100/50'}`}>
                                        <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={(e) => setNewImageFile(e.target.files[0])} />
                                        
                                        {newImageFile ? (
                                            <div className="flex flex-col items-center w-full animate-fade-in z-10">
                                                
                                                {/* กำหนดความสูง h-64 ให้เท่ากับรูปเก่าด้านบน */}
                                                <div className="relative h-64 w-auto rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm flex items-center justify-center mb-4">
                                                    <img 
                                                        src={URL.createObjectURL(newImageFile)} 
                                                        className="h-full w-auto object-contain" 
                                                        alt="Preview" 
                                                    />
                                                </div>

                                                <span className="font-bold text-lg text-slate-800 mb-1 drop-shadow-sm truncate max-w-[80%]">{newImageFile.name}</span>
                                                <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <CheckCircle2 size={14}/> รูปใหม่พร้อมอัปโหลด
                                                </span><br></br>
                                                <p className="text-xs text-slate-400 mt-3 group-hover:text-indigo-500 transition-colors font-medium">คลิกพื้นที่ว่างเพื่อเปลี่ยนรูปภาพ</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center z-10 p-6 transition-transform duration-300 group-hover:scale-105">
                                                <div className="w-20 h-20 bg-white rounded-2xl mb-6 flex items-center justify-center shadow-sm border border-slate-100 group-hover:shadow-md group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all text-slate-300"><UploadCloud size={40} strokeWidth={1.5} /></div>
                                                <h4 className="font-bold text-lg text-slate-700 mb-2 group-hover:text-indigo-700 transition-colors">คลิกเพื่อเลือกรูปภาพ</h4>
                                                <p className="text-slate-400 text-sm mb-6">หรือลากไฟล์มาวางในกรอบนี้</p>
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-300 uppercase tracking-wider"><span className="bg-white px-2 py-1 rounded border border-slate-100">JPG</span><span className="bg-white px-2 py-1 rounded border border-slate-100">PNG</span><span className="bg-white px-2 py-1 rounded border border-slate-100">SVG</span></div>
                                            </div>
                                        )}
                                        {!newImageFile && (<div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>)}
                                    </label>
                                </div>
                            )}

                            {/* STEP 3: Reason */}
                            {wizardStep === 3 && (
                                <div className="w-full max-w-xl text-center animate-fade-in">
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">Step 3: สรุปผลและระบุเหตุผล (Reason)</h3>
                                    <p className="text-slate-500 mb-8 text-sm">ระบุสาเหตุในการเปลี่ยนแปลงรูปภาพ <span className="font-bold text-indigo-600">{selectedImageToReplace?.type}</span></p>
                                    
                                    {/* --- ADDED: NEW IMAGE PREVIEW IN STEP 3 --- */}
                                    {newImageFile && (
                                        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">รูปภาพใหม่ที่จะใช้งาน</p>
                                            <div className="relative rounded-lg overflow-hidden shadow-md border border-slate-200 max-h-64">
                                                <img 
                                                    src={URL.createObjectURL(newImageFile)} 
                                                    alt="New Preview" 
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2">{newImageFile.name}</p>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <textarea 
                                            className="textarea textarea-bordered w-full h-48 text-lg" 
                                            placeholder="พิมพ์รายละเอียดที่นี่..." 
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
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                        {wizardStep === 1 ? (
                            <button onClick={resetForm} className="group px-6 py-3 bg-white border-2 border-red-100 text-red-500 rounded-full font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"><div className="p-1 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors"><X size={16} strokeWidth={3} /></div>ยกเลิก</button>
                        ) : (
                            <button onClick={() => setWizardStep(p => p - 1)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 hover:text-slate-800 transition-all duration-200 flex items-center gap-2"><ArrowLeft size={20}/> ย้อนกลับ</button>
                        )}

                        {wizardStep < 3 ? (
                            <button onClick={() => setWizardStep(p => p + 1)} disabled={(wizardStep === 1 && !selectedImageToReplace) || (wizardStep === 2 && !newImageFile)} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">ถัดไป <ArrowRight size={20} strokeWidth={2.5}/></button>
                        ) : (
                            <button onClick={handleUpdateImage} disabled={!reason.trim()} className="px-10 py-3 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"><CheckCircle2 size={20} strokeWidth={2.5}/> บันทึกข้อมูล</button>
                        )}
                    </div>
                )}
           </div>
        ) : (
             <div className="text-center py-24 opacity-40"></div>
        )}

      </div>
      <style jsx global>{`@keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }`}</style>
    </div>
  );
}