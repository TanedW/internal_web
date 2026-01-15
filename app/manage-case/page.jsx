'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";

// Mock Data
const MOCK_CASES = [
    { id: "CASE-001", department: "IT Support", image: "https://api.dicebear.com/7.x/shapes/svg?seed=IT", status: "Open" },
    { id: "CASE-002", department: "HR Department", image: "https://api.dicebear.com/7.x/shapes/svg?seed=HR", status: "In Progress" },
    { id: "CASE-003", department: "Accounting", image: "https://api.dicebear.com/7.x/shapes/svg?seed=ACC", status: "Closed" },
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
  const inputRef = useRef(null);
  
  // --- Form State ---
  const [newImageFile, setNewImageFile] = useState(null);
  const [reason, setReason] = useState("");

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
        setTimeout(() => setInputError(false), 500);
        return;
    }

    setIsSearching(true);
    setCurrentCase(null);
    setNewImageFile(null); 
    setReason("");

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
    alert(`บันทึกสำเร็จ!\n----------------\nCase: ${currentCase.id}\nไฟล์: ${newImageFile.name}\nเหตุผล: ${reason}`);
    setNewImageFile(null);
    setReason("");
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-slate-50"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-24 pt-20 lg:pt-0 lg:pb-0">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* =========================================
          PART 1: MOBILE TOP BAR
         ========================================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm z-50 px-4 flex justify-between items-center border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="avatar">
                  <div className="w-9 h-9 rounded-full ring ring-offset-2 ring-indigo-50">
                      <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User" className="rounded-full object-cover"/>
                  </div>
              </div>
              <div className="flex flex-col justify-center">
                  <span className="font-bold text-slate-800 text-sm truncate max-w-[160px] leading-tight">
                      {user?.displayName || "Admin User"}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
                      SYSTEM ADMIN
                  </span>
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

      {/* =========================================
          PART 2: MOBILE BOTTOM BAR (แก้ไขสีตัวหนังสือ)
         ========================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
          <div className="flex w-full h-20">
            
            {/* 1. ปุ่มซ้าย: Email (Inactive -> พื้นขาว ตัวหนังสือดำ) */}
            <Link 
                href="/manage" 
                className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-white text-slate-800 active:bg-gray-50 transition-colors duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <span className="text-xs font-bold tracking-wide">จัดการ Email</span>
            </Link>
            
            {/* 2. ปุ่มขวา: Case (Active -> พื้นดำ ตัวหนังสือขาว) */}
            <Link 
                href="/manage-case" 
                className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-[#0F172A] !text-white shadow-inner active:opacity-90 transition-colors duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                <span className="text-xs font-bold tracking-wide">จัดการ Case</span>
            </Link>

          </div>
      </div>

      {/* =========================================
          PART 3: DESKTOP NAVBAR
         ========================================= */}
      <div className="hidden lg:block sticky top-0 z-40">
        <div className="navbar bg-white/90 backdrop-blur-md px-6 shadow-sm border-b border-gray-100">
            <div className="navbar-start">
            <div className="flex items-center gap-3">
                <div className="avatar">
                    <div className="w-10 h-10 rounded-full ring ring-indigo-500 ring-offset-base-100 ring-offset-2">
                        <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User"/>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700 text-sm">{user?.displayName || "Admin"}</span>
                    <span className="text-xs text-slate-400">System Admin</span>
                </div>
            </div>
            </div>
            <div className="navbar-center">
            <ul className="menu menu-horizontal px-1 gap-2">
                <li><Link href="/manage" className="font-medium text-slate-500 hover:text-indigo-600 rounded-lg transition-all">จัดการ Email</Link></li>
                <li><Link href="/manage-case" className="font-bold text-indigo-600 bg-indigo-50 rounded-lg transition-all">จัดการ Case</Link></li>
            </ul>
            </div>
            <div className="navbar-end">
             <button onClick={handleLogout} className="btn btn-ghost btn-sm gap-2 hover:bg-red-50 group transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 group-hover:text-red-700">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="text-red-500 font-bold group-hover:text-red-700">Logout</span>
            </button>
            </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 mt-8 lg:mt-12 max-w-5xl animate-fade-in">
        
        {/* Header Text */}
        <div className="text-center mb-8">
            <h1 className="text-xl lg:text-3xl font-bold text-slate-800">ระบบจัดการ Case</h1>
            <p className="text-slate-500 mt-1 text-sm lg:text-base">ค้นหารหัสงานเพื่อแก้ไขข้อมูลและรูปภาพ</p>
        </div>

        {/* --- STEP 1: Search Box --- */}
        <div className="max-w-md mx-auto mb-12">
            <form onSubmit={handleSearch} className="flex flex-col w-full gap-4">
                
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search Case ID..." 
                        value={searchId} 
                        onChange={(e) => setSearchId(e.target.value)} 
                        className={`input input-bordered w-full !pl-12 rounded-2xl bg-white border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 h-14 text-base transition-all shadow-sm ${inputError ? 'input-error animate-shake' : ''}`}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSearching}
                    className="btn btn-primary w-full rounded-2xl h-14 text-white text-lg font-bold border-none bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all"
                >
                    {isSearching ? <span className="loading loading-dots loading-md"></span> : "ค้นหาข้อมูล"}
                </button>
            </form>
        </div>

        {/* --- STEP 2: Result & Edit Form --- */}
        {currentCase && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up pb-10">
                
                {/* Info Card */}
                <div className="lg:col-span-2 card bg-white shadow-xl shadow-slate-200/50 border border-slate-100 h-fit rounded-3xl overflow-hidden">
                    <div className="bg-indigo-600 h-2"></div>
                    <figure className="bg-slate-50 p-8 flex justify-center items-center">
                        <img src={currentCase.image} alt="Department" className="rounded-2xl h-32 w-32 object-cover shadow-md bg-white p-2" />
                    </figure>
                    <div className="card-body text-center p-6 pt-4">
                        <div className="badge badge-lg bg-indigo-50 text-indigo-700 border-indigo-100 mx-auto mb-3 font-bold px-4 py-3">{currentCase.id}</div>
                        <h2 className="text-xl font-bold text-slate-800">{currentCase.department}</h2>
                        <div className="flex justify-center items-center gap-2 mt-3">
                            <span className="text-slate-400 text-sm font-medium">สถานะ:</span> 
                            <span className={`badge ${currentCase.status === 'Open' ? 'badge-error text-white' : currentCase.status === 'Closed' ? 'badge-neutral' : 'badge-warning text-white'} font-bold shadow-sm`}>
                                {currentCase.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-3 card bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl">
                    <div className="card-body p-6 lg:p-8">
                        <h3 className="text-lg font-bold pb-4 mb-6 flex items-center gap-3 text-slate-800 border-b border-slate-100">
                             <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </div>
                             แก้ไขรูปภาพ
                        </h3>
                        
                        <form onSubmit={handleUpdateImage} className="flex flex-col gap-6">
                            <div className="form-control">
                                <label className="label py-1 mb-1"><span className="label-text font-bold text-slate-700">1. อัปโหลดรูปใหม่ <span className="text-red-500">*</span></span></label>
                                <input 
                                    type="file" 
                                    className="file-input file-input-bordered file-input-primary w-full bg-slate-50 text-slate-600 rounded-xl h-12" 
                                    accept="image/*" 
                                    onChange={(e) => setNewImageFile(e.target.files[0])} 
                                    required
                                />
                            </div>

                            <div className="form-control">
                                <label className="label py-1 mb-1"><span className="label-text font-bold text-slate-700">2. เหตุผลในการเปลี่ยน <span className="text-red-500">*</span></span></label>
                                <textarea 
                                    className="textarea textarea-bordered h-32 focus:textarea-primary bg-slate-50 focus:bg-white text-slate-700 leading-relaxed text-base rounded-xl" 
                                    placeholder="ระบุเหตุผล..." 
                                    value={reason} 
                                    onChange={(e) => setReason(e.target.value)} 
                                    required
                                ></textarea>
                            </div>

                            <div className="card-actions justify-end mt-2">
                                <button 
                                    type="submit" 
                                    className="btn btn-success text-white w-full sm:w-auto px-10 font-bold shadow-lg shadow-green-200 rounded-xl h-12 text-base"
                                    disabled={!newImageFile || !reason.trim()}
                                >
                                    บันทึกการแก้ไข
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
