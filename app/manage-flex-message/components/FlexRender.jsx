// components/FlexRender.jsx
"use client";
import React, { useMemo } from 'react';
import FlexNode from './FlexComponent'; 

// --- ฟังก์ชันทำความสะอาดข้อมูล (Data Cleaner) ---
// หน้าที่: วิ่งเข้าไปหาปุ่มที่มีปัญหาใน JSON แล้วแก้ค่าสีให้ถูกต้องก่อนส่งไปวาด
const cleanFlexData = (node) => {
  if (!node || typeof node !== 'object') return node;
  
  // Clone ข้อมูลเพื่อไม่ให้กระทบต้นฉบับ
  const newNode = { ...node };

  // 🎯 ดักจับปุ่มเจ้าปัญหา (Pattern: มี Action + มีเงาด้านล่าง 3px)
  if (newNode.type === 'box' && newNode.paddingBottom === '3px' && newNode.action) {
      // 1. เติมขอบให้ครบ (จากเดิมมีแค่ล่าง 3px)
      newNode.paddingTop = '2px';
      newNode.paddingStart = '2px';
      newNode.paddingEnd = '2px';

      // 2. เจาะเข้าไปแก้ลูก (Inner Box) ให้เป็นสีขาว
      if (newNode.contents && Array.isArray(newNode.contents)) {
          newNode.contents = newNode.contents.map(child => {
              if (child.type === 'box') {
                  const newChild = { ...child, backgroundColor: '#FFFFFF' }; // บังคับขาว
                  
                  // 3. เจาะเข้าไปแก้หลาน (Text) ให้เป็นสีดำ
                  if (newChild.contents) {
                      newChild.contents = newChild.contents.map(grandChild => {
                          if (grandChild.type === 'text') {
                              // ถ้าเดิมเป็นสีขาว/เกือบขาว ให้เปลี่ยนเป็นดำ
                              const c = grandChild.color || '';
                              if (!c || c.toUpperCase().includes('FFF')) {
                                  return { ...grandChild, color: '#000000' };
                              }
                          }
                          return grandChild;
                      });
                  }
                  return newChild;
              }
              return child;
          });
      }
  }

  // วนลูปทำความสะอาดลูกๆ ต่อ (Recursive)
  if (newNode.contents && Array.isArray(newNode.contents)) {
      newNode.contents = newNode.contents.map(cleanFlexData);
  }
  
  return newNode;
};

export default function FlexRender({ json }) {
  
  const rootNode = useMemo(() => {
    if (!json) return null;
    let data = json;
    if (typeof json === 'string') {
        try { data = JSON.parse(json); } catch(e) { return null; }
    }
    
    // หา Root node ที่แท้จริง
    let content = (data.type === 'flex' && data.contents) ? data.contents : data;
    
    // 🧹 ทำความสะอาดข้อมูลก่อนเรนเดอร์!
    return cleanFlexData(content);
  }, [json]);

  if (!rootNode) return <div className="text-red-500 text-xs p-4">Invalid Data</div>;

  return (
    // 🟢 เอา bg-slate-50 ออกแล้วเหลือแค่พื้นใส
    // 🟢 เอา max-w ออกเพื่อให้ Carousel เลื่อนได้สุดขอบจอ
    <div className="w-full py-4 overflow-x-auto">
        <div className="mx-auto w-fit min-w-[350px] px-4">
            <FlexNode node={rootNode} />
        </div>
        
        <style jsx global>{`
            .fl-bubble, a, div { font-family: 'Sukhumvit Set', -apple-system, sans-serif; }
            /* ซ่อน Scrollbar แต่ยังเลื่อนได้ */
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    </div>
  );
}