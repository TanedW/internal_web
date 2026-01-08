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
    <div className="min-h-screen bg-base-200 font-sans pb-10">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ================= NAVBAR (ตัดปุ่ม Hamburger ออกแล้ว) ================= */}
      <div className="navbar bg-base-100 shadow-sm">
        
        {/* Navbar Start: เหลือแค่ Profile */}
        <div className="navbar-start">
           {/* ลบ div dropdown ของ Hamburger ออกไปแล้ว */}
          
          <a className="btn btn-ghost text-xl gap-2">
            <div className="avatar w-8 h-8">
                <div className="rounded-full">
                    <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="User"/>
                </div>
            </div>
            <span className="hidden md:inline text-base font-normal">{user?.displayName || "Admin"}</span>
          </a>
        </div>

        {/* Navbar Center: Desktop Menu */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
                <Link href="/manage">จัดการ Email</Link>
            </li>
            <li>
                {/* ใส่ Active class */}
                <Link href="/manage-case" className="font-bold text-primary">จัดการ Case</Link>
            </li>
          </ul>
        </div>

        {/* Navbar End: Button */}
        <div className="navbar-end">
          <a onClick={handleLogout} className="btn">Logout</a>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="container mx-auto px-4 mt-10 max-w-4xl">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-base-content">จัดการข้อมูล Case (Change Image)</h1>
            <p className="text-gray-500 mt-2">ค้นหา Case ID เพื่อทำการแก้ไขรูปภาพหน่วยงาน</p>
        </div>

        {/* Search Box */}
        <div className="card bg-base-100 shadow-xl border border-base-200 mb-8 max-w-2xl mx-auto">
            <div className="card-body flex-row items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="form-control flex-1">
                    <input type="text" placeholder="ระบุ Case ID (เช่น CASE-001)" className="input input-ghost w-full focus:bg-transparent text-lg font-medium placeholder:font-normal" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                </div>
                <button onClick={handleSearch} className="btn btn-primary rounded-lg px-6" disabled={isSearching}>
                    {isSearching ? <span className="loading loading-spinner"></span> : "ค้นหา"}
                </button>
            </div>
        </div>

        {/* Result Area */}
        {currentCase && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 animate-fade-in-up">
                {/* Info Card */}
                <div className="md:col-span-2 card bg-base-100 shadow-lg border border-base-200 h-fit">
                    <figure className="bg-base-200 p-8 flex justify-center items-center">
                        <img src={currentCase.image} alt="Department" className="rounded-2xl h-32 w-32 object-cover shadow-lg bg-white p-1" />
                    </figure>
                    <div className="card-body text-center p-6">
                        <h2 className="text-2xl font-bold">{currentCase.id}</h2>
                        <div className="badge badge-lg badge-primary badge-outline mx-auto my-2">{currentCase.department}</div>
                        <p className="text-sm text-gray-500">Status: <span className="text-success font-semibold">{currentCase.status}</span></p>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-3 card bg-base-100 shadow-lg border border-base-200">
                    <div className="card-body p-6">
                        <h3 className="text-lg font-bold border-b pb-3 mb-4 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             แก้ไขรูปภาพ
                        </h3>
                        <form onSubmit={handleUpdateImage} className="flex flex-col gap-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold">อัปโหลดรูปใหม่</span></label>
                                <input type="file" className="file-input file-input-bordered file-input-primary w-full" accept="image/*" onChange={(e) => setNewImageFile(e.target.files[0])} />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-semibold">เหตุผลในการเปลี่ยน <span className="text-error">*</span></span></label>
                                <textarea className="textarea textarea-bordered h-24 focus:textarea-primary" placeholder="ระบุรายละเอียด..." value={reason} onChange={(e) => setReason(e.target.value)} required></textarea>
                            </div>
                            <div className="card-actions justify-end mt-4">
                                <button type="submit" className="btn btn-success text-white w-full md:w-auto px-8">บันทึกการแก้ไข</button>
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