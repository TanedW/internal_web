"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    Trash2, Plus, Send, Loader2, Database, MessageSquare, 
    Upload, FileText, X, Bot, CheckCircle, AlertCircle, AlertTriangle, Check
} from 'lucide-react';
import Sidebar from "../components/sidebar"; 

const API_URL = process.env.NEXT_PUBLIC_MANAGE_FILE_SEARCH_API_URL || ""; 

export default function ManageFileSearchPage() {
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

    // --- Data States ---
    const [stores, setStores] = useState([]);
    const [documents, setDocuments] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [activeStoreId, setActiveStoreId] = useState(null);
    const [userInfo, setUserInfo] = useState({ email: '', name: '', adminId: '' });

    // --- Modals States (Original) ---
    const [chatModalOpen, setChatModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [currentStore, setCurrentStore] = useState(null);

    // --- 🟢 NEW: Custom UI States (Alert & Confirm) ---
    const [statusModal, setStatusModal] = useState({ 
        isOpen: false, type: 'success', title: '', message: '' 
    });

    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, title: '', message: '', onConfirm: null, isDestructive: false, isLoading: false 
    });

    // --- Forms & Inputs ---
    const [newStoreName, setNewStoreName] = useState('');
    const [newStoreDesc, setNewStoreDesc] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // --- Chat ---
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isChatTyping, setIsChatTyping] = useState(false);
    const chatEndRef = useRef(null);

    // --- Upload ---
    const fileInputRef = useRef(null);

    // --- Helper Functions for UI ---
    const showStatus = (title, message, type = 'success') => {
        setStatusModal({ isOpen: true, title, message, type });
    };

    const closeStatusModal = () => {
        setStatusModal(prev => ({ ...prev, isOpen: false }));
    };

    const triggerConfirm = (title, message, onConfirm, isDestructive = false) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, isDestructive, isLoading: false });
    };

    const closeConfirmModal = () => {
        if (confirmModal.isLoading) return; 
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirmAction = async () => {
        if (confirmModal.onConfirm) {
            setConfirmModal(prev => ({ ...prev, isLoading: true })); 
            try {
                await confirmModal.onConfirm(); 
            } catch (error) {
                console.error(error);
            } finally {
                setConfirmModal(prev => ({ ...prev, isLoading: false, isOpen: false })); 
            }
        } else {
            closeConfirmModal();
        }
    };

    // --- Data Fetching ---
    const fetchStores = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/stores`);
            const data = await res.json();
            setStores(data);
            const active = data.find(s => s.is_active);
            if(active) setActiveStoreId(active.id);
        } catch (err) {
            console.error("Failed to load stores", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async (targetStoreName) => {
        if (!targetStoreName) return;
        try {
            const res = await fetch(`${API_URL}/stores/docs?store=${targetStoreName}`);
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching docs:", error);
            setDocuments([]);
        }
    };

    useEffect(() => { 
        fetchStores();
        setUserInfo({
            email: localStorage.getItem("user_email") || 'Unknown',
            name: localStorage.getItem("user_name") || 'Unknown',
            adminId: localStorage.getItem("current_admin_id")?.replace(/^"|"$/g, "") || 'System'
        });
    }, []);

    const getAuditInfo = () => {
        return {
            email: localStorage.getItem("user_email") || 'Unknown',
            name: localStorage.getItem("user_name") || localStorage.getItem("first_name") || 'Unknown',
            adminId: localStorage.getItem("current_admin_id") || localStorage.getItem("admin_id") || 'System'
        };
    };
    // --- Handlers ---
    const handleSelectStore = (store) => {
        if (store.id === activeStoreId) return;

        triggerConfirm(
            "ยืนยันการเปลี่ยน Store",
            `คุณต้องการเปลี่ยนไปใช้ "${store.display_name}" หรือไม่?`,
            async () => {
                try {
                    await fetch(`${API_URL}/stores/activate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            storeName: store.store_name,
                            auditInfo: getAuditInfo()
                        })
                    });
                    setActiveStoreId(store.id);
                    showStatus("สำเร็จ", `เปิดใช้งาน "${store.display_name}" เรียบร้อย`, "success");
                    fetchStores(); 
                } catch (err) {
                    showStatus("ผิดพลาด", "ไม่สามารถเปลี่ยน Store ได้", "error");
                }
            }
        );
    };

    const handleCreateStore = async () => {
        if (!newStoreName.trim()) return;
        setIsAdding(true);
        try {
            await fetch(`${API_URL}/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    displayName: newStoreName,
                    description: newStoreDesc || 'ไม่มีรายละเอียด',
                    auditInfo: getAuditInfo() // 🟢 แนบ Object ไปที่นี่
                })
            });
            setNewStoreName('');
            setNewStoreDesc('');
            fetchStores();
            showStatus("สร้างสำเร็จ", "เพิ่ม Store ใหม่เรียบร้อยแล้ว", "success");
        } catch (err) {
            showStatus("สร้างไม่สำเร็จ", "เกิดข้อผิดพลาดในการสร้าง Store", "error");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteStore = async (e, store) => {
        e.stopPropagation();

        // 🟢 1. เช็คว่าเป็น Store ที่กำลัง Active อยู่หรือไม่ ถ้าใช่ให้บล็อกการลบทันที
        if (store.id === activeStoreId) {
            showStatus(
                "ไม่สามารถลบได้", 
                `Store "${store.display_name}" กำลังถูกเปิดใช้งานอยู่ (Active) กรุณาเปลี่ยนไปใช้งาน Store อื่นก่อนทำการลบ`, 
                "error"
            );
            return;
        }

        triggerConfirm(
            "ยืนยันการลบ Store",
            `ข้อมูลของ "${store.display_name}" จะหายถาวร ยืนยันที่จะลบหรือไม่?`,
            async () => {
                try {
                    // 📍 1. รับค่า Response และแก้ id เป็น store.id
                    const res = await fetch(`${API_URL}/stores/${store.id}`, { 
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ auditInfo: getAuditInfo() })
                    });
                    
                    // 📍 2. ถอดรหัสไฟล์ JSON ที่ Backend ส่งกลับมา เพื่อเอาข้อความ Error
                    const data = await res.json();

                    // 📍 3. ถ้า Backend ส่งสถานะว่ามีปัญหา (เช่น ติดไฟล์อยู่) ให้โยนข้อความไปเข้า catch
                    if (!res.ok) {
                        throw new Error(data.details || data.error || "เกิดข้อผิดพลาดในการลบ Store");
                    }

                    fetchStores();
                    showStatus("ลบสำเร็จ", "ลบ Store เรียบร้อยแล้ว", "success");
                } catch (err) {
                    // 📍 4. โชว์ข้อความที่ดึงมาจาก Backend ตรงนี้
                    showStatus("ลบไม่สำเร็จ", err.message, "error");
                }
            },
            true 
        );
    };

    const handleDeleteDocument = async (docName) => {
        triggerConfirm(
            "ลบไฟล์",
            `ต้องการลบไฟล์ "${docName}" ใช่หรือไม่?`,
            async () => {
                try {
                    await fetch(`${API_URL}/documents`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            docName, 
                            auditInfo: getAuditInfo() // 🟢 แนบ Object ไปที่นี่
                        })
                    });
                    if (currentStore) fetchDocuments(currentStore.store_name);
                    showStatus("สำเร็จ", "ลบไฟล์เรียบร้อยแล้ว", "success");
                } catch (err) {
                    showStatus("ผิดพลาด", "ลบไฟล์ไม่สำเร็จ", "error");
                }
            },
            true
        );
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentStore) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('storeName', currentStore.store_name);
        formData.append('displayName', file.name);
        formData.append('auditInfo', JSON.stringify(getAuditInfo()));

        // console.log("📤 [Frontend] ข้อมูลการอัปโหลดที่จะส่งไป:", Object.fromEntries(formData));

        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error("Upload Error");
            
            fetchDocuments(currentStore.store_name);
            showStatus("อัปโหลดสำเร็จ", "นำไฟล์เข้าสู่ระบบเรียบร้อย", "success");
        } catch (err) {
            showStatus("อัปโหลดล้มเหลว", err.message, "error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleOpenChat = (e, store) => {
        e.stopPropagation();
        setCurrentStore(store);
        setMessages([{ role: 'model', text: `พร้อมตอบคำถามจาก "${store.display_name}" แล้วครับ` }]);
        setChatModalOpen(true);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const text = inputMessage;
        setMessages(prev => [...prev, { role: 'user', text }]);
        setInputMessage('');
        setIsChatTyping(true);

        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    storeName: currentStore.store_name,
                    message: text 
                })
            });
            const data = await res.json();
            setMessages(prev => [...prev, { role: 'model', text: data.text }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', text: "Error connection" }]);
        } finally {
            setIsChatTyping(false);
        }
    };

    const handleOpenDetails = (store) => {
        setCurrentStore(store);
        fetchDocuments(store.store_name);
        setDetailsModalOpen(true);
    };

    const handleQuickUploadClick = (e, store) => {
        e.stopPropagation();
        setCurrentStore(store);
        fetchDocuments(store.store_name); 
        setDetailsModalOpen(true);
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatTyping]);

    return (
        <div className="min-h-screen bg-[#F4F6F8] font-sans relative">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />

            {statusModal.isOpen && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[scale-in_0.2s_ease-out] text-center p-8">
                        <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${statusModal.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                            {statusModal.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{statusModal.title}</h3>
                        <p className="text-slate-500 mb-6">{statusModal.message}</p>
                        <button onClick={closeStatusModal} className={`btn w-full rounded-full border-none text-white text-lg ${statusModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-800 hover:bg-slate-900'}`}>
                            ตกลง
                        </button>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[scale-in_0.2s_ease-out]">
                        <div className="p-6 text-center">
                            <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.isDestructive ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {confirmModal.isDestructive ? <AlertTriangle size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                            <p className="text-slate-500 mb-6 leading-relaxed">{confirmModal.message}</p>
                            
                            <div className="flex gap-3 justify-center">
                                <button onClick={closeConfirmModal} disabled={confirmModal.isLoading} className="btn btn-ghost text-slate-500 hover:bg-slate-100 flex-1">
                                    ยกเลิก
                                </button>
                                <button onClick={handleConfirmAction} disabled={confirmModal.isLoading} className={`btn flex-1 text-white border-none relative ${confirmModal.isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                    {confirmModal.isLoading ? (
                                        <><span className="opacity-0">ยืนยัน</span><div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin w-5 h-5"/></div></>
                                    ) : (
                                        confirmModal.isDestructive ? 'ยืนยันการลบ' : 'ยืนยัน'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar isDesktopSidebarOpen={isDesktopSidebarOpen} setIsDesktopSidebarOpen={setIsDesktopSidebarOpen} />

            {/* <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-80" : "lg:pl-8"}`}> */}
            <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:pl-72" : "lg:pl-24"}`}>
            {/* <div className={`container mx-auto px-4 lg:px-8 pt-20 lg:pt-8 max-w-7xl transition-all duration-300 pb-24 ${isDesktopSidebarOpen ? "lg:ml-[19rem]" : "lg:ml-8"}`}> */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">จัดการฐานข้อมูล (File Search)</h1>
                        <p className="text-slate-400 mt-1 font-medium">เชื่อมต่อ Database & Google Gemini (Real System)</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
                    
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-600"/>
                            Stores ทั้งหมด ({stores.length})
                        </h2>

                        <div className="flex gap-2 w-full max-w-2xl">
                            <input 
                                type="text" 
                                placeholder="ชื่อ Store..." 
                                className="input input-bordered w-1/3 h-10 bg-white text-sm"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="รายละเอียด..." 
                                className="input input-bordered w-full h-10 bg-white text-sm"
                                value={newStoreDesc}
                                onChange={(e) => setNewStoreDesc(e.target.value)}
                            />
                            <button onClick={handleCreateStore} disabled={isAdding || !newStoreName} className="btn bg-slate-800 hover:bg-slate-900 text-white border-none h-10 min-h-0 px-4 shrink-0">
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} สร้าง
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead className="bg-white text-slate-500 text-sm font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="w-20 text-center">สถานะ</th>
                                    <th className="w-1/4 pl-6">ชื่อ Store</th>
                                    <th className="w-1/3">รายละเอียด</th>
                                    <th className="text-center w-24">ทดสอบ</th>
                                    <th className="text-right pr-8">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center py-10">กำลังโหลดข้อมูล...</td></tr>
                                ) : stores.map((store) => {
                                    // 🟢 คำนวณ Active ตรงนี้
                                    const isActive = activeStoreId === store.id;
                                    return (
                                        <tr key={store.id} className={`transition-colors border-b border-slate-50 last:border-none ${isActive ? 'bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                                            
                                            <td className="text-center align-middle">
                                                <div className="flex justify-center items-center h-full">
                                                    {isActive ? (
                                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                                    ) : (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleSelectStore(store); }}
                                                            className="w-6 h-6 rounded-full bg-slate-200 hover:bg-indigo-400 hover:scale-110 transition-all duration-200 shadow-inner"
                                                        ></button>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="pl-6 py-4 cursor-pointer group" onClick={() => handleOpenDetails(store)}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-base ${isActive ? 'text-indigo-800' : 'text-slate-700'}`}>
                                                        {store.display_name}
                                                    </span>
                                                    {isActive && (
                                                        <span className="badge badge-sm border-none bg-green-100 text-green-700 font-semibold px-2">Active</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-1">{store.store_name}</div>
                                            </td>

                                            <td className="text-slate-500 text-sm cursor-pointer" onClick={() => handleOpenDetails(store)}>
                                                {store.description}
                                            </td>

                                            <td className="text-center">
                                                <button onClick={(e) => handleOpenChat(e, store)} className="btn btn-circle btn-sm bg-white border border-slate-200 text-slate-500 hover:bg-indigo-600 hover:text-white shadow-sm">
                                                    <MessageSquare size={16} />
                                                </button>
                                            </td>

                                            <td className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={(e) => handleQuickUploadClick(e, store)} className="btn btn-sm h-9 px-3 bg-white border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 shadow-sm">
                                                        <Upload size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleDeleteStore(e, store)} className="btn btn-sm h-9 px-3 bg-white border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 shadow-sm">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {chatModalOpen && currentStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[scale-in_0.2s_ease-out]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold flex gap-2"><Bot/> {currentStore.display_name}</h3>
                            <button onClick={() => setChatModalOpen(false)}><X/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`chat ${m.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                                    <div className={`chat-bubble text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-black border'}`}>{m.text}</div>
                                </div>
                            ))}
                            {isChatTyping && <span className="loading loading-dots loading-xs ml-4"></span>}
                            <div ref={chatEndRef}/>
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
                            <div className="flex gap-2">
                                <input className="input input-bordered w-full rounded-full" value={inputMessage} onChange={e=>setInputMessage(e.target.value)} autoFocus placeholder="ถามอะไรก็ได้..." />
                                <button type="submit" className="btn btn-circle bg-indigo-600 text-white"><Send size={18}/></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {detailsModalOpen && currentStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-[scale-in_0.2s_ease-out]">
                        <div className="bg-slate-800 p-6 text-white relative">
                            <button onClick={() => setDetailsModalOpen(false)} className="absolute top-4 right-4"><X/></button>
                            <h2 className="text-2xl font-bold">{currentStore.display_name}</h2>
                            <p className="opacity-60 font-mono text-sm">{currentStore.store_name}</p>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 bg-slate-50 p-3 rounded-lg border text-slate-600 text-sm">
                                {currentStore.description}
                            </div>
                            <h4 className="font-bold mb-2">เอกสาร ({documents.length})</h4>
                            <div className="max-h-[250px] overflow-y-auto border rounded-xl bg-white mb-4">
                                {documents.length === 0 ? <p className="p-4 text-center text-slate-400">ว่างเปล่า</p> : 
                                    <table className="table w-full">
                                        <tbody>
                                            {(Array.isArray(documents) ? documents : []).map((doc, idx) => (
                                                <tr key={idx} className="border-b last:border-none">
                                                    <td className="w-8 text-center"><FileText size={16} className="text-slate-400"/></td>
                                                    <td>{doc.displayName}</td>
                                                    <td className="text-right"><button onClick={() => handleDeleteDocument(doc.name)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                }
                            </div>
                            <div className="flex justify-end gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} accept=".pdf,.txt,.md,.csv" />
                                <button onClick={triggerFileUpload} disabled={isUploading} className="btn bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {isUploading ? <Loader2 className="animate-spin"/> : <Upload size={16}/>} อัปโหลดไฟล์
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}