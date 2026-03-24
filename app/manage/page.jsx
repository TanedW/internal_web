'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; 
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Mail,
  Check 
} from "lucide-react";

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
  const [newEmail, setNewEmail] = useState("");
  const [newRoles, setNewRoles] = useState([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [initialRoles, setInitialRoles] = useState([]); 

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // --- UI Logic: Role Configuration ---
  const ROLE_OPTIONS = [
    { value: "editor_manage_user", label: "Admin Email", desc: "จัดการสิทธิ์สมาชิก" },
    { value: "editor_manage_org", label: "Admin Manage Org", desc: "จัดการข้อมูลองค์กร" },
    { value: "editor_manage_case", label: "Admin Case", desc: "จัดการเคส/ปัญหา" },
    { value: "editor_manage_menu", label: "Admin Menu", desc: "ตั้งค่าเมนู LINE" },
    { value: "editor_manage_flex", label: "Admin Flex Message", desc: "จัดการข้อความ Flex" },
    { value: "editor_search_duplicate_org", label: "Admin Search Org", desc: "ค้นหาข้อมูลซ้ำ" },
    { value: "editor_file_search", label: "Admin File Search", desc: "ค้นหาไฟล์ในระบบ" },
  ];

  const ROLE_LABEL_MAP = {
    "admin": "Super Admin",
    "editor_manage_user": "Admin Email",
    "editor_manage_org": "Admin Manage Org",
    "editor_manage_case": "Admin Case",
    "editor_manage_menu": "Admin Menu",
    "editor_manage_flex": "Admin Flex Message",
    "editor_search_duplicate_org": "Admin Search Org",
    "editor_file_search": "Admin File Search",
  };

  const getRoleStyles = (roleValue) => {
    const role = roleValue.toLowerCase();
    if (role === 'admin') {
        return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", ring: "ring-orange-500", solid: "bg-orange-600" };
    }
    if (role.includes('user')) {
      return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", ring: "ring-purple-500", solid: "bg-purple-600" };
    } else if (role.includes('org') || role.includes('case') || role === 'editor') {
      return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", ring: "ring-emerald-500", solid: "bg-emerald-600" };
    } else {
      return { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", ring: "ring-sky-500", solid: "bg-sky-600" };
    }
  };

  const getRoleLabel = (roleValue) => ROLE_LABEL_MAP[roleValue] || roleValue.replace(/_/g, ' ');

  const getCurrentAdminId = useCallback(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      return storedId.replace(/^"|"$/g, ''); 
    }
    return null;
  }, []);

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
            let roles = Array.isArray(myProfile.roles) ? myProfile.roles : (myProfile.role ? [myProfile.role] : []);
            setCurrentRoles(roles);
        }
      }
    } catch (error) { console.error("Error loading admins:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) { setUser(currentUser); fetchAdmins(); } 
      else { router.push("/"); }
    });
    return () => unsubscribe();
  }, [router, API_URL]);

  useEffect(() => {
    const results = allowedEmails.filter(item => item.email.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredEmails(results);
  }, [searchTerm, allowedEmails]);

  const toggleRole = (roleValue) => {
    setNewRoles(prev => prev.includes(roleValue) ? prev.filter(r => r !== roleValue) : [...prev, roleValue]);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin.admin_id);
    setEditEmail(admin.email);
    const dbRoles = Array.isArray(admin.roles) ? admin.roles : (admin.role ? [admin.role] : []);
    setNewRoles([...dbRoles]); 
    setInitialRoles([...dbRoles]);
    document.getElementById('add_admin_modal').showModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin && (!newEmail.trim() || !newEmail.includes("@"))) return;
    if (newRoles.length === 0) return;
    const currentAdminId = getCurrentAdminId();
    setIsSubmitting(true);
    try {
        const method = editingAdmin ? "PUT" : "POST";
        const bodyData = editingAdmin 
            ? { admin_id: editingAdmin, roles: newRoles, current_admin_id: currentAdminId }
            : { email: newEmail, roles: newRoles, current_admin_id: currentAdminId };
        const res = await fetch(API_URL, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
        });
        if (res.ok) {
            setNewEmail(""); setNewRoles([]); setEditingAdmin(null);
            fetchAdmins(); setSidebarKey(prev => prev + 1);
            document.getElementById('add_admin_modal').close();
        } else {
            const errorData = await res.json();
            
            // --- ส่วนที่แก้ไข: ถ้าเจอข้อความว่ามีอีเมลอยู่แล้ว ให้ปิด Modal ทันที ---
            if (errorData.message === 'มี email อยู่ในระบบแล้ว') {
                document.getElementById('add_admin_modal').close(); // ปิด Modal
                setNewEmail(""); // ล้างค่าอีเมลที่กรอกค้างไว้
                setNewRoles([]); // ล้างค่า roles
            }
            
            // แสดงแจ้งเตือนให้ผู้ใช้ทราบ
            alert(errorData.message || "เกิดข้อผิดพลาด");
        }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteEmail = async (targetId) => {
    const isSelfDelete = String(targetId) === String(getCurrentAdminId());
    const confirmMsg = isSelfDelete 
      ? "⚠️ คุณกำลังจะระงับสิทธิ์ตัวเอง ซึ่งจะทำให้คุณหลุดออกจากระบบทันที ยืนยันหรือไม่?" 
      : "ยืนยันการระงับสิทธิ์ผู้ใช้งานนี้?";

    if(!confirm(confirmMsg)) return;

    const currentAdminId = getCurrentAdminId();
    try {
        const res = await fetch(`${API_URL}?id=${targetId}`, {
            method: "DELETE", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_admin_id: currentAdminId }),
        });
        
        if (res.ok) { 
          if (isSelfDelete) {

            sessionStorage.clear();
            localStorage.removeItem("current_admin_id");
            window.location.href = "/";
          } else {
            fetchAdmins(); 
          }
        } 
        else { 
          const err = await res.json(); 
          alert(err.message || "เกิดข้อผิดพลาด"); 
        }
    } catch (error) { 
      console.error(error); 
      alert("ไม่สามารถติดต่อ Server ได้"); 
    }
  };

  const isRolesChanged = JSON.stringify([...newRoles].sort()) !== JSON.stringify([...initialRoles].sort());
  const isFormValid = editingAdmin 
    ? (newRoles.length > 0 && isRolesChanged) 
    : (newEmail.trim().includes("@") && newRoles.length > 0); 

  const canModifyMembers = currentRoles.includes("admin") || currentRoles.includes("editor_manage_user");

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      
      <Sidebar 
        key={sidebarKey}
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      <div className={`container mx-auto px-4 lg:px-6 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-72" : "lg:pl-24"
      }`}>
        
        {/* Header Section */}
        <div className="hidden lg:flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">รายชื่อสมาชิกในทีม</h1>
                <p className="text-slate-400 mt-0.5 font-medium text-sm">จัดการสมาชิกและกำหนดสิทธิ์การใช้งาน</p>
            </div>
             <div className="relative w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="ค้นหาสมาชิก..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
            </div>
        </div>

        {/* Mobile Header Section */}
        <div className="lg:hidden mb-5">
            <h1 className="text-xl font-bold text-slate-900">รายชื่อผู้ติดต่อ</h1>
            <div className="mt-3 flex gap-3 items-center">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <input 
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium text-sm"
                        placeholder="ค้นหา..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <button 
                    onClick={() => {
                        setEditingAdmin(null);
                        setNewEmail("");
                        setNewRoles([]);
                        document.getElementById('add_admin_modal').showModal();
                    }}
                    className="btn h-10 min-h-0 !bg-slate-900 hover:!bg-black !text-white px-4 rounded-xl shadow-md whitespace-nowrap border-none transition-all active:scale-95 flex items-center gap-1.5 text-[13px] font-bold"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>เพิ่มใหม่</span>
                </button>
            </div>
        </div>

        {/* GRID VIEW */}
        <div className={`grid grid-cols-1 gap-5 items-stretch ${
            isDesktopSidebarOpen 
                ? "md:grid-cols-2 xl:grid-cols-4" 
                : "md:grid-cols-3 xl:grid-cols-5" 
        }`}>
            {/* Add Member Card */}
            <div 
              className={`hidden lg:flex group relative flex-col items-center justify-center border-2 border-dashed border-indigo-200 !bg-white hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer rounded-[2rem] shadow-sm hover:shadow-md hover:-translate-y-1 h-full min-h-[180px] p-4`}
              onClick={() => {
                setEditingAdmin(null);
                setNewEmail("");
                setNewRoles([]);
                document.getElementById('add_admin_modal').showModal();
              }}
            >
              <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 mb-3 group-hover:scale-105 transition-all duration-300">
                <Plus size={22} strokeWidth={3} />
              </div>
              <div className="w-full text-center">
                <h3 className="font-bold text-indigo-900 text-[16px]">เพิ่มสมาชิก</h3>
                <p className="text-indigo-300 text-[12px] mt-0.5 font-medium">เชิญผู้ดูแลใหม่</p>
              </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-full min-h-[180px]">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-slate-400">กำลังโหลด...</span>
                  </div>
                </div>
              ) : (
              filteredEmails.map((item) => {
                  const userRoles = item.roles && item.roles.length > 0 ? item.roles : (item.role ? [item.role] : ['member']);
                  const mainRoleStyle = getRoleStyles(userRoles[0]);
                  
                  return (
                      <div key={item.admin_id} 
                          className={`relative !bg-white rounded-[2rem] border border-slate-50 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center text-center overflow-hidden h-full min-h-[180px] p-5`}
                      >
                          {/* ส่วนจัดการ: สามารถแก้ไข และลบได้ทุกคนรวมถึงตัวเอง */}
                          {canModifyMembers && (
                              <div className="absolute top-3 right-4 flex gap-0.5 z-10">
                                  <button onClick={() => openEditModal(item)} className="p-1.5 hover:bg-indigo-50 rounded-full transition-colors text-indigo-500" title="แก้ไข">
                                    <Pencil size={15} />
                                  </button>
                                  <button onClick={() => handleDeleteEmail(item.admin_id)} className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-red-400" title="ลบ">
                                    <Trash2 size={16} />
                                  </button>
                              </div>
                          )}

                          <div className={`rounded-full bg-slate-50 mb-3 overflow-hidden ring-2 ring-slate-50 mx-auto flex-shrink-0 w-12 h-12`}>
                              <img 
                                  src={item.profile_url || getAvatarUrl(item.email)} 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getAvatarUrl(item.email); }}
                              />
                          </div>

                          <div className="w-full px-1 mb-3"> 
                              <div className="tooltip lg:tooltip-bottom w-full before:text-[10px]" data-tip={item.email}>
                                  <h3 className={`font-bold !text-slate-800 truncate block w-full overflow-hidden text-[13px]`}>
                                      {item.email}
                                  </h3>
                              </div>
                          </div>

                          <div className="flex flex-row gap-2 justify-center items-center w-full mt-auto">
                            {userRoles.length > 0 && (
                              <span className={`
                                font-black uppercase tracking-wider rounded-xl border-2 truncate text-[10px] px-3 py-1.5 flex-1 shadow-sm
                                ${mainRoleStyle.bg} ${mainRoleStyle.text} ${mainRoleStyle.border} 
                                border-current
                              `}>
                                {getRoleLabel(userRoles[0])}
                              </span>
                            )}
                            
                            {userRoles.length > 1 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRoleModalData(userRoles);
                                  document.getElementById('role_modal').showModal();
                                }}
                                className="flex items-center justify-center min-h-0 h-7 px-2 bg-white border-2 border-slate-200 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 rounded-xl font-black text-[10px] shadow-sm transition-all duration-200 active:scale-90 flex-shrink-0"
                              >
                                +{userRoles.length - 1}
                              </button>
                            )}
                          </div>
                      </div>
                  );
              })
            )}
        </div>
      </div>

      {/* Modal: เพิ่ม/แก้ไขสมาชิก */}
      <dialog id="add_admin_modal" className="modal z-[999]">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="modal-box !bg-[#F4F6F8] p-6 rounded-[2rem] shadow-2xl relative border-none overflow-y-auto max-h-[90vh] w-full max-w-lg animate-in zoom-in duration-300">
              
              <div className="flex justify-between items-center mb-5 px-1">
                  <h3 className="font-bold text-lg !text-slate-900">
                    {editingAdmin ? "แก้ไขบทบาท" : "เพิ่มสมาชิกใหม่"}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => {
                        setEditingAdmin(null);
                        setNewEmail("");
                        setNewRoles([]);
                        document.getElementById('add_admin_modal').close();
                    }} 
                    className="absolute top-5 right-5 w-8 h-8 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-110 z-20 border-2 border-white"
                  >
                      <X size={16} strokeWidth={3} />
                  </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {!editingAdmin ? (
                   <div className="form-control px-1">
                      <label className="label py-1 !text-slate-800 font-bold text-sm">ที่อยู่อีเมล</label>
                      <label className="input input-bordered h-12 flex items-center gap-3 !bg-white rounded-xl border-none shadow-sm focus-within:ring-2 ring-indigo-100 transition-all px-5 mt-1">
                          <Mail size={16} className="!text-slate-400 shrink-0" />
                          <input 
                            type="email" 
                            className="grow !text-slate-800 font-bold placeholder:text-slate-300 outline-none text-sm" 
                            placeholder="mail@site.com" 
                            value={newEmail} 
                            onChange={(e) => setNewEmail(e.target.value)} 
                            required={!editingAdmin}
                            autoComplete="off"
                          />
                      </label>
                  </div>
                  ) : (
                      <div className="px-1">
                          <p className="text-[12px] text-slate-500">กำลังแก้ไขบทบาทของ:</p>
                          <p className="font-bold text-md text-slate-800 tracking-tight">{editEmail}</p>
                      </div>
                  )}

                  <div className="form-control px-1">
                      <label className="label py-1 !text-slate-800 font-bold text-sm">กำหนดบทบาท <span className="text-[10px] font-normal text-slate-400 ml-2">(เลือกได้หลายสิทธิ์)</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                        {ROLE_OPTIONS.map((opt) => {
                            const isSelected = newRoles.includes(opt.value);
                            const style = getRoleStyles(opt.value);
                            return (
                                <div 
                                    key={opt.value}
                                    onClick={() => toggleRole(opt.value)}
                                    className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-300 cursor-pointer border bg-white hover:shadow-md ${isSelected ? `${style.ring} ${style.border} ring-2 scale-[1.02]` : "border-transparent shadow-sm"}`}
                                >
                                    <div className="flex flex-col pl-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? style.text : "text-slate-600"}`}>{opt.label}</span>
                                        <span className="text-[9px] text-slate-400 font-medium leading-tight">{opt.desc}</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? `${style.solid} shadow-md` : "bg-slate-100"}`}>
                                        {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                                    </div>
                                </div>
                            );
                        })}
                      </div>
                  </div>

                  <div className="px-1 pt-2">
                    <button type="submit" 
                        className={`btn w-full h-12 rounded-xl text-white font-bold border-none transition-all shadow-lg active:scale-95 text-sm flex items-center justify-center ${isFormValid ? "!bg-emerald-600 hover:!bg-emerald-700" : "!bg-slate-300 !text-slate-500 cursor-not-allowed"}`} 
                        disabled={isSubmitting || !isFormValid}
                    >
                        {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        <span>กำลังดำเนินการ...</span>
                      </>
                    ) : (
                      <>
                        <span>{editingAdmin ? "บันทึกการเปลี่ยนแปลง" : "ยืนยันการเพิ่มสมาชิก"}</span>
                      </>
                    )}</button>
                  </div>
              </form>
          </div>
          <form method="dialog" className="fixed inset-0 -z-10 cursor-default">
            <button className="w-full h-full cursor-default">close</button>
          </form>
        </div>
      </dialog>

      {/* Modal: แสดง Role ทั้งหมด */}
      <dialog id="role_modal" className="modal z-[9999]">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="modal-box !bg-white p-8 rounded-[2rem] text-center shadow-2xl border-none relative w-full max-w-sm animate-in zoom-in duration-300">
              <button 
                type="button"
                onClick={() => document.getElementById('role_modal').close()} 
                className="absolute top-4 right-4 w-8 h-8 !bg-[#ef4444] !text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all"
              >
                <X size={16} strokeWidth={3} />
              </button>
              <h3 className="font-bold text-lg !text-slate-900 mb-5 mt-2">บทบาททั้งหมด</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {roleModalData && roleModalData.map((role, idx) => {
                  const style = getRoleStyles(role);
                  return (
                    <span key={idx} className={`font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg border shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                      {getRoleLabel(role)}
                    </span>
                  );
                })}
              </div>
            </div>
            <form method="dialog" className="fixed inset-0 -z-10">
              <button className="w-full h-full cursor-default">close</button>
            </form>
          </div>
      </dialog>
    </div>
  );
}