"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
// Link และ usePathname ย้ายไปอยู่ที่ Sidebar แล้ว ไม่ต้อง import ที่นี่
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig"; 

// Components
import EditorModal from "./components/EditorModal"; 
import CreateModal from "./components/CreateModal"; 
import FlexRender from "./components/FlexRender";
import SidebarComponent from "../components/sidebar"; 

// Icons (เหลือเฉพาะที่ใช้ในหน้า Dashboard)
import { 
  Search, Plus, Trash2, Menu, FileJson, Copy, Edit
} from "lucide-react";

// =====================================================================================
// MAIN PAGE COMPONENT
// =====================================================================================

const INITIAL_DATA = [
  {
    id: "1",
    name: "Welcome Card",
    description: "Standard welcome message",
    content: { "type": "bubble", "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Hello World" }] } },
    updatedAt: new Date(),
  },
];
 

export default function Home() {
  const router = useRouter();
  
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State สำหรับควบคุม Sidebar (ส่ง Props ไปให้ SidebarComponent)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;
  const FLEX_API_URL = process.env.NEXT_PUBLIC_DB_MANAGE_FLEX_MESSAGE_API_URL;

  // --- Auth Logic ---
  const getCurrentAdminId = () => {
    if (typeof window !== "undefined") {
        const storedId = localStorage.getItem("current_admin_id");
        if (!storedId) return null;
        try { return JSON.parse(storedId); } catch (e) { return storedId.replace(/^"|"$/g, ''); }
    }
    return null;
  };

  // const fetchAdmins = async () => {
  //   if (!API_URL) return;
  //   const currentAdminId = getCurrentAdminId();
  //   try {
  //     const url = currentAdminId ? `${API_URL}?requester_id=${currentAdminId}` : API_URL;
  //     const res = await fetch(url);
  //     if (res.ok) {
  //       const jsonResponse = await res.json();
  //       const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);
  //       if (currentAdminId && data.length > 0) {
  //           const myProfile = data.find(u => String(u.admin_id) === String(currentAdminId));
  //           if (myProfile) {
  //               setCurrentRoles(Array.isArray(myProfile.roles) ? myProfile.roles : (myProfile.role ? [myProfile.role] : []));
  //           }
  //       }
  //     }
  //   } catch (e) { console.error(e); }
  // };

  // 2. ฟังก์ชันสำหรับดึงข้อมูลจาก Database (GET)
const fetchFlexMessages = async () => {
  try {
    const res = await fetch(FLEX_API_URL);
    const json = await res.json();
    if (json.success) {
      const transformedData = json.data.map(item => {
        // 1. ดึง Flex Data ออกมาเป็น Object
        let combinedContent = typeof item.flex_data === 'string' 
          ? JSON.parse(item.flex_data) 
          : { ...item.flex_data };

        // 2. ถ้าใน DB มี quick_reply ให้เอาไปใส่ใน Key "quickReply"
        if (item.quick_reply) {
          const qr = typeof item.quick_reply === 'string' 
            ? JSON.parse(item.quick_reply) 
            : item.quick_reply;
          
          combinedContent.quickReply = qr;
        }

        return {
          id: item.id,
          name: item.flex_name,
          description: item.comment,
          content: combinedContent, // ตอนนี้จะมี Quick Reply ต่อท้ายแล้ว
          updatedAt: item.updated_on,
          rawQuickReply: item.quick_reply // เก็บค่าดิบไว้ใช้ตอนเซฟ
        };
      });
      setItems(transformedData);
    }
  } catch (e) {
    console.error("Fetch Error:", e);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // fetchAdmins();
        fetchFlexMessages(); 
      }
      setLoading(false);
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

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
// page.jsx

const handleCreate = async (name, desc, jsonStr, quickReplyStr) => {
  const currentAdminId = getCurrentAdminId();
  
  try {
// 1. ตรวจสอบและเตรียม Flex Data หลัก
    let flexData;
    try {
      flexData = JSON.parse(jsonStr);
    } catch (e) {
      alert("JSON Content รูปแบบไม่ถูกต้อง");
      return;
    }

    // 2. ตรวจสอบ Quick Reply (ถ้ามีการกรอกมา)
    let qrData = null;
    if (quickReplyStr && quickReplyStr.trim() !== "") {
      try {
        qrData = JSON.parse(quickReplyStr);
      } catch (e) {
        alert("Quick Reply JSON รูปแบบไม่ถูกต้อง");
        return;
      }
    }

    // 3. ยิง API โดยส่งแยก field ตามที่ manage_flex_message.js รอรับ
    const res = await fetch(FLEX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_admin_id: currentAdminId,
        flex_name: name,
        flex_data: JSON.stringify(flexData), // ส่งเฉพาะตัว Flex
        quick_reply: qrData ? JSON.stringify(qrData) : null, // ส่ง Quick Reply แยกไป (ถ้ามี)
        comment: desc
      })
    });

    if (res.ok) {
      alert("สร้างเทมเพลตสำเร็จ");
      await fetchFlexMessages(); 
      setIsCreateOpen(false);
    } else {
      const err = await res.json();
      alert(`สร้างไม่สำเร็จ: ${err.message || err.error}`);
    }
  } catch (e) {
    console.error("Create Error:", e);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
  }
};

        const handleUpdate = async (id, newJsonStr, newName, newDesc, changeNote) => {
        const currentAdminId = getCurrentAdminId();
        const oldItem = items.find(i => i.id === id);

        try {
            const fullJson = JSON.parse(newJsonStr);
    
            // --- จุดสำคัญ: แยก Quick Reply ออกจาก Flex Data ---
            // เราจะดึง Property 'quickReply' ออกมา (ถ้ามี) 
            // และส่วนที่เหลือทั้งหมดจะกลายเป็น Flex Data หลัก
            const { quickReply, ...flexDataOnly } = fullJson;
            const res = await fetch(`${FLEX_API_URL}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_admin_id: currentAdminId,
                flex_name: newName,
                flex_data: JSON.stringify(flexDataOnly),
                quick_reply: quickReply ? JSON.stringify(quickReply) : null,
                comment: newDesc,
                description: changeNote, // บันทึกลง Log ว่าแก้จุดไหน
                old_flex: JSON.stringify(oldItem.content),
                new_flex: newJsonStr
            })
            });

            if (res.ok) {
            alert("บันทึกการแก้ไขเรียบร้อย");
            await fetchFlexMessages(); // Refresh ข้อมูล
            setSelectedItem(null); 
            } else {
            const err = await res.json();
            alert(`แก้ไขไม่สำเร็จ: ${err.message}`);
            }
        } catch (e) {
            console.error("Update Error:", e);
            alert("เกิดข้อผิดพลาดในการบันทึก");
        }
        };
  
// แก้ไขฟังก์ชัน handleDelete ใน Home Component
const handleDelete = async (id) => {
  const currentAdminId = getCurrentAdminId();
  
  if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเทมเพลตนี้?")) return;

  try {
    const res = await fetch(`${FLEX_API_URL}?id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_admin_id: currentAdminId
      })
    });

    if (res.ok) {
      alert("ลบข้อมูลเรียบร้อยแล้ว");
      // อัปเดต UI โดยการดึงข้อมูลใหม่หรือกรองตัวที่ลบออก
      setItems(items.filter(item => item.id !== id));
    } else {
      const err = await res.json();
      alert(`ลบไม่สำเร็จ: ${err.message}`);
    }
  } catch (e) {
    console.error("Delete Error:", e);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
  }
};

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-gray-50"><span className="loading loading-spinner text-primary"></span></div>;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* 1. เรียกใช้ SidebarComponent ที่ Import มา */}
      <SidebarComponent 
        user={user} 
        role={currentRoles} 
        onLogout={handleLogout} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDesktopSidebarOpen={isDesktopSidebarOpen} 
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
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
            <button onClick={() => setIsCreateOpen(true)} className="p-2 bg-slate-900 text-white rounded-lg shadow-md active:scale-95 transition-transform"><Plus size={20}/></button>
        </div>

        {/* Desktop Toggle Button */}
        {!isDesktopSidebarOpen && (
            <button onClick={() => setIsDesktopSidebarOpen(true)} className="hidden lg:flex fixed top-6 left-6 z-40 p-2.5 bg-white shadow-lg border border-slate-100 rounded-xl hover:bg-slate-50 text-slate-600 transition-all hover:scale-105"><Menu size={20} /></button>
        )}

        <div className="flex-1 p-4 md:p-6 lg:p-10 max-w-[1920px] mx-auto w-full">
            
            {/* Header Section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4 md:gap-6">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                        <div className="p-2 md:p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200"><FileJson size={20} className="md:w-6 md:h-6" /></div>
                        JSON Collection
                    </h1>
                    <p className="text-slate-500 mt-2 ml-1 text-xs md:text-sm font-medium">Manage and organize your Flex Message templates efficiently.</p>
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
                        className="hidden md:flex bg-slate-900 text-white px-6 py-3 rounded-xl font-bold items-center justify-center gap-2 shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        <Plus size={20} /> <span>Create New</span>
                    </button>
                </div>
            </header>

            {/* Grid Section */}
            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-[380px] md:h-[400px] overflow-hidden relative">
                            <div className="flex-1 bg-slate-50/50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
                                <div className="scale-[0.6] md:scale-[0.7] origin-center opacity-90 group-hover:opacity-100 group-hover:scale-[0.65] md:group-hover:scale-[0.75] transition-all duration-500 ease-out">
                                    <FlexRender json={item.content} />
                                </div>
                                
                                <button onClick={() => setSelectedItem(item)} className="absolute inset-0 z-10 md:hidden active:bg-black/5" aria-label="Edit Template"></button>

                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex items-center justify-center backdrop-blur-[2px]">
                                    <button 
                                        onClick={() => setSelectedItem(item)} 
                                        className="bg-white text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold shadow-2xl flex items-center gap-2 hover:bg-slate-50"
                                    >
                                        <Edit size={14} /> View Details
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 bg-white relative z-20 flex flex-col gap-3 md:gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 truncate text-base md:text-lg tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                                    <p className="text-xs text-slate-400 truncate mt-1 font-medium">{item.description || "No description provided"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(JSON.stringify(item.content)); alert('Copied JSON!'); }}
                                        className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 md:py-2.5 rounded-xl text-xs font-bold transition-colors border border-slate-100"
                                    >
                                        <Copy size={14} /> <span className="hidden sm:inline">Copy JSON</span><span className="sm:hidden">Copy</span>
                                    </button>
                                    <button 
                                        onClick={() => setSelectedItem(item)}
                                        className="flex items-center justify-center gap-2 bg-slate-900 text-white py-2 md:py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
                                    >
                                        <Edit size={14} /> Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center">
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
          onDelete={(id) => {
             handleDelete(id);
             setSelectedItem(null);
          }}       
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