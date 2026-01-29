"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Code, Eye, Copy } from "lucide-react";
import FlexRender from "./FlexRender"; // เรียกใช้ตัว Render ที่เพิ่งแก้

export default function EditorModal({ item, isOpen, onClose, onSave, onDelete }) {
  // สร้าง state เก็บ JSON String เพื่อแสดงใน Textarea
  const [jsonContent, setJsonContent] = useState("");
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    if (item && item.content) {
      setJsonContent(JSON.stringify(item.content, null, 2));
    }
  }, [item]);

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setJsonContent(val);
    try {
      JSON.parse(val); // ตรวจสอบ syntax
      setParseError(null);
    } catch (err) {
      setParseError(err.message);
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      onSave(item.id, jsonContent, item.description);
      onClose();
    } catch (e) {
      alert("Cannot save: Invalid JSON");
    }
  };

  if (!isOpen) return null;

  // แปลง String กลับเป็น Object เพื่อส่งให้ Render
  let previewData = null;
  try {
    previewData = JSON.parse(jsonContent);
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-slate-800">{item?.name || "Editor"}</h2>
          <div className="flex gap-2">
             <button onClick={() => onDelete(item.id)} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={18}/></button>
             <button onClick={onClose} className="btn btn-ghost btn-sm text-slate-400"><X size={24} /></button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* Left: Preview (Visual) */}
            <div className="flex-1 bg-[#EAF2FA] relative flex items-center justify-center overflow-auto p-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm border border-slate-200">
                    <Eye size={14} className="text-indigo-500" /> Live Preview
                </div>
                
                {/* Area แสดงผล Flex Message */}
                <div className="transform transition-all duration-300">
                    {previewData ? (
                        <FlexRender json={previewData} />
                    ) : (
                        <div className="text-red-500 font-mono text-sm bg-red-50 p-4 rounded border border-red-200 shadow-sm">
                            Invalid JSON Syntax
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Code Editor */}
            <div className="w-[500px] flex flex-col border-l border-gray-200 bg-white shadow-xl z-10">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-2"><Code size={14}/> JSON Source</span>
                    <button onClick={() => navigator.clipboard.writeText(jsonContent)} className="text-xs text-indigo-600 hover:underline">Copy</button>
                </div>
                <div className="flex-1 relative">
                    <textarea 
                        className="w-full h-full p-4 font-mono text-sm text-slate-700 bg-slate-50/30 resize-none focus:outline-none leading-6"
                        value={jsonContent}
                        onChange={handleJsonChange}
                        spellCheck="false"
                    />
                    {parseError && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-50 text-red-600 text-xs p-3 border-t border-red-100 font-mono">
                            Error: {parseError}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
                    <button onClick={handleSave} disabled={!!parseError} className="btn btn-neutral btn-sm px-6">Save Changes</button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}