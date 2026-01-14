'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  Search, 
  CheckCircle2, 
  Users, 
  Clock, 
  AlertCircle, 
  UploadCloud, 
  ArrowLeft, 
  ArrowRight 
} from "lucide-react"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // ตรวจสอบ path ให้ถูกต้องตามโปรเจคของคุณ

// Mock Data
const MOCK_CASES = [
    { 
      id: "CASE-001", 
      title: "Printer Network Connection Failed",
      department: "IT Support", 
      assignee: "John Doe",
      date: "2023-10-25",
      image: "https://api.dicebear.com/7.x/shapes/svg?seed=IT", 
      status: "Open" 
    },
    { 
      id: "CASE-002", 
      title: "New Employee Onboarding Request",
      department: "HR Department", 
      assignee: "Jane Smith",
      date: "2023-10-24",
      image: "https://api.dicebear.com/7.x/shapes/svg?seed=HR", 
      status: "In Progress" 
    },
    { 
      id: "CASE-003", 
      title: "Monthly Tax Report Error",
      department: "Accounting", 
      assignee: "Robert Brown",
      date: "2023-10-20",
      image: "https://api.dicebear.com/7.x/shapes/svg?seed=ACC", 
      status: "Closed" 
    },
];

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

  const handleSearch = (e) => {
    e?.preventDefault(); 
    if (!searchId.trim()) {
        setInputError(true);
        inputRef.current?.focus();
        // ลบ timeout เดิมออกเพื่อให้ error ค้างไว้จนกว่าจะพิมพ์ใหม่ หรือจัดการตาม logic ด้านล่าง
        return;
    }

    setIsSearching(true);
    setCurrentCase(null);
    setNewImageFile(null); 
    setReason("");
    setWizardStep(1); // Reset step เมื่อค้นหาใหม่
    setIsSuccess(false);

    setTimeout(() => {
        const found = MOCK_CASES.find(c => c.id.toLowerCase() === searchId.trim().toLowerCase());
        if (found) {
            setCurrentCase(found);
        } else {
            alert("ไม่พบข้อมูล Case ID นี้");
        }
        setIsSearching(false);
    }, 800);
  };

  const handleUpdateImage = (e) => {
    e.preventDefault();
    if (!newImageFile || !reason.trim()) { 
        alert("กรุณาอัปโหลดรูปภาพและระบุเหตุผล"); 
        return; 
    }
    // จำลองการบันทึกสำเร็จ
    setIsSuccess(true);
  };

  const resetForm = () => {
    setSearchId("");
    setCurrentCase(null);
    setNewImageFile(null);
    setReason("");
    setWizardStep(1);
    setIsSuccess(false);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

 return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-24 lg:pb-0">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE ================= */}
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

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)] bg-white">
          <div className="flex w-full h-16 border-t border-gray-100">
            <a href="/manage" className="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                <LayoutDashboard size={24} />
                <span className="text-[10px] font-bold">Email</span>
            </a>
            <a href="/manage-case" className="flex-1 flex flex-col items-center justify-center gap-1 text-indigo-600 bg-indigo-50/50">
                <FileText size={24} />
                <span className="text-[10px] font-bold">Case</span>
            </a>
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
                <ul className="menu menu-horizontal px-1 gap-2 font-medium text-sm bg-slate-50/80 p-1.5 rounded-full border border-slate-100/50">
                    <li>
                        <a href="/manage" className="text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-full px-5 py-2 transition-all block">
                            จัดการ Email
                        </a>
                    </li>
                    <li>
                        <a href="/manage-case" className="!bg-white !text-primary shadow-sm shadow-slate-200/50 rounded-full px-5 py-2 font-bold transition-all transform hover:-translate-y-0.5 block">
                            จัดการ Case
                        </a>
                    </li>
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

      {/* ================= MAIN CONTENT: WIZARD UI ================= */}
      <div className="container mx-auto px-4 mt-20 lg:mt-12 max-w-4xl">
        
        {/* --- Header & Search (CLEAN VERSION) --- */}
        <div className="flex flex-col items-center text-center mb-12 space-y-8">
            
            {/* Title Section */}
            <div className="space-y-3 max-w-2xl">
              
                <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                    ค้นหา Case ID เพื่อแก้ไขข้อมูล
                </p>
            </div>

            {/* Modern Search Bar */}
            <div className="w-full max-w-xl relative mx-auto z-10">
                <form 
                    onSubmit={handleSearch} 
                    className={`relative group transition-all duration-200 ${inputError ? '-translate-x-1' : 'translate-x-0'}`}
                >
                    
                    {/* Background Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    
                    <div className={`
                        relative bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex items-center p-2 transition-all duration-300
                        ${inputError 
                            ? 'border-red-300 ring-4 ring-red-500/10' 
                            : 'border-slate-100 focus-within:shadow-[0_8px_30px_rgba(99,102,241,0.15)] focus-within:border-indigo-500/30 focus-within:ring-4 focus-within:ring-indigo-500/10'
                        }
                    `}>
                        
                        {/* Search Icon */}
                        <div className={`pl-4 pr-3 transition-colors ${inputError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`}>
                            {inputError ? <AlertCircle size={24} strokeWidth={2.5} /> : <Search size={24} strokeWidth={2.5} />}
                        </div>

                        {/* Input Field */}
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

                        {/* Clear Button */}
                        {searchId && !isSearching && (
                            <button 
                                type="button" 
                                onClick={() => setSearchId("")}
                                className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full mr-1 transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        )}

                        {/* Action Button */}
                        <button 
                            type="submit" 
                            disabled={isSearching}
                            className={`
                                rounded-full px-6 py-3 font-bold text-sm transition-all duration-300 shadow-lg transform active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] justify-center text-white
                                ${inputError 
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                                    : 'bg-slate-900 hover:bg-indigo-600 shadow-slate-200 hover:shadow-indigo-200'
                                }
                            `}
                        >
                            {isSearching ? (
                                <span className="loading loading-spinner loading-xs text-white"></span>
                            ) : (
                                <>
                                    {inputError ? 'ระบุ ID' : 'ค้นหา'} <ArrowRight size={16} strokeWidth={3}/>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Error Message (Standard Tailwind) */}
                {inputError && (
                    <div className="absolute top-full left-0 right-0 mt-3 text-center">
                        <span className="bg-red-50 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 inline-flex items-center gap-1 animate-pulse">
                            <AlertCircle size={12}/> กรุณาระบุ Case ID ก่อนค้นหา
                        </span>
                    </div>
                )}

                {/* Quick Hints */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-400">
                    <span className="uppercase tracking-wider mr-1 opacity-50">Suggested:</span>
                    {['CASE-001', 'CASE-002', 'CASE-003'].map(tag => (
                        <button 
                            key={tag}
                            onClick={() => setSearchId(tag)}
                            className="bg-white border border-slate-200 px-3 py-1 rounded-lg hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all cursor-pointer"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* --- Wizard Content --- */}
        {currentCase ? (
           <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 lg:p-10 relative overflow-hidden transition-all duration-300">
                
                {/* Wizard Progress Header */}
                {!isSuccess && (
                    <div className="mb-12">
                        <div className="flex items-center justify-center relative">
                            {/* Line Background */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                            <div className={`absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500 ease-out`} 
                                 style={{ width: `${((wizardStep - 1) / 2) * 100}%` }}></div>

                            {/* Steps */}
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="relative flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border-4 transition-all duration-300 z-10 bg-white
                                        ${wizardStep >= step 
                                            ? 'border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-200 scale-110' 
                                            : 'border-slate-200 text-slate-300'}`}
                                    >
                                            {step}
                                    </div>
                                    <span className={`absolute top-14 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${wizardStep >= step ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {step === 1 ? 'Review' : step === 2 ? 'Upload' : 'Reason'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step Content Area */}
                <div className="min-h-[320px] flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                    
                    {/* Success State */}
                    {isSuccess ? (
                         <div className="text-center py-10 animate-[scaleIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-xl">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">บันทึกข้อมูลสำเร็จ!</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">ระบบได้ทำการอัปเดตข้อมูลรูปภาพและบันทึกเหตุผลของคุณเรียบร้อยแล้ว</p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left max-w-sm mx-auto mb-8">
                                <p className="text-xs text-slate-400 font-bold uppercase">Case ID</p>
                                <p className="font-bold text-slate-800 mb-2">{currentCase.id}</p>
                                <p className="text-xs text-slate-400 font-bold uppercase">File Name</p>
                                <p className="font-bold text-slate-800 truncate">{newImageFile?.name}</p>
                            </div>
                            <button onClick={resetForm} className="px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg">
                                กลับหน้าหลัก
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* STEP 1: Review Data */}
                            {wizardStep === 1 && (
                                <div className="w-full max-w-2xl animate-fade-in">
                                    <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">Step 1: ตรวจสอบข้อมูล (Review)</h3>
                                    <p className="text-slate-500 mb-8 text-center text-sm">กรุณาตรวจสอบรายละเอียดเคสก่อนดำเนินการแก้ไข</p>
                                    
                                    <div className="bg-slate-50 p-6 lg:p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-8 items-center md:items-start">
                                        <div className="w-full md:w-1/3 shrink-0">
                                            <div className="aspect-square rounded-2xl overflow-hidden shadow-md border border-white">
                                                <img src={currentCase.image} className="w-full h-full object-cover" alt="Case" />
                                            </div>
                                        </div>
                                        <div className="w-full md:w-2/3 space-y-4">
                                            <div>
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide bg-red-100 text-red-600`}>{currentCase.status}</span>
                                                <h4 className="text-2xl font-bold text-slate-800 mt-2">{currentCase.title || "No Title"}</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><Users size={12}/> Department</p>
                                                    <p className="text-slate-700 font-semibold">{currentCase.department}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> Date</p>
                                                    <p className="text-slate-700 font-semibold">{currentCase.date || "N/A"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><AlertCircle size={12}/> Assignee</p>
                                                    <p className="text-indigo-600 font-semibold">{currentCase.assignee || "Unassigned"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Upload Image (Updated UI) */}
                            {wizardStep === 2 && (
                                <div className="w-full max-w-xl mx-auto animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-black text-slate-800 mb-2">
                                            อัปโหลดรูปภาพหลักฐาน
                                        </h3>
                                        <p className="text-slate-500">
                                            เลือกไฟล์รูปภาพเพื่อใช้ประกอบการแก้ไข Case
                                        </p>
                                    </div>
                                    
                                    <label 
                                        className={`
                                            group relative flex flex-col items-center justify-center w-full h-80 
                                            rounded-3xl border-3 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                                            ${newImageFile 
                                                ? 'border-green-400 bg-green-50/30' 
                                                : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-100/50'
                                            }
                                        `}
                                    >
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/png, image/jpeg, image/jpg" 
                                            onChange={(e) => setNewImageFile(e.target.files[0])} 
                                        />
                                        
                                        {newImageFile ? (
                                            // State: เมื่อเลือกไฟล์แล้ว
                                            <div className="flex flex-col items-center animate-bounce-short z-10">
                                                <div className="w-20 h-20 bg-white text-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-100 border border-green-100">
                                                    <CheckCircle2 size={40} strokeWidth={3} />
                                                </div>
                                                <span className="font-bold text-xl text-slate-800 mb-1 drop-shadow-sm">
                                                    {newImageFile.name}
                                                </span>
                                                <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                                    พร้อมอัปโหลด
                                                </span>
                                                <p className="text-xs text-slate-400 mt-6 group-hover:text-slate-500 transition-colors">
                                                    คลิกเพื่อเปลี่ยนรูปภาพใหม่
                                                </p>
                                            </div>
                                        ) : (
                                            // State: ยังไม่เลือกไฟล์
                                            <div className="flex flex-col items-center z-10 p-6 transition-transform duration-300 group-hover:scale-105">
                                                <div className="w-20 h-20 bg-white rounded-2xl mb-6 flex items-center justify-center shadow-sm border border-slate-100 group-hover:shadow-md group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all text-slate-300">
                                                    <UploadCloud size={40} strokeWidth={1.5} />
                                                </div>
                                                
                                                <h4 className="font-bold text-lg text-slate-700 mb-2 group-hover:text-indigo-700 transition-colors">
                                                    คลิกเพื่อเลือกรูปภาพ
                                                </h4>
                                                <p className="text-slate-400 text-sm mb-6">
                                                    หรือลากไฟล์มาวางในกรอบนี้
                                                </p>
                                                
                                                <div className="flex items-center gap-3 text-xs font-bold text-slate-300 uppercase tracking-wider">
                                                    <span className="bg-white px-2 py-1 rounded border border-slate-100">JPG</span>
                                                    <span className="bg-white px-2 py-1 rounded border border-slate-100">PNG</span>
                                                    <span className="bg-white px-2 py-1 rounded border border-slate-100">SVG</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Background Decoration (Optional) */}
                                        {!newImageFile && (
                                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>
                                        )}
                                    </label>
                                </div>
                            )}

                            {/* STEP 3: Reason */}
                            {wizardStep === 3 && (
                                <div className="w-full max-w-xl text-center animate-fade-in">
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">Step 3: สรุปผล (Reason)</h3>
                                    <p className="text-slate-500 mb-8 text-sm">ระบุสาเหตุในการเปลี่ยนแปลงหรือรายละเอียดเพิ่มเติม</p>
                                    
                                    <div className="relative">
                                        <textarea 
                                            className="w-full bg-white border-2 border-slate-200 rounded-3xl p-6 h-48 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-slate-700 text-lg leading-relaxed shadow-sm placeholder:text-slate-300"
                                            placeholder="พิมพ์รายละเอียดที่นี่..."
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

                {/* Footer Buttons */}
                {!isSuccess && (
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
                        <button 
                            disabled={wizardStep === 1} 
                            onClick={() => setWizardStep(p => p - 1)} 
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-0 disabled:pointer-events-none transition-all flex items-center gap-2"
                        >
                            <ArrowLeft size={18}/> ย้อนกลับ
                        </button>

                        {wizardStep < 3 ? (
                            <button 
                                onClick={() => setWizardStep(p => p + 1)} 
                                disabled={wizardStep === 2 && !newImageFile} // Lock step 2 if no file
                                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                ถัดไป <ArrowRight size={18}/>
                            </button>
                        ) : (
                            <button 
                                onClick={handleUpdateImage} 
                                disabled={!reason.trim()}
                                className="px-10 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <CheckCircle2 size={20}/> บันทึกข้อมูล
                            </button>
                        )}
                    </div>
                )}
           </div>
        ) : (
             // Empty State (Before search) - now part of the design flow, minimal content here
             <div className="text-center py-24 opacity-40">
                {/* Optional placeholder if needed, or keep empty to emphasize search */}
             </div>
        )}

      </div>
    </div>
  );
}