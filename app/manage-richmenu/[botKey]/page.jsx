'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import '@fortawesome/fontawesome-free/css/all.css';

export default function RichMenuDashboard() {
  const params = useParams();
  const router = useRouter();
  const botKey = params.botKey;

  const [user, setUser] = useState(null);
  const [bot, setBot] = useState(null);
  const [menus, setMenus] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [menuName, setMenuName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDisplay, setFileDisplay] = useState('');
  const [showAllMenus, setShowAllMenus] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchData();
      } else {
        router.push('/');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [botKey, router]);

  async function fetchData() {
    try {
      const botRes = await fetch(`/api/richmenu/bot?key=${botKey}`);
      const botData = await botRes.json();
      
      if (!botData || botData.error) {
        router.push('/manage-richmenu');
        return;
      }
      setBot(botData);

      const currentRes = await fetch(`/api/richmenu/current?botKey=${botKey}`);
      const currentData = await currentRes.json();
      setCurrentMenuId(currentData.currentMenuId || null);

      const listRes = await fetch(`/api/richmenu/list?botKey=${botKey}`);
      const listData = await listRes.json();

      if (listData.richmenus && Array.isArray(listData.richmenus)) {
        const sorted = [...listData.richmenus].sort((a, b) => {
          if (a.richMenuId === currentData.currentMenuId) return -1;
          if (b.richMenuId === currentData.currentMenuId) return 1;
          return 0;
        });
        setMenus(sorted);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlert({ type: 'error', message: 'ไม่สามารถดึงข้อมูลได้' });
    }
  }

  function setupDragDrop() {
    const zone = dropZoneRef.current;
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');

      const files = e.dataTransfer?.files;
      if (files?.length) {
        const file = files[0];
        if (file.type.includes('image')) {
          setSelectedFile(file);
          setFileDisplay(`เลือกไฟล์: ${file.name}`);
        }
      }
    });
  }

  useEffect(() => {
    setupDragDrop();
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileDisplay(`เลือกไฟล์: ${file.name}`);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();

    if (!selectedFile) {
      setAlert({ type: 'error', message: 'กรุณาเลือกรูปภาพ' });
      return;
    }

    if (selectedFile.size > 1000000) {
      setAlert({ type: 'error', message: 'ไฟล์มีขนาดใหญ่เกิน 1MB' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('botKey', botKey);
      formData.append('menuName', menuName || `Traffy_${botKey}_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')}`);
      formData.append('menuImage', selectedFile);

      const response = await fetch('/api/richmenu/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const displayName = menuName || `Traffy_${botKey}`;
        setAlert({ type: 'success', message: `สร้างเมนู "${displayName}" สำเร็จ` });
        setMenuName('');
        setSelectedFile(null);
        setFileDisplay('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        await new Promise((resolve) => setTimeout(resolve, 1000));
        fetchData();
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถอัปโหลดเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + error.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleSwitch(menuId) {
    if (!confirm('ต้องการเปลี่ยนไปใช้เมนูนี้หรือไม่?')) return;

    try {
      const response = await fetch('/api/richmenu/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'เปลี่ยนเมนูสำเร็จ' });
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchData();
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถเปลี่ยนเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' });
    }
  }

  async function handleDelete(menuId) {
    if (!confirm('ยืนยันการลบเมนูนี้อย่างถาวร?')) return;

    try {
      const response = await fetch('/api/richmenu/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botKey, menuId }),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'ลบเมนูเรียบร้อยแล้ว' });
        await new Promise((resolve) => setTimeout(resolve, 500));
        fetchData();
      } else {
        setAlert({ type: 'error', message: 'ไม่สามารถลบเมนูได้' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'เกิดข้อผิดพลาด' });
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('current_admin_id');
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  const visibleMenus = showAllMenus ? menus : menus.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-100 font-sans" style={{ fontFamily: "'Sarabun', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');
        
        body { font-family: 'Sarabun', sans-serif; }
        
        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          animation: slideDown 0.3s ease-out;
        }
        .alert-success {
          background: #E8F5E9;
          color: #1B5E20;
          border: 1px solid #C8E6C9;
        }
        .alert-error {
          background: #FFEBEE;
          color: #B71C1C;
          border: 1px solid #FFCDD2;
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .dragover {
          background: #f0fdf4;
          border-color: #22c55e !important;
        }

        .menu-item.active {
          border: 1px solid #06C755;
          box-shadow: 0 0 0 1px #06C755;
        }
      `}</style>

      {/* CONTENT */}
      <div className="mt-16 lg:mt-0 pt-6 pb-24 lg:pb-10">
        <div className="max-w-3xl w-full mx-auto px-4">
          
          {/* Navigation Bar */}
          <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-lg shadow-sm">
            <Link href="/manage-richmenu" className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center gap-2">
              <i className="fa-solid fa-arrow-left"></i> กลับหน้าเลือกบอท
            </Link>
            {bot && <div className="text-xs font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full">
              กำลังจัดการ: {bot.name}
            </div>}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Traffy Rich Menu Manager</h1>
            <p className="text-slate-500 text-sm">ระบบจัดการเมนู LINE Official Account</p>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`alert mb-6 ${alert.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              <i className={`fa-solid ${alert.type === 'success' ? 'fa-check' : 'fa-exclamation-circle'}`}></i>
              <span>{alert.message}</span>
            </div>
          )}

          {/* Upload Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-200">
              สร้างเมนูใหม่ (Upload New)
            </h2>

            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ชื่อเมนู (Menu Name)
                </label>
                <input
                  type="text"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="ตั้งชื่อเมนู เช่น: เมนูหลัก 2024"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  disabled={uploading}
                />
              </div>

              <div
                ref={dropZoneRef}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg"
                  className="hidden"
                  disabled={uploading}
                />
                <label htmlFor="fileInput" className="cursor-pointer block">
                  <div className="text-4xl mb-3">
                    <i className="fa-regular fa-image text-slate-300"></i>
                  </div>
                  <span className="block text-slate-700 font-medium text-sm">
                    แตะเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง
                  </span>
                  <div className="text-xs text-slate-500 mt-2">
                    รองรับไฟล์ .jpg ขนาด 2500×843 px (Max 1MB)
                  </div>
                  {fileDisplay && (
                    <div className="text-xs text-green-600 font-medium mt-3">
                      ✓ {fileDisplay}
                    </div>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-upload"></i>
                {uploading ? '⏳ กำลังอัปโหลด...' : '📤 อัปโหลด'}
              </button>
            </form>
          </div>

          {/* Menu List Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-200">
              ประวัติเมนู (History)
            </h2>

            {menus.length > 0 ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleMenus.map((menu) => {
                    const isCurrent = menu.richMenuId === currentMenuId;
                    return (
                      <div
                        key={menu.richMenuId}
                        className={`menu-item p-4 rounded-lg border transition-all ${
                          isCurrent ? 'active bg-white' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 text-sm">{menu.name}</h3>
                            <p className="text-xs text-slate-600 mt-1">{menu.chatBarText}</p>
                            <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded mt-2 font-mono break-all w-fit">
                              {menu.richMenuId}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                            isCurrent ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isCurrent ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {!isCurrent ? (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
                            <button
                              onClick={() => handleSwitch(menu.richMenuId)}
                              className="flex-1 bg-white hover:bg-green-50 text-green-600 border border-green-200 py-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                            >
                              <i className="fa-solid fa-sync"></i> ใช้เมนูนี้
                            </button>
                            <button
                              onClick={() => handleDelete(menu.richMenuId)}
                              className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 py-2 rounded text-xs font-medium flex items-center justify-center gap-1"
                            >
                              <i className="fa-solid fa-trash"></i> ลบ
                            </button>
                          </div>
                        ) : (
                          <button disabled className="w-full bg-green-100 text-green-600 py-2 rounded text-xs font-medium mt-3 pt-3 border-t border-slate-200 flex items-center justify-center gap-1">
                            <i className="fa-solid fa-check"></i> ใช้งานอยู่
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {menus.length > 6 && !showAllMenus && (
                  <button
                    onClick={() => setShowAllMenus(true)}
                    className="w-full mt-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 font-medium text-sm rounded-lg hover:bg-slate-50 transition"
                  >
                    ดูเพิ่มเติม (อีก {menus.length - 6} รายการ) ▼
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <i className="fa-regular fa-image text-4xl text-slate-300 mb-3 block"></i>
                <p className="text-slate-500 text-sm">ไม่พบประวัติเมนูในระบบ</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}