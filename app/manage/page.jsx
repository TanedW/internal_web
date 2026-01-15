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
  const [allowedEmails, setAllowedEmails] = useState([]); 
  const [filteredEmails, setFilteredEmails] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 

  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. กำหนด API URL
  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // 2. Helper Functions
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  };

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // --- API Functions ---
  const fetchAdmins = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      setAllowedEmails(data);
      setFilteredEmails(data);
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
  }, [router, API_URL]);

  // --- Logic การค้นหา ---
  useEffect(() => {
    const results = allowedEmails.filter(item =>
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmails(results);
  }, [searchTerm, allowedEmails]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) return;
    
    if (allowedEmails.some(item => item.email === newEmail)) {
        alert("อีเมลนี้มีอยู่ในระบบแล้ว");
        return;
    }

    const currentAdminId = getCurrentAdminId();
    if (!currentAdminId) {
        alert("ไม่พบข้อมูลผู้ดูแลระบบ");
        return;
    }

    setIsSubmitting(true);
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: newEmail,
                current_admin_id: currentAdminId 
            }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to add admin");

        setNewEmail("");
        fetchAdmins();
        document.getElementById('add_admin_modal').close();

    } catch (error) {
        console.error("Error adding admin:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteEmail = async (targetId) => {
    if(!confirm("ยืนยันการลบสิทธิ์นี้?")) return;

    const currentAdminId = getCurrentAdminId();
    if (!currentAdminId) return;

    try {
        const res = await fetch(`${API_URL}?id=${targetId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_admin_id: currentAdminId }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to delete admin");

        fetchAdmins();
    } catch (error) {
        console.error("Error deleting admin:", error);
        alert("ลบไม่สำเร็จ: " + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans pb-32 lg:pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR MOBILE (FULL WIDTH BOTTOM) ================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex justify-between items-center px-6 py-3 pb-safe">
            
            {/* 1. ปุ่ม Email (Active - หน้าปัจจุบัน) */}
            <Link href="/manage" className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full bg-slate-900 !text-white shadow-lg shadow-slate-900/20 transition-all duration-300 transform scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2-2L2 7"></path></svg>
                <span className="text-[10px] font-bold tracking-wide">Email</span>
            </Link>

            {/* 2. ปุ่ม Case (Inactive) */}
            <Link href="/manage-case" className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                <span className="text-[10px] font-medium">Case</span>
            </Link>

             {/* 3. ปุ่ม Menu (Inactive) */}
            <Link href="/manage-richmenu" className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                <span className="text-[10px] font-medium">Menu</span>
            </Link>

          </div>
      </div>

       {/* ================= NAVBAR MOBILE TOP ================= */}
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
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
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
            
            {/* --- แก้ไขส่วน Navbar Center ตามที่ขอ --- */}
            <div className="navbar-center">
                <ul className="menu menu-horizontal px-1 gap-3">
                    {/* เมนู Email (หน้านี้ Active -> สีดำ ตัวหนังสือขาว) */}
                    <li>
                        <Link href="/manage" className="!bg-slate-900 !text-white shadow-lg shadow-slate-300 rounded-full px-6 py-2.5 font-bold hover:!bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                            จัดการ Email
                        </Link>
                    </li>
                    
                    {/* เมนู Case (Inactive -> สีขาว ตัวหนังสือดำ) */}
                    <li>
                        <Link href="/manage-case" className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-full px-6 py-2.5 font-bold hover:shadow-md hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">
                            จัดการ Case
                        </Link>
                    </li>

                     {/* เมนู Menu (Inactive -> สีขาว ตัวหนังสือดำ) */}
                    <li>
                        <Link href="/manage-richmenu" className="bg-white text-slate-700 border border-slate-200 shadow-sm rounded-full px-6 py-2.5 font-bold hover:shadow-md hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-200">
                            จัดการ Menu
                        </Link>
                    </li>
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
      
      <div className="container mx-auto px-4 lg:px-8 pt-24 lg:pt-8 max-w-7xl">
        
        {/* Header Desktop Only (ค้นหา) */}
        <div className="hidden lg:flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Team Directory</h1>
            <div className="relative w-72">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <input 
                    type="text" 
                    placeholder="Search members..." 
                    className="input input-bordered bg-white w-full h-10 !pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
            </div>
        </div>

        {/* HEADER MOBILE (Fixed Layout) */}
        <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
            <div className="mt-4 flex gap-3 items-center">
                 {/* Search Input Box */}
                 <div className="relative flex-1 group">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                     </div>
                     <input 
                        type="text"
                        className="input input-bordered w-full !pl-12 bg-white text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border-slate-200"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                 </div>
                 {/* Add Button */}
                 <button 
                    onClick={() => document.getElementById('add_admin_modal').showModal()}
                    className="btn btn-primary text-white min-h-[3rem] h-12 px-4 rounded-xl shadow-md shadow-indigo-200 whitespace-nowrap"
                  >
                      + New
                  </button>
            </div>
        </div>

        {/* --- DESKTOP GRID VIEW --- */}
        <div className="hidden lg:grid grid-cols-4 gap-6">
            
            {/* Card 1: Add New */}
            <div 
                className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-300 bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 min-h-[280px] cursor-pointer rounded-2xl shadow-md hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-2"
                onClick={() => document.getElementById('add_admin_modal').showModal()}
            >
                <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-indigo-300 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                      </svg>
                </div>
                <h3 className="text-indigo-900 font-bold text-xl group-hover:text-indigo-700 transition-colors">Add Member</h3>
                <p className="text-indigo-500/80 text-sm mt-2 text-center px-4 font-medium">Click to invite new admin</p>
            </div>

            {/* User Cards Loop (MODIFIED WITH CONSOLE.LOG) */}
            {filteredEmails.map((item) => {
                // 🛠️ DEBUGGING: ปริ้นท์ข้อมูล item ของแต่ละคนออกมาดูที่ Console
                // console.log("👉 User Data:", item);

                // ต้องมี return เพราะเราใส่ปีกกา {} ครอบ arrow function แล้ว
                return (
                    <div key={item.admin_id} className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-slate-100 flex flex-col items-center text-center min-h-[280px]">
                        
                        {/* (Optional) Uncomment บรรทัดล่างนี้ถ้าอยากเห็นข้อมูล JSON บนหน้าจอเลย */}
                        {/* <div className="absolute top-0 left-0 bg-black/80 text-white text-[10px] w-full h-20 overflow-auto z-50 text-left p-2">{JSON.stringify(item, null, 2)}</div> */}

                        <button 
                            onClick={() => handleDeleteEmail(item.admin_id)}
                            className="absolute top-4 right-4 !text-red-500 hover:bg-red-50 rounded-full p-2 transition-colors z-10"
                            title="Remove user"
                            style={{ color: '#ef4444' }} 
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="w-24 h-24 rounded-full bg-slate-100 mb-5 overflow-hidden ring-4 ring-slate-50">
                            <img 
                                src={item.profile_url || getAvatarUrl(item.email)} 
                                alt="Avatar" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.onerror = null; 
                                    e.currentTarget.src = getAvatarUrl(item.email);
                                }}
                            />
                        </div>
                        
                        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate w-full px-2" title={item.email}>
                            {item.email}
                        </h3>
                        
                        <p className="text-blue-600 font-medium text-sm mb-4">Admin Member</p>
                        
                        <div className="mt-auto pt-4 border-t border-slate-50 w-full flex justify-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                  Active
                              </span>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* --- MOBILE LIST VIEW --- */}
        <div className="lg:hidden flex flex-col gap-3">
             {filteredEmails.length === 0 && (
                <div className="text-center py-10 text-slate-400">No contacts found</div>
             )}

             {filteredEmails.map((item) => (
                 <div key={item.admin_id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-slate-50">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                                <img 
                                    src={item.profile_url || getAvatarUrl(item.email)} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null; 
                                        e.currentTarget.src = getAvatarUrl(item.email);
                                    }}
                                />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 text-base truncate pr-2">{item.email}</span>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <span>Administrator</span>
                                <span>•</span>
                                <span className="text-green-600">Active</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleDeleteEmail(item.admin_id)}
                        className="btn btn-ghost btn-circle btn-sm !text-red-500 hover:bg-red-50"
                        style={{ color: '#ef4444' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                 </div>
             ))}
        </div>

      </div>

      {/* --- ADD ADMIN MODAL (POPUP FIXED MOBILE) --- */}
      <dialog id="add_admin_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white p-5 lg:p-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-slate-800">Add Team Member</h3>
               <button 
                 onClick={() => document.getElementById('add_admin_modal').close()} 
                 className="btn btn-sm btn-circle btn-ghost text-slate-400"
               >✕</button>
            </div>
            
            <form onSubmit={handleAddEmail}>
              
                <div className="join w-full flex">
                    <label className="input input-bordered flex items-center gap-2 join-item flex-1 bg-slate-50 border-slate-200 focus-within:outline-none focus-within:border-slate-200 h-12 min-w-0">
                        <svg className="h-[1em] opacity-50 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                            </g>
                        </svg>
                        <input 
                            type="email" 
                            className="grow border-none outline-none focus:ring-0 min-w-0" 
                            placeholder="mail@site.com" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required 
                        />
                    </label>
                    <button 
                        type="submit" 
                        className="btn btn-neutral join-item px-6 h-12 min-h-0 flex-shrink-0"
                        disabled={isSubmitting}
                    >
                         {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : "Join"}
                    </button>
                </div>
            </form>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
      </dialog>

    </div>
  );
}
