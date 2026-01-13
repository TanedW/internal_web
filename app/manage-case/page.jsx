// app/manage-case/page.jsx
'use client';

import { useEffect, useState } from "react";
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
  
  // --- State สำหรับหน้า Case ---
  const [searchId, setSearchId] = useState("");
  const [currentCase, setCurrentCase] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
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
    e.preventDefault();
    setIsSearching(true);
    setCurrentCase(null);
    setTimeout(() => {
        const found = MOCK_CASES.find(c => c.id === searchId.trim());
        if (found) setCurrentCase(found);
        else alert("ไม่พบข้อมูล Case ID นี้");
        setIsSearching(false);
    }, 800);
  };

  const handleUpdateImage = (e) => {
    e.preventDefault();
    if (!newImageFile || !reason.trim()) { alert("กรุณากรอกข้อมูลให้ครบ"); return; }
    alert(`บันทึกสำเร็จ!\nCase: ${currentCase.id}\nไฟล์: ${newImageFile.name}\nเหตุผล: ${reason}`);
    setNewImageFile(null); setReason("");
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    // Layout: ใช้ Theme เดียวกับหน้า Manage (slate-50) และ padding สำหรับ Mobile Bars
    <div className="min-h-screen bg-slate-50 font-sans pt-20 pb-24 lg:pt-0 lg:pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* =========================================
          PART 1: MOBILE TOP BAR (Profile & Logout)
          (แสดงเฉพาะมือถือ lg:hidden)
         ========================================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white z-50 px-4 flex justify-between items-center shadow-sm border-b border-gray-100">
           <div className="flex items-center gap-3">
              <div className="avatar">
                  <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                      <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User"/>
                  </div>
              </div>
              <div className="flex flex-col justify-center">
                  <span className="font-bold text-gray-700 text-sm truncate max-w-[160px] leading-tight">
                      {user?.displayName || "Admin"}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">System Admin</span>
              </div>
           </div>
           
           <button onClick={handleLogout} className="btn btn-ghost btn-circle btn-sm hover:bg-red-50">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
           </button>
      </div>

      {/* =========================================
          PART 2: MOBILE BOTTOM BAR (Menu Links)
          (แสดงเฉพาะมือถือ lg:hidden)
         ========================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 h-16">
            {/* Link 1: Manage Email (Inactive) */}
            <Link href="/manage" className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="text-xs font-medium">จัดการ Email</span>
            </Link>
            
            {/* Link 2: Manage Case (ACTIVE) */}
            <Link href="/manage-case" className="flex flex-col items-center justify-center gap-1 text-primary bg-primary/5 border-t-2 border-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <span className="text-xs font-bold">จัดการ Case</span>
            </Link>
          </div>
      </div>

      {/* =========================================
          PART 3: DESKTOP NAVBAR
          (ซ่อนในมือถือ แสดงใน PC)
         ========================================= */}
      <div className="hidden lg:block sticky top-0 z-50">
        <div className="navbar bg-white/90 backdrop-blur-md px-6 transition-all duration-300 shadow-sm border-b border-gray-100">
            <div className="navbar-start">
            <div className="flex items-center gap-3">
                <div className="avatar">
                    <div className="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User"/>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-gray-700 text-sm">{user?.displayName || "Admin"}</span>
                    <span className="text-xs text-gray-400">System Admin</span>
                </div>
            </div>
            </div>
            <div className="navbar-center">
            <ul className="menu menu-horizontal px-1 gap-2">
                {/* Link 1: Manage Email (Inactive) */}
                <li><Link href="/manage" className="font-medium text-gray-500 hover:text-primary rounded-lg">จัดการ Email</Link></li>
                {/* Link 2: Manage Case (ACTIVE) */}
                <li><Link href="/manage-case" className="font-bold text-primary bg-primary/10 rounded-lg">จัดการ Case</Link></li>
            </ul>
            </div>
            <div className="navbar-end">
            <button onClick={handleLogout} className="btn btn-ghost btn-sm gap-2 hover:bg-red-50 group">
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
      <div className="container mx-auto px-4 mt-4 lg:mt-8 max-w-4xl">
        <div className="text-center mb-10">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">จัดการข้อมูล Case</h1>
            <p className="text-gray-500 mt-2 text-sm">ค้นหา Case ID เพื่อทำการแก้ไขรูปภาพหน่วยงาน</p>
        </div>

        {/* Search Box */}
        <div className="card bg-white shadow-lg shadow-slate-100 border border-slate-100 mb-8 max-w-2xl mx-auto">
            <div className="card-body flex-row items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="form-control flex-1">
                    <input type="text" placeholder="ระบุ Case ID (เช่น CASE-001)" className="input input-ghost w-full focus:bg-transparent text-lg font-medium placeholder:font-normal text-slate-700" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                </div>
                <button onClick={handleSearch} className="btn btn-primary rounded-lg px-6 text-white font-bold shadow-md shadow-primary/20" disabled={isSearching}>
                    {isSearching ? <span className="loading loading-spinner"></span> : "ค้นหา"}
                </button>
            </div>
        </div>

        {/* Result Area */}
        {currentCase && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-fade-in-up">
                {/* Info Card */}
                <div className="md:col-span-2 card bg-white shadow-lg shadow-slate-100 border border-slate-100 h-fit">
                    <figure className="bg-slate-50 p-8 flex justify-center items-center">
                        <img src={currentCase.image} alt="Department" className="rounded-2xl h-32 w-32 object-cover shadow-lg bg-white p-1" />
                    </figure>
                    <div className="card-body text-center p-6">
                        <h2 className="text-2xl font-bold text-slate-800">{currentCase.id}</h2>
                        <div className="badge badge-lg badge-primary badge-outline mx-auto my-2">{currentCase.department}</div>
                        <p className="text-sm text-gray-500">Status: <span className="text-success font-semibold">{currentCase.status}</span></p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-3 card bg-white shadow-lg shadow-slate-100 border border-slate-100">
                    <div className="card-body p-6">
                        <h3 className="text-lg font-bold border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 text-slate-700">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             แก้ไขรูปภาพ
                        </h3>
                        <form onSubmit={handleUpdateImage} className="flex flex-col gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold text-slate-600">อัปโหลดรูปใหม่</span></label>
                                <input type="file" className="file-input file-input-bordered file-input-primary w-full bg-white" accept="image/*" onChange={(e) => setNewImageFile(e.target.files[0])} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold text-slate-600">เหตุผลในการเปลี่ยน <span className="text-error">*</span></span></label>
                                <textarea className="textarea textarea-bordered h-24 focus:textarea-primary bg-white text-slate-700" placeholder="ระบุรายละเอียด..." value={reason} onChange={(e) => setReason(e.target.value)} required></textarea>
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <button type="submit" className="btn btn-success text-white w-full md:w-auto px-8 font-bold shadow-lg shadow-green-100">บันทึกการแก้ไข</button>
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