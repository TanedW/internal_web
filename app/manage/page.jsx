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
    <div className="min-h-screen bg-slate-50/50 font-sans pt-20 pb-24 lg:pt-0 lg:pb-10">
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
          PART 2: MOBILE BOTTOM BAR (Split Design: Email Active)
         ========================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
          <div className="flex w-full h-20">
            
            {/* 1. ปุ่มซ้าย: Email (Active -> พื้นดำ ตัวหนังสือขาว) */}
            <Link 
                href="/manage" 
                className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-[#0F172A] !text-white shadow-inner active:opacity-90 transition-colors duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <span className="text-xs font-bold tracking-wide">จัดการ Email</span>
            </Link>
            
            {/* 2. ปุ่มขวา: Case (Inactive -> พื้นขาว ตัวหนังสือดำ) */}
            <Link 
                href="/manage-case" 
                className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-white text-slate-800 active:bg-gray-50 transition-colors duration-300"
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
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">จัดการสิทธิ์ผู้ใช้งาน</h1>
                <p className="text-slate-500 mt-1 text-sm">เพิ่มรายชื่ออีเมลที่อนุญาตให้เข้าระบบ</p>
            </div>
            
            {/* Total Users: Blue Background */}
            <div className="self-end md:self-auto badge badge-lg bg-blue-600 border-none text-white shadow-md font-bold p-4 h-auto py-3 rounded-full">
                Total Users: {allowedEmails.length}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

            {/* --- CARD 1: FORM --- */}
            <div className="md:col-span-12 lg:col-span-4">
                <div className="card bg-white w-full shadow-xl shadow-slate-100 border border-slate-100 h-fit rounded-2xl">
                    <div className="card-body p-5 lg:p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                            </div>
                            <h2 className="card-title text-lg text-slate-800">เพิ่มผู้ใช้ใหม่</h2>
                        </div>
                        
                        <form onSubmit={handleAddEmail} className="flex flex-col gap-4">
                            <div className="form-control w-full">
                                <label className="input input-bordered flex items-center gap-3 w-full h-12 bg-slate-50 border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-xl">
                                    <svg className="h-5 w-5 text-slate-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor">
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
                                {/* ปุ่มบันทึกข้อมูลสีเขียว */}
                                <button type="submit" className="btn btn-success !text-white w-full shadow-lg shadow-green-200 text-base font-bold rounded-xl h-11 border-none hover:bg-green-600">
                                    บันทึกข้อมูล
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- CARD 2: TABLE --- */}
            <div className="md:col-span-12 lg:col-span-8">
                <div className="card bg-white w-full shadow-xl shadow-slate-100 border border-slate-100 mb-4 lg:mb-0 rounded-2xl overflow-hidden">
                    <div className="card-body p-0"> 
                        <div className="w-full">
                            <table className="table w-full">
                                {/* Header */}
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="py-5 pl-6 text-slate-400 font-bold text-xs uppercase tracking-wider text-left">EMAIL ACCOUNT</th>
                                        <th className="py-5 pr-6 w-20 text-slate-400 font-bold text-xs uppercase tracking-wider text-right">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {allowedEmails.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                                            
                                            {/* Column 1: Email + Badge Outline */}
                                            <td className="py-4 pl-6 align-top">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="font-bold text-slate-800 text-base break-words leading-tight">
                                                        {item.email}
                                                    </span>
                                                    <span className="mt-1 px-2.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                                                        Active
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* Column 2: Trash Icon */}
                                            <td className="py-4 pr-6 align-middle text-right">
                                                <button onClick={() => handleDeleteEmail(item.id)} className="btn btn-square btn-sm btn-ghost text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allowedEmails.length === 0 && (
                                        <tr><td colSpan="2" className="text-center py-12 text-slate-300">ไม่พบข้อมูล</td></tr>
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