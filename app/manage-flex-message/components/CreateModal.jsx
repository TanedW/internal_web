"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
// Added Icons for Validation & Toolbar
import { 
  X, Code, LayoutTemplate, CheckCircle2, ArrowRight, Sparkles, 
  Eye, AlertCircle, Type, Image as ImageIcon, MousePointer2, 
  Box, Minus, Undo2, Redo2, Layers, GalleryHorizontal,
  Loader2, ShieldCheck, ShieldAlert // Added validation icons
} from "lucide-react";
import FlexRender from "./FlexRender"; 

// --- SNIPPET DATA (Create Mode has Base Structures) ---
const SNIPPETS = [
  { 
    label: "Carousel", 
    icon: <GalleryHorizontal size={14} />, 
    code: { "type": "carousel", "contents": [] } 
  },
  { 
    label: "Bubble", 
    icon: <Layers size={14} />, 
    code: { "type": "bubble", "body": { "type": "box", "layout": "vertical", "contents": [] } } 
  },
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

// --- TEMPLATES DATA ---
const SAMPLE_TEMPLATES = [
  {
    id: "b1",
    name: "Restaurant Info",
    category: "Business",
    description: "Restaurant card with rating stars.",
    content: {
      "type": "bubble",
      "body": {
        "type": "box", "layout": "vertical",
        "contents": [
          { "type": "text", "text": "Brown Cafe", "weight": "bold", "size": "xl" },
          { "type": "text", "text": "4.0 Stars", "size": "sm", "color": "#999999" }
        ]
      }
    }
  },
  {
    id: "c5",
    name: "Restaurant Carousel",
    category: "Carousel",
    description: "A carousel of restaurant listings.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "body": {
            "type": "box", "layout": "vertical",
            "contents": [{ "type": "text", "text": "Shop A" }]
          }
        },
        {
          "type": "bubble",
          "body": {
            "type": "box", "layout": "vertical",
            "contents": [{ "type": "text", "text": "Shop B" }]
          }
        }
      ]
    }
  }
];

