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
  Menu 
} from "lucide-react";

// ✅ ดึง Sidebar มาจากไฟล์ภายนอก
import Sidebar from "../components/sidebar"; 

export default function Manage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- State ข้อมูล (คงไว้ตามเดิมเป๊ะ) ---
  const [allowedEmails, setAllowedEmails] = useState([]); 
  const [filteredEmails, setFilteredEmails] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [canDelete, setCanDelete] = useState(false); 
  const [currentRoles, setCurrentRoles] = useState([]); 
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [roleModalData, setRoleModalData] = useState(null);
  const [selectedEmailForMobile, setSelectedEmailForMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

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

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes("@")) return;
    const currentAdminId = getCurrentAdminId();
    setIsSubmitting(true);
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: newEmail,
                role: newRole, 
                current_admin_id: currentAdminId 
            }),
        });
        if (res.ok) {
            setNewEmail("");
            fetchAdmins();
            document.getElementById('add_admin_modal').close();
        }
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteEmail = async (targetId) => {
    if(!confirm("ยืนยันการลบสิทธิ์นี้?")) return;
    const currentAdminId = getCurrentAdminId();
    try {
        await fetch(`${API_URL}?id=${targetId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_admin_id: currentAdminId }),
        });
        fetchAdmins();
    } catch (error) { console.error(error); }
  };

  const handleEmailMobileClick = (email) => {
    if (window.innerWidth < 1024) {
      setSelectedEmailForMobile(email);
      document.getElementById('email_mobile_modal').showModal();
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans">
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>

      {/* ✅ เรียกใช้ Sidebar คอมโพเนนต์ที่แยกออกมา */}
      <Sidebar 
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} 
      />

      {/* ================= MAIN CONTENT ================= */}
      <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${
          isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"
      }`}>
        
        {!isDesktopSidebarOpen && (
             <div className="hidden lg:block fixed top-8 left-8 z-30">
                <button 
                    onClick={() => setIsDesktopSidebarOpen(true)}
                    className="btn btn-square btn-ghost bg-white border border-slate-200 shadow-lg shadow-indigo-100/50 text-slate-800 hover:bg-slate-50 transition-all duration-300"
                    title="Open Sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
             </div>
        )}

        {/* --- Header Desktop --- */}
        <div className="hidden lg:flex justify-between items-center mb-8">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Team Directory</h1>
                <p className="text-slate-400 mt-1 font-medium">Manage your team members and permissions</p>
            </div>
            <div className="relative w-72 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search members..." 
                    className="input bg-white w-full h-12 !pl-12 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-2xl shadow-sm border border-slate-100 placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
            </div>
        </div>
       <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
            <div className="mt-4 flex gap-3 items-center">
                 <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                      </div>
                      <input 
                        type="text"
                        className="input w-full !pl-12 bg-white text-slate-900 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border-slate-200"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                 </div>
                 <button 
                    onClick={() => document.getElementById('add_admin_modal').showModal()}
                    className="btn btn-primary text-white min-h-[3rem] h-12 px-4 rounded-xl shadow-md shadow-indigo-200 whitespace-nowrap"
                  >
                      + New
                  </button>
            </div>
        </div>

        {/* --- GRID VIEW --- */}
        <div className={`grid grid-cols-1 gap-4 ${
            isDesktopSidebarOpen 
                ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" 
                : "md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
        }`}>
            <div 
               className={`hidden lg:flex group relative flex-col items-center justify-center border-2 border-dashed border-indigo-300 bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 cursor-pointer rounded-2xl shadow-md hover:shadow-xl hover:shadow-indigo-200/50 hover:-translate-y-2 h-full ${
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
                }`}>Add Member</h3>
                <p className="text-indigo-500/80 text-xs mt-1 text-center font-medium">Click to invite new admin</p>
            </div>

            {filteredEmails.map((item) => {
                const userRoles = item.roles && item.roles.length > 0 ? item.roles : (item.role ? [item.role] : ['member']);
                return (
                    <div key={item.admin_id} 
                        className={`relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center justify-center h-full hover:z-30 ${
                            isDesktopSidebarOpen ? "p-4" : "p-6"
                        }`}
                    >
                        {canDelete && (
                             <button 
                               onClick={() => handleDeleteEmail(item.admin_id)}
                               className="absolute top-2 right-2 hover:bg-red-50 rounded-full p-2 transition-colors z-10"
                               title="Remove user"
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

                        <div 
                          className="w-full px-1 cursor-pointer lg:cursor-default" 
                          onClick={() => handleEmailMobileClick(item.email)}
                        >
                          <div className="tooltip lg:tooltip-bottom w-full before:text-[10px]" data-tip={item.email}>
                            <h3 className={`font-bold text-slate-800 truncate whitespace-nowrap overflow-hidden ${
                                isDesktopSidebarOpen ? "text-[10px] mb-1" : "text-sm mb-2"
                            }`}>
                                {item.email}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="lg:hidden mt-2 w-full px-2 flex flex-wrap gap-2 justify-center items-center">
                            {userRoles.length > 0 && (
                                <span className="inline-block align-middle text-indigo-600 font-bold text-[10px] uppercase tracking-wider bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 truncate max-w-[80%]">
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
                                    className="btn btn-xs h-7 min-h-0 bg-white border border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 rounded-full px-3 text-[10px] font-bold tracking-wide uppercase shadow-sm shrink-0"
                                >
                                    +{userRoles.length - 1} more
                                </button>
                            )}
                        </div>

                        <div className="hidden lg:flex flex-nowrap gap-2 justify-center items-center mt-2 w-full px-1">
                            {userRoles.length > 0 && (
                                <span className={`inline-block font-bold uppercase tracking-wider bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 truncate ${
                                    isDesktopSidebarOpen 
                                        ? "text-[9px] px-2 py-0.5 max-w-[100px]" 
                                        : "text-[10px] px-3 py-1 max-w-[140px]" 
                                }`}>
                                    {userRoles[0].replace(/_/g, ' ')}
                                </span>
                            )}
                            {userRoles.length > 1 && (
                                <div className="tooltip tooltip-bottom z-50 flex-shrink-0 before:max-w-[12rem] before:whitespace-normal before:text-center before:content-[attr(data-tip)]" 
                                     data-tip={userRoles.slice(1).map(r => r.replace(/_/g, ' ')).join(', ')}>
                                    <span className={`cursor-help text-slate-500 font-bold tracking-wider bg-slate-100 rounded-full whitespace-nowrap border border-slate-200 hover:bg-slate-200 transition-colors flex-shrink-0 ${
                                        isDesktopSidebarOpen 
                                            ? "text-[9px] px-2 py-0.5" 
                                            : "text-[10px] px-2.5 py-1"
                                    }`}>
                                        +{userRoles.length - 1} more
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- MODALS (ADD, ROLE, MOBILE EMAIL) --- */}
      <dialog id="add_admin_modal" className="modal modal-bottom sm:modal-middle z-[999]">
          <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl text-slate-800">Add Member</h3>
                  <button onClick={() => document.getElementById('add_admin_modal').close()} className="btn btn-sm btn-circle btn-ghost text-slate-400 bg-slate-100 hover:bg-slate-200">
                      <X size={16} />
                  </button>
              </div>
              <form onSubmit={handleAddEmail} className="flex flex-col gap-4">
                  <div className="form-control">
                      <label className="label text-slate-700 font-bold">Email Address</label>
                      <label className="input input-bordered h-12 flex items-center gap-2 bg-slate-50 rounded-xl">
                          <Mail size={18} className="opacity-50" />
                          <input type="email" className="grow" placeholder="mail@site.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                      </label>
                  </div>
                  <div className="form-control">
                      <label className="label text-slate-700 font-bold">Assign Role</label>
                      <select className="select select-bordered bg-slate-50 rounded-xl" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                          <option value="editor_manage_email">Admin Email</option>
                          <option value="editor_manage_case">Admin Case</option>
                          <option value="editor_manage_menu">Admin Menu</option>
                          <option value="editor_manage_org">Admin ORG</option>
                      </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-full mt-4 h-12 rounded-xl text-white font-bold" disabled={isSubmitting}>
                          {isSubmitting ? <span className="loading loading-spinner"></span> : "Confirm"}
                  </button>
              </form>
          </div>
          <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
      </dialog>

      <dialog id="role_modal" className="modal modal-bottom sm:modal-middle z-[9999]">
          <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl text-center">
              <h3 className="font-bold text-lg text-slate-800 mb-4">All Roles</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                  {roleModalData && roleModalData.map((role, idx) => (
                      <span key={idx} className="text-indigo-600 font-bold text-xs uppercase tracking-wider bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                          {role.replace(/_/g, ' ')}
                      </span>
                  ))}
              </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
      </dialog>

      <dialog id="email_mobile_modal" className="modal modal-bottom sm:modal-middle z-[99999]">
          <div className="modal-box bg-white p-6 rounded-t-[2rem] sm:rounded-2xl text-center">
              <h3 className="font-bold text-lg text-slate-400 mb-2 uppercase tracking-widest text-xs">Email Address</h3>
              <p className="text-slate-800 font-bold text-xl break-all">{selectedEmailForMobile}</p>
              <div className="modal-action justify-center mt-6">
                  <form method="dialog">
                      <button className="btn btn-primary rounded-xl px-10 text-white font-bold h-12 shadow-lg shadow-indigo-100">ปิด</button>
                  </form>
              </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-slate-900/40 backdrop-blur-sm"><button>close</button></form>
      </dialog>
    </div>
  );
}