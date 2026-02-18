'use client';

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import { 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Mail,
  Menu,
  Check 
} from "lucide-react";

// ✅ ดึง Sidebar มาจากไฟล์ภายนอก
import Sidebar from "../components/sidebar"; 

export default function Manage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- State ข้อมูล ---
  const [allowedEmails, setAllowedEmails] = useState([]); 
  const [filteredEmails, setFilteredEmails] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [canDelete, setCanDelete] = useState(false); 
  const [currentRoles, setCurrentRoles] = useState([]); 
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [roleModalData, setRoleModalData] = useState(null);
  const [selectedEmailForMobile, setSelectedEmailForMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  
  // ✅ เปลี่ยนจาก String เป็น Array เพื่อรองรับการเลือกหลายอัน
  const [newRoles, setNewRoles] = useState([]); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // รายการ Role ให้เลือก
  const ROLE_OPTIONS = [
    { value: "Admin", label: "Admin" },
    { value: "Editor", label: "Editor" },
    { value: "editor_manage_email", label: "Admin Email" },
    { value: "editor_manage_case", label: "Admin Case" },
    { value: "editor_manage_menu", label: "Admin Menu" },
    { value: "Member", label: "Member" },
    { value: "Guest", label: "Guest" },
  ];

  // ✅ CSS แก้ไข Autofill และ ซ่อน Scrollbar ใน Modal
  const customStyles = `
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #f8fafc inset !important;
        -webkit-text-fill-color: #0f172a !important;
        border-radius: 1rem !important;
        transition: background-color 5000s ease-in-out 0s;
    }
    /* ซ่อน Scrollbar สำหรับ Chrome, Safari และ Opera */
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    /* ซ่อน Scrollbar สำหรับ IE, Edge และ Firefox */
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
  `;

  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  };

  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const fetchAdmins = async () => {
    if (!API_URL) return;
    const currentAdminId = getCurrentAdminId();
    try {
      const url = currentAdminId ? `${API_URL}?requester_id=${currentAdminId}` : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch admins");
      const jsonResponse = await res.json();
      const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);
      const meta = jsonResponse.meta || {};

      setAllowedEmails(data);
      setFilteredEmails(data);
      setCanDelete(!!meta.can_delete); 

      if (currentAdminId && data.length > 0) {
        const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
        if (myProfile) {
            let roles = [];
            if (Array.isArray(myProfile.roles)) {
                roles = myProfile.roles;
            } else if (myProfile.role) {
                roles = [myProfile.role];
            }
            setCurrentRoles(roles);
        }
      }
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

  useEffect(() => {
    const results = allowedEmails.filter(item =>
      item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmails(results);
  }, [searchTerm, allowedEmails]);

  // ✅ ฟังก์ชันจัดการการเลือก Role
  const toggleRole = (roleValue) => {
    setNewRoles(prev => 
      prev.includes(roleValue) 
        ? prev.filter(r => r !== roleValue) 
        : [...prev, roleValue]
    );
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@") || newRoles.length === 0) return;
    const currentAdminId = getCurrentAdminId();
    setIsSubmitting(true);
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: newEmail,
                roles: newRoles, 
                current_admin_id: currentAdminId 
            }),
        });
        if (res.ok) {
            setNewEmail("");
            setNewRoles([]); 
            fetchAdmins();
            setSidebarKey(prev => prev + 1);
            document.getElementById('add_admin_modal').close();
        } else {
          const errorData = await res.json();
          alert(errorData.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
      }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteEmail = async (targetId) => {
    if(!confirm("ยืนยันการระงับสิทธิ์ผู้ใช้งานนี้?")) return;
    const currentAdminId = getCurrentAdminId();
    try {
        const res = await fetch(`${API_URL}?id=${targetId}`, {
            method: "DELETE", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_admin_id: currentAdminId }),
        });
        if (res.ok) {
            fetchAdmins(); 
        } else {
            const err = await res.json();
            alert(err.message || "เกิดข้อผิดพลาด");
        }
    } catch (error) { 
        console.error(error); 
        alert("ไม่สามารถติดต่อ Server ได้");
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  const isFormValid = newEmail.trim().includes("@") && newRoles.length > 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <style>{customStyles}</style>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      <Sidebar 
        key={sidebarKey}
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {/* Header Desktop - ปรับเป็นภาษาไทย */}
        <div className="hidden lg:flex justify-between items-center mb-8">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">รายชื่อสมาชิกในทีม</h1>
                <p className="text-slate-400 mt-1 font-medium">จัดการสมาชิกในทีมและกำหนดสิทธิ์การใช้งาน</p>
            </div>
            <div className="relative w-72 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="ค้นหาสมาชิก..." 
                    className="input !bg-white !text-slate-900 w-full h-12 !pl-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-2xl shadow-sm border border-slate-100 placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
            </div>
        </div>

        {/* Header Mobile - ปรับเป็นภาษาไทย */}
        <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">รายชื่อผู้ติดต่อ</h1>
            <div className="mt-4 flex gap-3 items-center">
                 <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type="text"
                        className="input w-full !pl-12 !bg-white !text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border-slate-200"
                        placeholder="ค้นหา..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                 </div>
                 <button 
                onClick={() => document.getElementById('add_admin_modal').showModal()}
                className="btn btn-primary !text-white min-h-[3rem] h-12 px-4 rounded-xl shadow-md shadow-indigo-200 whitespace-nowrap"
                >
                + เพิ่มใหม่
                </button>
            </div>
        </div>

        {/* GRID VIEW */}
        <div className={`grid grid-cols-1 gap-4 ${
            isDesktopSidebarOpen 
                ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" 
                : "md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
        }`}>
            {/* Add Member Card - ปรับเป็นภาษาไทย */}
            <div 
               className={`hidden lg:flex group relative flex-col items-center justify-center border-2 border-dashed border-indigo-300 !bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 cursor-pointer rounded-3xl shadow-md hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-2 h-full ${
                 isDesktopSidebarOpen ? 'p-4' : 'p-6'
               }`}
               onClick={() => document.getElementById('add_admin_modal').showModal()}
            >
                <div className={`rounded-full bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-300 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300 ${
                    isDesktopSidebarOpen ? 'w-12 h-12' : 'w-16 h-16'
                }`}>
                    <Plus size={isDesktopSidebarOpen ? 24 : 32} strokeWidth={3} />
                </div>
                <h3 className={`text-indigo-900 font-bold group-hover:text-indigo-700 transition-colors ${
                    isDesktopSidebarOpen ? 'text-base' : 'text-lg'
                }`}>เพิ่มสมาชิก</h3>
                <p className="text-indigo-500/80 text-xs mt-1 text-center font-medium">คลิกเพื่อเชิญผู้ดูแลระบบใหม่</p>
            </div>

            {filteredEmails.map((item) => {
                const userRoles = item.roles && item.roles.length > 0 ? item.roles : (item.role ? [item.role] : ['member']);
                return (
                    <div key={item.admin_id} 
                        className={`relative !bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center justify-center h-full hover:z-30 ${
                            isDesktopSidebarOpen ? "p-4" : "p-6"
                        }`}
                    >
                        {canDelete && (
                             <button 
                               onClick={() => handleDeleteEmail(item.admin_id)}
                               className="absolute top-2 right-2 hover:bg-red-50 rounded-full p-2 transition-colors z-10"
                               title="ลบผู้ใช้งาน"
                               style={{ color: '#ef4444' }} 
                             >
                               <Trash2 size={20} />
                             </button>
                        )}
                        <div className={`rounded-full bg-slate-50 mb-3 overflow-hidden ring-2 ring-slate-50 mx-auto ${
                            isDesktopSidebarOpen ? "w-10 h-10 mb-2" : "w-14 h-14 mb-3"
                        }`}>
                            <img 
                                src={item.profile_url || getAvatarUrl(item.email)} 
                                alt="Avatar" 
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getAvatarUrl(item.email); }}
                            />
                        </div>

                        <div className="w-full px-1"> 
                            <div className="tooltip lg:tooltip-bottom w-full before:text-[10px]" data-tip={item.email}>
                                <h3 className={`font-bold !text-slate-800 truncate whitespace-nowrap overflow-hidden ${
                                    isDesktopSidebarOpen ? "text-[10px] mb-1" : "text-sm mb-2"
                                }`}>
                                    {item.email}
                                </h3>
                            </div>
                        </div>
                        
                        <div className="lg:hidden mt-2 w-full px-2 flex flex-nowrap gap-2 justify-center items-center overflow-x-hidden">
                            {userRoles.length > 0 && (
                                <span className="flex-shrink-0 !text-indigo-600 font-bold text-[9px] uppercase tracking-wider !bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 whitespace-nowrap">
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}
                            {userRoles.length > 1 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRoleModalData(userRoles);
                                        document.getElementById('role_modal').showModal();
                                    }}
                                    className="flex-shrink-0 btn btn-xs h-7 min-h-0 !bg-slate-100 border border-slate-200 !text-slate-600 hover:bg-slate-200 rounded-full px-2.5 text-[9px] font-bold tracking-wide uppercase shadow-sm"
                                >
                                    +{userRoles.length - 1} เพิ่มเติม
                                </button>
                            )}
                        </div>

                        <div className="hidden lg:flex flex-nowrap gap-2 justify-center items-center mt-2 w-full px-1">
                            {userRoles.length > 0 && (
                                <span className={`flex-shrink-0 font-bold uppercase tracking-wider !bg-indigo-50 rounded-full border border-indigo-100 !text-indigo-600 whitespace-nowrap ${
                                    isDesktopSidebarOpen 
                                        ? "text-[9px] px-2 py-0.5" 
                                        : "text-[10px] px-3 py-1" 
                                }`}>
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}
                            {userRoles.length > 1 && (
                                <div className="tooltip tooltip-bottom z-50 flex-shrink-0 before:max-w-[15rem] before:content-[attr(data-tip)]" 
                                     data-tip={userRoles.slice(1).map(r => r.replace(/_/g, ' ')).join(', ')}>
                                    <span className={`cursor-help !text-slate-500 font-bold tracking-wider !bg-slate-100 rounded-full whitespace-nowrap border border-slate-200 hover:bg-slate-200 transition-colors flex-shrink-0 ${
                                        isDesktopSidebarOpen 
                                            ? "text-[9px] px-2 py-0.5" 
                                            : "text-[10px] px-2.5 py-1"
                                    }`}>
                                        +{userRoles.length - 1} เพิ่มเติม
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Add Member Modal - ปรับเป็นภาษาไทยและซ่อนแถบเลื่อน */}
      <dialog id="add_admin_modal" className="modal modal-bottom sm:modal-middle z-[999]">
          <div className="modal-box !bg-[#F4F6F8] p-7 rounded-t-[3rem] sm:rounded-[2.5rem] shadow-2xl relative border-none overflow-y-auto no-scrollbar max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 px-2">
                  <h3 className="font-bold text-xl !text-slate-900">เพิ่มสมาชิก</h3>
                  <button 
                    onClick={() => document.getElementById('add_admin_modal').close()} 
                    className="absolute top-6 right-6 w-10 h-10 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-110 z-20 border-4 border-white"
                  >
                      <X size={20} strokeWidth={3} />
                  </button>
              </div>
              <form onSubmit={handleAddEmail} className="flex flex-col gap-5">
                  <div className="form-control px-2">
                      <label className="label !text-slate-900 font-bold">ที่อยู่อีเมล</label>
                      <label className="input input-bordered h-14 flex items-center gap-2 !bg-white rounded-2xl border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] focus-within:ring-2 ring-indigo-100 transition-all">
                          <Mail size={18} className="!text-slate-400" />
                          <input 
                            type="email" 
                            className="grow !text-slate-900 font-bold placeholder:text-slate-300" 
                            placeholder="mail@site.com" 
                            value={newEmail} 
                            onChange={(e) => setNewEmail(e.target.value)} 
                            required 
                            autoComplete="off"
                          />
                      </label>
                  </div>

                  {/* ✅ ส่วนเลือก Role สไตล์ Card เป๊ะตามรูป */}
                  <div className="form-control px-2">
                      <label className="label !text-slate-900 font-bold">กำหนดบทบาท</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {ROLE_OPTIONS.map((opt) => {
                            const isSelected = newRoles.includes(opt.value);
                            return (
                                <div 
                                    key={opt.value}
                                    onClick={() => toggleRole(opt.value)}
                                    className={`
                                        flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 cursor-pointer
                                        bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
                                        ${isSelected ? "ring-2 ring-indigo-500 scale-[1.02]" : "ring-0"}
                                    `}
                                >
                                    <span className={`pl-2 text-[12px] font-black uppercase tracking-widest ${isSelected ? "text-indigo-900" : "text-[#475569]"}`}>
                                        {opt.label}
                                    </span>
                                    
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                                        ${isSelected ? "bg-indigo-600 shadow-lg" : "bg-[#DBE2E9]"}
                                    `}>
                                        {isSelected && <Check size={16} strokeWidth={4} className="text-white" />}
                                    </div>
                                </div>
                            );
                        })}
                      </div>
                  </div>

                  <div className="px-2 pb-2">
                    <button 
                        type="submit" 
                        className={`btn w-full mt-6 h-14 rounded-2xl text-white font-bold border-none transition-all shadow-xl active:scale-95 ${
                        isFormValid ? "!bg-[#00945e] hover:!bg-[#007a4d]" : "!bg-slate-300 !text-slate-500 cursor-not-allowed"
                        }`} 
                        disabled={isSubmitting || !isFormValid}
                    >
                            <span className="text-white text-lg tracking-wide">
                                {isSubmitting ? <span className="loading loading-spinner"></span> : "ยืนยัน"}
                            </span>
                    </button>
                  </div>
              </form>
          </div>
          <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
      </dialog>

      {/* 2. Role Modal - ปรับเป็นภาษาไทย */}
      <dialog id="role_modal" className="modal modal-bottom sm:modal-middle z-[9999]">
          <div className="modal-box !bg-white p-10 rounded-t-[3rem] sm:rounded-[2.5rem] text-center shadow-2xl border-none no-scrollbar">
              <h3 className="font-bold text-xl !text-slate-900 mb-6">บทบาททั้งหมด</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                  {roleModalData && roleModalData.map((role, idx) => (
                      <span key={idx} className="!text-indigo-600 font-bold text-xs uppercase tracking-wider !bg-indigo-50 px-4 py-2.5 rounded-2xl border border-indigo-100 shadow-sm whitespace-nowrap">
                          {role.replace(/_/g, ' ')}
                      </span>
                  ))}
              </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-slate-900/60 backdrop-blur-sm"><button>close</button></form>
      </dialog>
    </div>
  );
}