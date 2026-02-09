"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  X, Save, Trash2, Code, Eye, Check, Edit2, FileText, 
  FileJson, History, ArrowLeft, Undo2, Redo2, Type, 
  Image as ImageIcon, MousePointer2, Box, Minus, Loader2, ShieldCheck, ShieldAlert
} from "lucide-react"; 
import FlexRender from "./FlexRender"; 

// --- SNIPPET DATA ---
const SNIPPETS = [
  { 
    label: "Text", 
    icon: <Type size={14} />, 
    code: { "type": "text", "text": "Text.....", "size": "sm", "color": "#000000" } 
  },
  { 
    label: "Bold Text", 
    icon: <Type size={14} className="stroke-[3px]" />, 
    code: { "type": "text", "text": "Bold Text.....", "weight": "bold", "size": "md" } 
  },
  { 
    label: "Button", 
    icon: <MousePointer2 size={14} />, 
    code: { "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Button.....", "uri": "https://line.me" } } 
  },
  { 
    label: "Image", 
    icon: <ImageIcon size={14} />, 
    code: { "type": "image", "url": "https://via.placeholder.com/300", "size": "full", "aspectRatio": "20:13", "aspectMode": "cover" } 
  },
  { 
    label: "Row", 
    icon: <Box size={14} />, 
    code: { "type": "box", "layout": "horizontal", "contents": [] } 
  },
  { 
    label: "Separator", 
    icon: <Minus size={14} />, 
    code: { "type": "separator", "margin": "md" } 
  }
];

