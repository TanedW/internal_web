"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation"; 
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; // ⚠️ ตรวจสอบ Path นี้ให้ถูกต้อง

// Components ย่อย
import EditorModal from "./components/EditorModal"; 
import CreateModal from "./components/CreateModal"; 
import FlexRender from "./components/FlexRender";   

// Icons
import { 
  Mail, Briefcase, LayoutGrid, Users, LogOut, 
  Search, Plus, Trash2, X, Menu, FileJson, Copy, Edit
} from "lucide-react";

// =====================================================================================
// 1. INLINE SIDEBAR COMPONENT
// =====================================================================================
const SidebarComponent = ({ 
  user, role, onLogout, 
  isMobileMenuOpen, setIsMobileMenuOpen, 
  isDesktopSidebarOpen, setIsDesktopSidebarOpen 
}) => {
  const pathname = usePathname();
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);

  // Helper
  const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed || 'User'}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  // Logic Role
  const currentRoles = Array.isArray(role) && role.length > 0 ? role : (role ? [String(role)] : ["MEMBER"]);
  const hasAccess = (reqRoles) => currentRoles.some(r => reqRoles.includes(r));
  
  const showCaseMenu = hasAccess(['admin', 'editor', 'editor_manage_case']);
  const showMenuMenu = hasAccess(['admin', 'editor', 'editor_manage_menu']);
  const showORGMenu = hasAccess(['admin', 'editor', 'editor_manage_org']);

  // 🔥🔥🔥 Function ตัวจัดการ Style ปุ่ม (แก้ไขให้ Highlight ตรงปก) 🔥🔥🔥
  const getMenuClass = (targetPath) => {
    // เช็คว่า Path ปัจจุบัน ตรงกับ Target หรือไม่ (หรือถ้าเป็นหน้าย่อยก็ให้ Active)
    const isActive = pathname === targetPath || pathname.startsWith(`${targetPath}/`);
    
    return `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-200 font-bold text-sm mb-1 ${
      isActive 
        ? "bg-[#111827] text-white shadow-lg shadow-slate-300 scale-[1.02]" // Active: สีดำเงา ตัวขาว
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"          // Inactive: เทา Hover แล้วพื้นจางๆ
    }`;
  };

  const SidebarContent = () => (
    <>
        <div className="flex flex-col items-center text-center mb-8 mt-6 px-4">
            <div className="w-24 h-24 rounded-full p-1 border-2 border-dashed border-indigo-200 mb-4">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 shadow-sm">
                    <img src={user?.photoURL || getAvatarUrl(user?.displayName)} alt="User" className="w-full h-full object-cover"/>
                </div>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 px-2 break-words w-full">{user?.displayName || "Guest"}</h2>
            
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
                {currentRoles.slice(0, isSidebarRolesExpanded ? undefined : 1).map((r, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 truncate max-w-[140px]">
                        {String(r).replace(/_/g, ' ')}
                    </span>
                ))}
            </div>
        </div>

        {/* --- MENU SECTION --- */}
        <div className="flex flex-col gap-1 w-full flex-1 overflow-y-auto px-3 pb-4">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 pl-4">Menu</div>
            
            {/* 🔴 แก้ไข Link ให้ตรงกับหน้าปัจจุบัน เพื่อให้ Active ทำงาน */}
            <Link href="/manage-flex-message" className={getMenuClass('/manage-flex-message')}>
                <FileJson size={20} /><span>Flex Messages</span>
            </Link>

            <Link href="/manage" className={getMenuClass('/manage')}>
                <Mail size={20} /><span>Manage Email</span>
            </Link>
            
            {showCaseMenu && (
                <Link href="/manage-case" className={getMenuClass('/manage-case')}>
                    <Briefcase size={20} /><span>Manage Case</span>
                </Link>
            )}
            {showMenuMenu && (
                <Link href="/manage-richmenu" className={getMenuClass('/manage-richmenu')}>
                    <LayoutGrid size={20} /><span>Manage Menu</span>
                </Link>
            )}
            {showORGMenu && (
                <Link href="/manage-org" className={getMenuClass('/manage-org')}>
                    <Users size={20} /><span>Manage ORG</span>
                </Link>
            )}
        </div>

        <div className="mt-auto pt-4 px-4 pb-4 border-t border-slate-100">
            <button onClick={onLogout} className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 w-full transition-all duration-200">
                <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/>
                <span className="font-bold text-sm">Sign Out</span>
            </button>
        </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-300 rounded-r-3xl">
                <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                <SidebarContent />
            </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className={`hidden lg:flex fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-100 flex-col z-50 transition-transform duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
          isDesktopSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
          <div className="px-4 py-4 flex justify-end">
             <button onClick={() => setIsDesktopSidebarOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors" title="Collapse Sidebar"><X size={18} /></button>
          </div>
          <SidebarContent />
      </aside>
    </>
  );
};

// =====================================================================================
// 2. MAIN PAGE COMPONENT
// =====================================================================================

const INITIAL_DATA = [
  { id: "1", name: "User Profile", description: "Basic user profile structure", content: { type: "bubble", body: { type: "box", layout: "vertical", contents: [] } }, updatedAt: new Date() },
  { id: "2", name: "Notification Alert", description: "System notification template", content: { type: "bubble", styles: { header: { backgroundColor: "#FF6B6B" } } }, updatedAt: new Date() },
];

export default function Home() {
  const router = useRouter();
  
  // Content States
  const [items, setItems] = useState(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sidebar & Auth States
  const [user, setUser] = useState(null);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  // --- Auth Logic ---
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("current_admin_id");
      if (!storedId) return null;
      try { return JSON.parse(storedId); } catch (e) { return storedId.replace(/^"|"$/g, ''); }
    }
    return null;
  };

  const fetchAdmins = async () => {
    if (!API_URL) return;
    const currentAdminId = getCurrentAdminId();
    try {
      const url = currentAdminId ? `${API_URL}?requester_id=${currentAdminId}` : API_URL;
      const res = await fetch(url);
      if (res.ok) {
        const jsonResponse = await res.json();
        const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);
        if (currentAdminId && data.length > 0) {
            const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
            if (myProfile) {
                setCurrentRoles(Array.isArray(myProfile.roles) ? myProfile.roles : (myProfile.role ? [myProfile.role] : []));
            }
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchAdmins();
        setLoading(false);
      } else {
        setLoading(false); 
      }
    });
    return () => unsubscribe();
  }, [router, API_URL]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_admin_id");
      router.push("/");
    } catch (e) { console.error(e); }
  };

  // --- Flex Content Logic ---
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleCreate = (name, desc, jsonStr) => {
    try {
      const newItem = { id: Date.now().toString(), name, description: desc, content: JSON.parse(jsonStr), updatedAt: new Date() };
      setItems([...items, newItem]);
    } catch (e) { alert("Invalid JSON"); }
  };
  const handleUpdate = (id, newJson, newDesc) => {
    try {
      const parsed = JSON.parse(newJson);
      setItems(items.map(item => item.id === id ? { ...item, content: parsed, description: newDesc } : item));
    } catch (e) { alert("Invalid JSON"); }
  };
  const handleDelete = (id) => setItems(items.filter(item => item.id !== id));

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* 1. Sidebar Component */}
      <SidebarComponent 
        user={user} role={currentRoles} onLogout={handleLogout} 
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
      />

      {/* 2. Main Content Area */}
      <main className={`flex-1 transition-all duration-300 min-h-screen flex flex-col ${
          isDesktopSidebarOpen ? "lg:pl-72" : "lg:pl-0"
      }`}>
        
        {/* Mobile Navbar */}
        <div className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg active:scale-95 transition-transform"><Menu size={20}/></button>
                <span className="font-bold text-lg text-slate-800">Flex Manager</span>
            </div>
        </div>

        {/* Desktop Toggle Button */}
        {!isDesktopSidebarOpen && (
            <button 
                onClick={() => setIsDesktopSidebarOpen(true)}
                className="hidden lg:flex fixed top-6 left-6 z-40 p-2.5 bg-white shadow-lg border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600 transition-all hover:scale-105"
                title="Expand Sidebar"
            >
                <Menu size={20} />
            </button>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 lg:p-10 max-w-[1920px] mx-auto w-full">
            
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-extrabold text-slate-900 tracking-tight">
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200"><FileJson size={24} /></div>
                        JSON Collection
                    </h1>
                    <p className="text-slate-500 mt-2 ml-1 text-sm font-medium">Manage and organize your Flex Message templates efficiently.</p>
                </div>

                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search templates..." 
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-medium text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        <Plus size={20} /> <span>Create New</span>
                    </button>
                </div>
            </header>

            {/* Grid Section */}
            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-[400px] overflow-hidden relative">
                            
                            {/* Preview Area */}
                            <div className="flex-1 bg-slate-50/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
                                <div className="scale-[0.7] origin-center opacity-90 group-hover:opacity-100 group-hover:scale-[0.75] transition-all duration-500 ease-out">
                                    <FlexRender json={item.content} />
                                </div>
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <button 
                                        onClick={() => setSelectedItem(item)} 
                                        className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 hover:bg-slate-50"
                                    >
                                        <Edit size={14} /> View Details
                                    </button>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="p-6 bg-white relative z-10 flex flex-col gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 truncate text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                                    <p className="text-xs text-slate-400 truncate mt-1 font-medium">{item.description || "No description provided"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(JSON.stringify(item.content)); alert('Copied JSON!'); }}
                                        className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-colors border border-slate-100"
                                    >
                                        <Copy size={14} /> Copy JSON
                                    </button>
                                    <button 
                                        onClick={() => setSelectedItem(item)}
                                        className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
                                    >
                                        <Edit size={14} /> Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="bg-white p-6 rounded-full shadow-sm border border-slate-100 mb-6">
                        <Search size={48} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No templates found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any templates matching your search. Try a different keyword or create a new one.</p>
                    <button onClick={() => {setSearchQuery(""); setIsCreateOpen(true);}} className="mt-6 text-indigo-600 font-bold hover:underline">Create New Template</button>
                </div>
            )}
        </div>
      </main>

      {/* --- Modals --- */}
      {selectedItem && (
        <EditorModal 
          item={selectedItem} 
          isOpen={!!selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onSave={handleUpdate} 
          onDelete={handleDelete} 
        />
      )}
      <CreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreate={handleCreate} 
      />
    </div>
  );
}