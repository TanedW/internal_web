"use client";
import React, { useEffect, useRef } from 'react';
// Import จากไฟล์ข้างๆ ในโฟลเดอร์เดียวกัน
import { renderFlexHTML } from './flexLogic';

export default function FlexPreview({ json }) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current && json) {
      try {
        // Handle JSON String or Object
        let data = json;
        if (typeof json === 'string') {
           try { data = JSON.parse(json); } catch(e) {}
        }
        
        // Unwrap Container
        const root = (data.type === 'flex' && data.contents) ? data.contents : data;
        
        // Render HTML
        const html = renderFlexHTML(root);
        previewRef.current.innerHTML = html;
        
      } catch (err) {
        console.error("Flex Render Error:", err);
        previewRef.current.innerHTML = '<div class="text-red-500 text-sm p-4">Preview Error</div>';
      }
    }
  }, [json]);

  return (
    <div className="w-full flex justify-center py-6">
      <style jsx global>{`
        /* เสริม Font ภาษาไทย */
        .fl-bubble, a { font-family: 'Sukhumvit Set', -apple-system, sans-serif; }
        
        /* แต่ง Scrollbar ของ Carousel */
        .fl-carousel::-webkit-scrollbar { height: 6px; }
        .fl-carousel::-webkit-scrollbar-track { background: transparent; }
        .fl-carousel::-webkit-scrollbar-thumb { background: #cccccc; border-radius: 3px; }
      `}</style>

      {/* พื้นที่แสดงผล Clean */}
      <div className="relative w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
         <div ref={previewRef} />
      </div>
    </div>
  );
}