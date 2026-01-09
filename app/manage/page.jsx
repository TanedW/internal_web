// app/manage/page.jsx
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 

export default function Manage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- State ข้อมูล ---
  const [allowedEmails, setAllowedEmails] = useState([
    { id: 1, email: "admin@example.com", role: "Admin", status: "Active" },
    { id: 2, email: "staff@company.com", role: "User", status: "Active" },
  ]);
  const [newEmail, setNewEmail] = useState("");

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
      console.error("Logout error:", error);
    }
  };

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    if (!newEmail.includes("@")) return; 
    if (allowedEmails.some(item => item.email === newEmail)) {
        alert("อีเมลนี้มีอยู่ในระบบแล้ว");
        return;
    }
    const newItem = { id: Date.now(), email: newEmail, role: "User", status: "Active" };
    setAllowedEmails([...allowedEmails, newItem]);
    setNewEmail(""); 
  };

  const handleDeleteEmail = (id) => {
    if(confirm("ยืนยันการลบสิทธิ์นี้?")) {
        setAllowedEmails(allowedEmails.filter(item => item.id !== id));
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    // Layout
    <div className="min-h-screen bg-slate-50 font-sans pt-20 pb-24 lg:pt-0 lg:pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* =========================================
          PART 1: MOBILE TOP BAR
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
          PART 2: MOBILE BOTTOM BAR
         ========================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-2 h-16">
            <Link href="/manage" className="flex flex-col items-center justify-center gap-1 text-primary bg-primary/5 border-t-2 border-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="text-xs font-bold">จัดการ Email</span>
            </Link>
            <Link href="/manage-case" className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <span className="text-xs font-medium">จัดการ Case</span>
            </Link>
          </div>
      </div>

      {/* =========================================
          PART 3: DESKTOP NAVBAR
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
                <li><Link href="/manage" className="font-bold text-primary bg-primary/10 rounded-lg">จัดการ Email</Link></li>
                <li><Link href="/manage-case" className="font-medium text-gray-500 hover:text-primary rounded-lg">จัดการ Case</Link></li>
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

      {/* =========================================
          PART 4: MAIN CONTENT
         ========================================= */}
      <div className="container mx-auto px-4 mt-4 lg:mt-8 max-w-6xl">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 lg:mb-8">
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">จัดการสิทธิ์ผู้ใช้งาน</h1>
                <p className="text-gray-500 mt-1 text-sm">เพิ่มรายชื่ออีเมลที่อนุญาตให้เข้าระบบ</p>
            </div>
            <div className="self-end md:self-auto badge badge-lg bg-white border-primary text-primary shadow-sm font-bold p-4 h-auto py-3">
                Total Users: {allowedEmails.length}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

            {/* --- CARD 1: FORM --- */}
            <div className="md:col-span-12 lg:col-span-4">
                <div className="card bg-white w-full shadow-lg shadow-slate-100 border border-slate-100 h-fit">
                    <div className="card-body p-5 lg:p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                            </div>
                            <h2 className="card-title text-lg text-slate-800">เพิ่มผู้ใช้ใหม่</h2>
                        </div>
                        
                        <form onSubmit={handleAddEmail} className="flex flex-col gap-4 mt-2">
                            <div className="form-control w-full">
                                <label className="input input-bordered flex items-center gap-3 w-full h-12 bg-slate-50 border-slate-200 focus-within:outline-primary focus-within:border-primary">
                                    <svg className="h-5 w-5 opacity-40 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                        </g>
                                    </svg>
                                    <input 
                                        type="email" 
                                        className="grow w-full bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400" 
                                        placeholder="mail@site.com" 
                                        required 
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                    />
                                </label>
                            </div>

                            <div className="card-actions justify-end pt-2">
                                <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary/20 text-base font-bold">
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- CARD 2: TABLE (แก้ไขให้เหมือนรูปต้นฉบับ) --- */}
            <div className="md:col-span-12 lg:col-span-8">
                <div className="card bg-white w-full shadow-lg shadow-slate-100 border border-slate-100 mb-4 lg:mb-0">
                    <div className="card-body p-0"> 
                        <div className="w-full">
                            <table className="table w-full">
                                {/* Header: ปรับ spacing ให้พอดี */}
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="py-5 pl-5 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">EMAIL ACCOUNT</th>
                                        <th className="py-5 pr-5 w-20 text-slate-400 font-bold text-xs uppercase tracking-wider text-right">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {allowedEmails.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                            
                                            {/* Column 1: Email + Badge Outline */}
                                            <td className="py-4 pl-5 align-top">
                                                <div className="flex flex-col items-start gap-1">
                                                    {/* แก้ไข: ใช้ break-words แทน break-all เพื่อไม่ให้ตัดคำกลาง email */}
                                                    <span className="font-bold text-slate-800 text-base break-words leading-tight">
                                                        {item.email}
                                                    </span>
                                                    {/* แก้ไข: Badge เป็นพื้นขาว ขอบดำ ตามรูปเป๊ะๆ */}
                                                    <span className="mt-1 px-3 py-0.5 rounded-full border border-slate-800 text-slate-800 text-xs font-medium bg-white">
                                                        Active
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Column 2: Trash Icon (Right Aligned) */}
                                            <td className="py-4 pr-5 align-middle text-right">
                                                <button onClick={() => handleDeleteEmail(item.id)} className="btn btn-square btn-sm btn-ghost text-slate-800 hover:text-red-600 hover:bg-red-50 transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allowedEmails.length === 0 && (
                                        <tr><td colSpan="2" className="text-center py-10 text-slate-400">ไม่พบข้อมูล</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}