export default function EditorModal({ item, isOpen, onClose, onSave, onDelete }) {
  const [jsonContent, setJsonContent] = useState("");
  
  // History State
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [parseError, setParseError] = useState(null);
  const [lineValidationError, setLineValidationError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState(""); 
  const [changeNote, setChangeNote] = useState(""); 
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSaveMode, setIsSaveMode] = useState(false);
  const [mobileTab, setMobileTab] = useState("preview");

  const nameInputRef = useRef(null);
  const textAreaRef = useRef(null); 

  useEffect(() => {
    if (item && isOpen) {
      const initialJson = item.content ? JSON.stringify(item.content, null, 2) : "";
      setJsonContent(initialJson);
      
      setHistory([initialJson]);
      setHistoryIndex(0);

      setEditName(item.name || "");        
      setEditDesc(item.description || ""); 
      setChangeNote(""); 
      setIsSaveMode(false);
      setIsRenaming(false);
      setParseError(null);
      setLineValidationError(null);
      setMobileTab("preview");
    }
  }, [item, isOpen]);

  useEffect(() => {
    if (isRenaming && nameInputRef.current) nameInputRef.current.focus();
  }, [isRenaming]);

  // Real-time Validation Effect
  useEffect(() => {
    // 🛑 CONDITION ADDED: หยุดทำงานทันทีถ้า Modal ปิดอยู่
    if (!isOpen) return;

    // 1. ถ้า JSON ผิด Syntax (วงเล็บไม่ครบ) ไม่ต้องส่งไปเช็ค LINE
    try {
        JSON.parse(jsonContent);
        setParseError(null);
    } catch (e) {
        setParseError(e.message);
        setLineValidationError(null);
        return; 
    }

    // 2. ถ้า JSON ถูก Syntax ให้รอ 1 วินาทีแล้วค่อยยิง API
    const timer = setTimeout(async () => {
        setIsValidating(true);
        try {
            const res = await fetch("/api/validate-push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: jsonContent, 
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                setLineValidationError(data.message || "Invalid Flex Message structure");
            } else {
                setLineValidationError(null);
            }
        } catch (error) {
            console.error("Validation error:", error);
        } finally {
            setIsValidating(false);
        }
    }, 1000);

    return () => clearTimeout(timer);

  }, [jsonContent, isOpen]); // เพิ่ม isOpen ใน dependency array

  const updateJson = (newVal) => {
    setJsonContent(newVal);
    
    // Update History
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newVal);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setJsonContent(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setJsonContent(history[newIndex]);
    }
  };

  const insertSnippet = (snippetCode) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const snippetString = JSON.stringify(snippetCode, null, 2);
    const newText = text.substring(0, start) + snippetString + text.substring(end);
    
    updateJson(newText);
    
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippetString.length, start + snippetString.length);
    }, 0);
  };

  const handleJsonChange = (e) => {
    updateJson(e.target.value);
  };

  const handleNameKeyDown = (e) => { if (e.key === 'Enter') setIsRenaming(false); };

  const handlePreSave = () => {
    if (parseError || lineValidationError) {
        setMobileTab("code");
        return;
    }
    setIsSaveMode(true);
  };

  const handleFinalSave = () => {
    onSave(item.id, jsonContent, editName, editDesc, changeNote);
    onClose();
  };

  if (!isOpen) return null;
  let previewData = null;
  try { previewData = JSON.parse(jsonContent); } catch (e) {}

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row items-center justify-center bg-white md:bg-black/70 md:backdrop-blur-sm md:p-4">
      <div className="bg-white w-full h-full md:max-w-[1400px] md:h-[90vh] md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 bg-white shrink-0 z-20">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <button onClick={onClose} className="md:hidden p-2 -ml-2 text-slate-500 active:bg-slate-50 rounded-full"><ArrowLeft size={22}/></button>
            {isRenaming ? (
                <div className="flex items-center gap-2 animate-in fade-in duration-200 w-full md:w-auto">
                    <input ref={nameInputRef} type="text" className="input input-sm input-bordered text-lg font-bold w-full md:w-[300px]" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => setIsRenaming(false)} onKeyDown={handleNameKeyDown} />
                    <button onClick={() => setIsRenaming(false)} className="btn btn-xs btn-square btn-success text-white shrink-0"><Check size={14}/></button>
                </div>
            ) : (
                <div className="flex flex-col group cursor-pointer overflow-hidden" onClick={() => setIsRenaming(true)}>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">{editName || "Untitled Message"}</h2>
                        <button className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all hidden md:block"><Edit2 size={16}/></button>
                    </div>
                    <p className="text-[10px] md:text-xs text-slate-400 truncate hidden md:block">Click name to edit</p>
                </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
             <button onClick={() => onDelete(item.id)} className="btn btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={20} className="md:w-[18px] md:h-[18px]"/></button>
             <button onClick={onClose} className="btn btn-ghost btn-sm text-slate-400 hidden md:flex"><X size={24} /></button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden relative flex-col md:flex-row pb-[60px] md:pb-0">
            
            {/* Preview Panel */}
            <div className={`
                flex-1 bg-[#EAF2FA] relative items-start justify-center overflow-y-auto p-4 md:p-10 pt-10
                bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]
                ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'} 
            `}>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm border border-slate-200 z-10">
                    <Eye size={14} className="text-indigo-500" /> <span className="hidden md:inline">Live</span> Preview
                </div>
                
                <div className="transform transition-all duration-300 scale-100 origin-top w-full flex justify-center min-h-full">
                    {previewData ? <FlexRender json={previewData} /> : <div className="text-red-500">Invalid JSON</div>}
                </div>
            </div>

            {/* Code Editor Panel */}
            <div className={`
                w-full md:w-[500px] flex-col border-l border-gray-200 bg-white shadow-xl z-10 relative h-full
                ${mobileTab === 'code' ? 'flex' : 'hidden md:flex'}
            `}>
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-slate-500 flex items-center gap-2"><Code size={14}/> JSON Source</span>
                         {/* สถานะ Real-time Validation */}
                         {isValidating && <span className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full"><Loader2 size={10} className="animate-spin"/> Checking...</span>}
                         {!isValidating && !parseError && !lineValidationError && <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><ShieldCheck size={10}/> Valid</span>}
                         {!isValidating && (parseError || lineValidationError) && <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><ShieldAlert size={10}/> Invalid</span>}
                    </div>
                    
                    {/* Undo/Redo Buttons */}
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1 hover:bg-white rounded-md transition-all text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent" title="Undo"><Undo2 size={14} /></button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1 hover:bg-white rounded-md transition-all text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent" title="Redo"><Redo2 size={14} /></button>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(jsonContent)} className="text-xs text-indigo-600 hover:underline">Copy</button>
                    </div>
                </div>

                {/* Snippet Toolbar */}
                <div className="flex gap-2 p-2 border-b border-gray-50 overflow-x-auto no-scrollbar bg-slate-50/50">
                    {SNIPPETS.map((item, idx) => (
                        <button key={idx} onClick={() => insertSnippet(item.code)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0 shadow-sm" title={`Insert ${item.label} at cursor`}>{item.icon} {item.label}</button>
                    ))}
                </div>

                <div className="flex-1 relative">
                    <textarea 
                        ref={textAreaRef}
                        className="w-full h-full p-4 font-mono text-sm text-slate-700 bg-slate-50/30 resize-none focus:outline-none leading-6"
                        value={jsonContent} onChange={handleJsonChange} spellCheck="false" autoCapitalize="off" autoCorrect="off"
                    />
                    
                    {/* Error Message Area */}
                    {(parseError || lineValidationError) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-50 text-red-600 text-xs p-3 border-t border-red-100 font-mono z-20 animate-in slide-in-from-bottom-2">
                             <div className="font-bold flex items-center gap-2 mb-1"><ShieldAlert size={14}/> Error Detected:</div>
                             {parseError || lineValidationError}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white hidden md:flex justify-end gap-4">
                    <button onClick={onClose} className="btn btn-ghost btn-sm bg-[#e3243b] text-white rounded-[12px] hover:bg-[#9c0c09] px-[14px] h-10">Cancel</button>
                    {/* ปุ่ม Save จะ Disable ถ้ามี Error */}
                    <button onClick={handlePreSave} disabled={!!parseError || !!lineValidationError || isValidating} className="btn btn-neutral btn-sm px-6 rounded-[12px] flex items-center gap-4 bg-[#111827] text-white hover:bg-[#272e38] shadow-lg shadow-[#111827]/20 h-10 disabled:opacity-50 disabled:cursor-not-allowed"><Save size={16}/> Save Changes</button>
                </div>
            </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center justify-between gap-3 z-30 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setMobileTab('preview')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${mobileTab === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Eye size={16}/> Preview</button>
                <button onClick={() => setMobileTab('code')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${mobileTab === 'code' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Code size={16}/> Code</button>
            </div>
            <button onClick={handlePreSave} disabled={!!parseError || !!lineValidationError || isValidating} className="btn btn-sm bg-[#111827] text-white rounded-xl shadow-lg flex-1 h-10 flex items-center justify-center gap-2 text-sm disabled:opacity-50"><Save size={18} className="shrink-0" /> <span>Save</span></button>
        </div>

        {/* Save Popup */}
        {isSaveMode && (
           <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-200 max-h-[85vh]">
               <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-lg text-slate-800">Finalize Saving</h3>
                  <button onClick={() => setIsSaveMode(false)} className="btn btn-sm btn-circle btn-ghost text-slate-400 hover:bg-slate-200"><X size={20}/></button>
               </div>
               <div className="p-6 flex flex-col gap-5 overflow-y-auto">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                     <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600"><FileJson size={20} /></div>
                     <div className="min-w-0"><p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Template Name</p><p className="font-bold text-indigo-900 text-sm truncate">{editName || "Untitled"}</p></div>
                  </div>
                  <div className="form-control"><label className="label pt-0"><span className="label-text font-bold text-slate-700 flex items-center gap-2"><FileText size={16} className="text-slate-500"/> Description</span></label><textarea className="textarea textarea-bordered h-20 resize-none text-sm w-full focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Brief description..." value={editDesc} onChange={(e) => setEditDesc(e.target.value)}></textarea></div>
                  <div className="form-control"><label className="label pt-0"><span className="label-text font-bold text-slate-700 flex items-center gap-2"><History size={16} className="text-orange-500"/> Change Log</span></label><textarea className="textarea textarea-bordered h-24 resize-none text-sm w-full bg-orange-50/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500" placeholder="What changed?" value={changeNote} onChange={(e) => setChangeNote(e.target.value)}></textarea></div>
               </div>
               <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 pb-safe">
                     <button onClick={() => setIsSaveMode(false)} className="btn btn-ghost btn-sm px-6 rounded-xl text-white bg-[#e3243b] hover:bg-[#900603]">Cancel</button>
                     <button onClick={handleFinalSave} className="btn btn-sm px-6 gap-2 shadow-lg bg-[#111827] text-white hover:bg-[#5bb450] flex items-center rounded-xl"><Check size={16}/> Confirm</button>
                 </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}