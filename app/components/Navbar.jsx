// components/Navbar.jsx
'use client'; 

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [selectedDate, setSelectedDate] = useState("");  

  useEffect(() => {
    import("cally");
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    // เพิ่ม: ซ่อน popover เมื่อเลือกวันที่เสร็จ (Optional: ถ้าต้องการให้ปิดอัตโนมัติ)
    // document.getElementById("cally-popover1").hidePopover(); 
  };

  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-50">
      
      {/* --- ส่วนปุ่มเลือกวันที่ --- */}
      <div className="flex justify-center bg-gray-50 p-3">
        
        {/* 1. แก้ style เป็น object {{ ... }} และใช้ camelCase */}
        {/* 2. เปลี่ยน class input ของ daisyUI เป็น Tailwind ธรรมดา เพื่อความชัวร์ */}
        <button 
          popoverTarget="cally-popover1" 
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
          id="cally1" 
          style={{ anchorName: "--cally1" }} 
        >
           📅 {selectedDate || "เลือกวันที่"}
        </button>

        {/* --- ส่วน Popover --- */}
        <div 
          popover="auto" 
          id="cally-popover1" 
          className="p-0 border-none shadow-xl rounded-lg mt-2" 
          style={{ positionAnchor: "--cally1" }}
        >
          <calendar-date 
            className="cally p-4 bg-white rounded-lg" 
            onChange={handleDateChange}
            value={selectedDate} // bind ค่าไว้ด้วย
          >
            <svg aria-label="Previous" className="fill-current w-4 h-4 cursor-pointer text-gray-600 hover:text-blue-600" slot="previous" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.75 19.5 8.25 12l7.5-7.5"></path></svg>
            <svg aria-label="Next" className="fill-current w-4 h-4 cursor-pointer text-gray-600 hover:text-blue-600" slot="next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path></svg>
            <calendar-month></calendar-month>
          </calendar-date>
        </div>

      </div>

      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">
          MyLogo
        </div>

        {/* Menu Links */}
        <div className="hidden md:flex space-x-8">
          <NavLink href="/">หน้าแรก</NavLink>
          <NavLink href="/about">เกี่ยวกับเรา</NavLink>
          <NavLink href="/services">บริการ</NavLink>
          <NavLink href="/contact">ติดต่อ</NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button className="text-gray-600 hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }) {
  return (
    <Link 
      href={href} 
      className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
    >
      {children}
    </Link>
  );
}