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
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR ================= */}
      <div className="navbar bg-white/90 backdrop-blur-md shadow-sm px-6 sticky top-0 z-50">
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
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><Link href="/manage" className="font-bold text-primary bg-primary/10 rounded-lg">จัดการ Email</Link></li>
            <li><Link href="/manage-case" className="font-medium text-gray-500 hover:text-primary rounded-lg">จัดการ Case</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          <button onClick={handleLogout} className="btn btn-ghost gap-2 hover:bg-rose-50 group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400 group-hover:text-rose-600">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span className="text-rose-400 font-bold group-hover:text-rose-600">Logout</span>
          </button>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8 px-2">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">จัดการสิทธิ์ผู้ใช้งาน</h1>
                <p className="text-gray-500 mt-1 text-sm">เพิ่มรายชื่ออีเมลที่อนุญาตให้เข้าระบบ</p>
            </div>
            {/* Total Users Badge - ปรับให้สวยขึ้น ไม่ดำปืดปี๋ */}
            <div className="badge badge-lg bg-white border-primary text-primary shadow-sm font-bold p-4">
                Total Users: {allowedEmails.length}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* --- CARD 1: FORM (ซ้าย) --- */}
            {/* เพิ่ม shadow-xl ให้เด้งออกมาจากพื้นหลัง */}
            <div className="md:col-span-4">
                <div className="card bg-base-100 w-full shadow-xl border border-white/50">
                    <div className="card-body p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                            </div>
                            <h2 className="card-title text-lg">เพิ่มผู้ใช้ใหม่</h2>
                        </div>
                        
                        <form onSubmit={handleAddEmail} className="flex flex-col gap-4 mt-2">
                            
                            {/* Input Validator: เพิ่ม input-bordered flex items-center gap-2 เพื่อแก้ SVG พัง */}
                            <div>
                                <label className="input validator input-bordered flex items-center gap-3 w-full h-12 bg-white">
                                    <svg className="h-5 w-5 opacity-50 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                        </g>
                                    </svg>
                                    <input 
                                        type="email" 
                                        className="grow" 
                                        placeholder="mail@site.com" 
                                        required 
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                                    />
                                </label>
                                <div className="validator-hint text-xs mt-1 text-error hidden">
                                    Enter valid email address
                                </div>
                            </div>

                            <div className="card-actions justify-end mt-2">
                                {/* ปุ่ม Success ตามรีเควส */}
                                <button type="submit" className="btn btn-success text-white w-full shadow-lg shadow-green-200 text-base font-bold">
                                    บันทึกข้อมูล
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            {/* --- CARD 2: TABLE (ขวา) --- */}
            <div className="md:col-span-8">
                <div className="card bg-base-100 w-full shadow-xl border border-white/50">
                    <div className="card-body p-0"> 
                        <div className="overflow-x-auto rounded-2xl">
                            <table className="table w-full">
                                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="py-4 pl-6 w-16">#</th>
                                        <th className="py-4">EMAIL ACCOUNT</th>
                                        <th className="py-4 text-right pr-6">ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allowedEmails.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none">
                                            <th className="pl-6 text-gray-400 font-normal">{index + 1}</th>
                                            <td className="py-4">
                                                <div className="font-bold text-gray-700 text-base">{item.email}</div>
                                                <div className="badge badge-success badge-xs badge-outline mt-1.5 gap-1 py-2 px-2 bg-green-50">
                                                    Active
                                                </div>
                                            </td>
                                            <td className="text-right pr-6">
                                                <button onClick={() => handleDeleteEmail(item.id)} className="btn btn-square btn-sm btn-ghost text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {allowedEmails.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-10 text-gray-400">ไม่พบข้อมูล</td></tr>
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