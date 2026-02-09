"use client";
import React, { useMemo } from 'react';
import FlexNode from './FlexComponent'; 

export default function FlexRender({ json }) {
  
  const rootNode = useMemo(() => {
    if (!json) return null;
    let data = json;
    
    // Parse String to JSON if needed
    if (typeof json === 'string') {
        try { 
            data = JSON.parse(json); 
        } catch(e) { 
            console.error("Invalid JSON:", e);
            return null; 
        }
    }
    
    // Find the actual Root Node (Handle { type: 'flex', contents: ... } wrapper)
    let content = (data.type === 'flex' && data.contents) ? data.contents : data;
    
    return content;
  }, [json]);

  if (!rootNode) return <div className="text-red-500 text-xs p-4 text-center">Invalid Data</div>;

  return (
    // CONTAINER FIX:
    // 1. Removed 'px-4' entirely. This was adding 32px of unwanted width/squeeze.
    // 2. Used 'grid place-items-center' for safer centering without flex shrinking.
    <div className="w-full py-10 overflow-x-auto grid place-items-center bg-transparent">
        
        {/* Wrapper: 'w-max' ensures the div expands to fit the Bubble/Carousel fully */}
        <div className="w-max"> 
            <FlexNode node={rootNode} />
        </div>
        
        <style jsx global>{`
            .fl-bubble, a, div { font-family: 'Sukhumvit Set', -apple-system, sans-serif; }
            /* Hide Scrollbar */
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    </div>
  );
}