const CreateModal = ({ isOpen, onClose, onCreate }) => {
  const [activeTab, setActiveTab] = useState("scratch");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  
  // Undo/Redo State
  const [json, setJson] = useState("{\n  \"type\": \"bubble\",\n  \"body\": {\n    \"type\": \"box\",\n    \"layout\": \"vertical\",\n    \"contents\": [\n      { \"type\": \"text\", \"text\": \"Hello World\" }\n    ]\n  }\n}");
  const [history, setHistory] = useState([json]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Validation State
  const [jsonError, setJsonError] = useState(null); // Local Syntax Error
  const [lineValidationError, setLineValidationError] = useState(null); // API Error
  const [isValidating, setIsValidating] = useState(false); // Loading State

  const [quickReply, setQuickReply] = useState("");
  const textAreaRef = useRef(null); 

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
        const initial = "{\n  \"type\": \"bubble\",\n  \"body\": {\n    \"type\": \"box\",\n    \"layout\": \"vertical\",\n    \"contents\": [\n      { \"type\": \"text\", \"text\": \"Hello World\" }\n    ]\n  }\n}";
        setJson(initial);
        setHistory([initial]);
        setHistoryIndex(0);
        setName("");
        setDesc("");
        setJsonError(null);
        setLineValidationError(null);
        setActiveTab("scratch");
    }
  }, [isOpen]);

  // Real-time Validation Effect
  useEffect(() => {
    if (!isOpen) return;

    // 1. Check Local Syntax
    try {
        JSON.parse(json);
        setJsonError(null);
    } catch (e) {
        setJsonError(e.message);
        setLineValidationError(null);
        return;
    }

    // 2. Debounce & Check API
    const timer = setTimeout(async () => {
        setIsValidating(true);
        try {
            const res = await fetch("/api/validate-push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: json, 
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
  }, [json, isOpen]);


  // History Management
  const updateJson = (newJson) => {
    setJson(newJson);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newJson);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setJson(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setJson(history[newIndex]);
    }
  };

  // Live Preview Logic
  const { previewData } = useMemo(() => {
    try {
      if (!json || json.trim() === "") return { previewData: null };
      const parsed = JSON.parse(json);
      return { previewData: parsed };
    } catch (e) {
      return { previewData: null };
    }
  }, [json]);

  if (!isOpen) return null;

  const handleSelectTemplate = (template) => {
    setName(template.name);
    setDesc(template.description);
    const newJson = JSON.stringify(template.content, null, 2);
    
    // Reset History for new template
    setJson(newJson);
    setHistory([newJson]);
    setHistoryIndex(0);
    
    setQuickReply("");
    setActiveTab("scratch");
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1200px] h-[90vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10 shrink-0">
            <div>
                <h2 className="font-extrabold text-xl md:text-2xl text-slate-800 tracking-tight flex items-center gap-2">
                    <Sparkles className="text-yellow-500 fill-yellow-500" size={24} /> 
                    Create Flex Message
                </h2>
                <p className="text-slate-500 text-xs md:text-sm mt-1">Design rich messages or start from a template.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-6 border-b border-slate-100 bg-white shrink-0">
            <button 
                onClick={() => setActiveTab("scratch")}
                className={`pb-3 pt-2 text-sm font-bold flex items-center gap-2 border-b-[3px] transition-all px-2 ${
                    activeTab === "scratch" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
                <Code size={16} /> Code Editor
            </button>
            <button 
                onClick={() => setActiveTab("template")}
                className={`pb-3 pt-2 text-sm font-bold flex items-center gap-2 border-b-[3px] transition-all px-2 ml-6 ${
                    activeTab === "template" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
                <LayoutTemplate size={16} /> Templates Gallery
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50/50 relative flex flex-col">
            
            {/* --- Editor Mode (Split View) --- */}
            {activeTab === "scratch" && (
                <div className="flex flex-col lg:flex-row h-full">
                    
                    {/* LEFT: Preview Column */}
                    <div className="w-full lg:w-[45%] bg-[#EAF2FA] relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 order-1 lg:order-1">
                        <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
                            <Eye size={14} className="text-indigo-500" /> Live Preview
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 flex items-start justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
                            <div className="mt-8 scale-[0.85] lg:scale-90 origin-top transition-all duration-300">
                                {previewData ? (
                                    <FlexRender json={previewData} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <div className="mb-2 p-3 bg-white rounded-full shadow-sm">
                                            <Code size={24} className="opacity-50" />
                                        </div>
                                        <p className="text-sm font-medium">Enter valid JSON to preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Input Column */}
                    <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6 order-2 lg:order-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message Name</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-semibold text-slate-800 transition-all shadow-sm text-sm"
                                    placeholder="e.g., Welcome Campaign"
                                    value={name} onChange={e => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-600 transition-all shadow-sm text-sm"
                                    placeholder="Internal note..."
                                    value={desc} onChange={e => setDesc(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2 flex-1 flex flex-col">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Flex Message JSON</label>
                                
                                {/* Tools & Validation Status */}
                                <div className="flex items-center gap-2">
                                     {isValidating && <span className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full"><Loader2 size={10} className="animate-spin"/> Checking...</span>}
                                     {!isValidating && !jsonError && !lineValidationError && <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><ShieldCheck size={10}/> Valid</span>}
                                     {!isValidating && (jsonError || lineValidationError) && <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><ShieldAlert size={10}/> Invalid</span>}

                                    <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 ml-2">
                                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1 hover:bg-white rounded-md transition-all text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent" title="Undo"><Undo2 size={14} /></button>
                                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1 hover:bg-white rounded-md transition-all text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent" title="Redo"><Redo2 size={14} /></button>
                                    </div>
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-medium">Main Content</span>
                                </div>
                            </div>

                            {/* Snippet Toolbar (Includes Base Structures) */}
                            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                                {SNIPPETS.map((item, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => insertSnippet(item.code)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0 shadow-sm"
                                        title={`Insert ${item.label} at cursor`}
                                    >
                                        {item.icon} {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 relative">
                                <textarea 
                                    ref={textAreaRef}
                                    className={`w-full h-64 lg:h-80 p-4 border rounded-xl font-mono text-xs leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none shadow-sm text-slate-700 ${(jsonError || lineValidationError) ? 'border-red-300 ring-2 ring-red-50' : 'border-slate-200'}`}
                                    value={json} onChange={e => updateJson(e.target.value)}
                                    spellCheck="false"
                                    placeholder="{ ... }"
                                />
                                
                                {/* Error Message Area */}
                                {(jsonError || lineValidationError) && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-red-50 text-red-600 text-xs p-3 border-t border-red-100 font-mono z-20 animate-in slide-in-from-bottom-2">
                                         <div className="font-bold flex items-center gap-2 mb-1"><ShieldAlert size={14}/> Error Detected:</div>
                                         {jsonError || lineValidationError}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Reply JSON <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-medium">Interactive</span>
                            </div>
                            <textarea 
                                className="w-full h-24 p-4 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none shadow-sm text-slate-700"
                                value={quickReply} onChange={e => setQuickReply(e.target.value)}
                                placeholder='{ "items": [ { "type": "action", ... } ] }'
                                spellCheck="false"
                            />
                        </div>
                    </div>

                </div>
            )}

            {/* --- Template Mode --- */}
            {activeTab === "template" && (
                <div className="p-8 overflow-y-auto h-full animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                        {SAMPLE_TEMPLATES.map((t) => (
                            <div 
                                key={t.id}
                                onClick={() => handleSelectTemplate(t)}
                                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-900 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
                            >
                                {/* Preview */}
                                <div className="h-48 bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                    <div className="scale-[0.5] origin-center shadow-lg rounded-lg overflow-hidden transition-transform duration-500 group-hover:scale-[0.55]">
                                        <FlexRender json={t.content} />
                                    </div>
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                                        <span className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-slate-900/30 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Use This
                                        </span>
                                    </div>
                                </div>
                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 text-xs md:text-sm">{t.name}</h3>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{t.category}</span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 bg-white flex justify-between items-center z-20 shrink-0">
          <div className="text-xs text-slate-400 font-medium px-2 hidden md:block">
             {activeTab === "scratch" ? ((jsonError || lineValidationError) ? "Fix JSON errors to continue" : "Ready to create") : "Choose a template to get started"}
          </div>
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            {activeTab === "scratch" ? (
                <button 
                    disabled={!!jsonError || !!lineValidationError || isValidating}
                    onClick={() => { onCreate(name, desc, json, quickReply); onClose(); }} 
                    className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${ (!!jsonError || !!lineValidationError || isValidating) ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-black shadow-slate-900/20 active:scale-95'}`}
                >
                    Create Message <ArrowRight size={16} />
                </button>
            ) : (
                <button 
                    disabled
                    className="px-6 py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed"
                >
                    Select a template
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;