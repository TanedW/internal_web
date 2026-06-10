"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar"; // ← ปรับ path ตาม project ของคุณ

/**
 * layout.jsx สำหรับ route /dashboard (หรือ route ที่คุณวาง DashboardPage)
 *
 * วางไฟล์นี้ที่:  app/dashboard/layout.jsx
 * วาง page.jsx ที่: app/dashboard/page.jsx
 *
 * Sidebar ทำงานเหมือนกับ layout ของหน้า /home ทุกประการ
 */
export default function DashboardLayout({ children }) {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Sidebar
        isDesktopSidebarOpen={isDesktopSidebarOpen}
        setIsDesktopSidebarOpen={setIsDesktopSidebarOpen}
      />

      {/* Main content — offset เพื่อไม่ให้ชนกับ sidebar */}
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          // sidebar width: 288px (open) / 80px (collapsed) + left offset 16px
          marginLeft: isDesktopSidebarOpen ? "304px" : "96px",
        }}
      >
        {/* mobile top-bar offset (sidebar.jsx ใช้ h-16) */}
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
