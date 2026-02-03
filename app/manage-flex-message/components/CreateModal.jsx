"use client";
import React, { useState } from "react";
import { X, Code, LayoutTemplate, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import FlexRender from "./FlexRender"; 

// --- EXPANDED TEMPLATES DATA ---
const SAMPLE_TEMPLATES = [
  // --- TYPE: BUBBLE (Single Card) ---
  {
    id: "b1",
    name: "Restaurant Info",
    category: "Business",
    description: "Restaurant card with rating stars, location, and call-to-action buttons.",
    content: {
      "type": "bubble",
      "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "20:13", "aspectMode": "cover" },
      "body": {
        "type": "box", "layout": "vertical",
        "contents": [
          { "type": "text", "text": "Brown Cafe", "weight": "bold", "size": "xl" },
          { "type": "box", "layout": "baseline", "margin": "md", "contents": [
              { "type": "icon", "size": "sm", "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png" },
              { "type": "icon", "size": "sm", "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png" },
              { "type": "icon", "size": "sm", "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png" },
              { "type": "icon", "size": "sm", "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/review_gold_star_28.png" },
              { "type": "text", "text": "4.0", "size": "sm", "color": "#999999", "margin": "md", "flex": 0 },
              { "type": "text", "text": "Siam Square", "size": "sm", "color": "#aaaaaa", "align": "end" }
            ]
          }
        ]
      },
      "footer": {
        "type": "box", "layout": "vertical", "spacing": "sm",
        "contents": [
          { "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Call Now", "uri": "tel:0000000000" } },
          { "type": "button", "style": "secondary", "height": "sm", "action": { "type": "uri", "label": "Website", "uri": "https://linecorp.com" } }
        ],
        "paddingAll": "md" // Fixed Padding
      }
    }
  },
  {
    id: "b2",
    name: "Digital Receipt",
    category: "Finance",
    description: "Professional receipt layout for transaction confirmations.",
    content: {
      "type": "bubble",
      "body": {
        "type": "box", "layout": "vertical",
        "contents": [
          { "type": "text", "text": "PAYMENT SUCCESS", "weight": "bold", "color": "#1DB446", "size": "sm" },
          { "type": "text", "text": "Brown Store", "weight": "bold", "size": "xxl", "margin": "md" },
          { "type": "separator", "margin": "xxl" },
          { "type": "box", "layout": "vertical", "margin": "xxl", "spacing": "sm", "contents": [
              { "type": "box", "layout": "horizontal", "contents": [{ "type": "text", "text": "Energy Drink", "size": "sm", "color": "#555555" }, { "type": "text", "text": "$2.99", "size": "sm", "color": "#111111", "align": "end" }] },
              { "type": "box", "layout": "horizontal", "contents": [{ "type": "text", "text": "Chewing Gum", "size": "sm", "color": "#555555" }, { "type": "text", "text": "$0.99", "size": "sm", "color": "#111111", "align": "end" }] }
            ]
          },
          { "type": "separator", "margin": "xxl" },
          { "type": "box", "layout": "horizontal", "margin": "md", "contents": [
              { "type": "text", "text": "TOTAL", "size": "sm", "weight": "bold", "color": "#555555" },
              { "type": "text", "text": "$3.98", "size": "sm", "weight": "bold", "color": "#111111", "align": "end" }
            ]
          }
        ],
        "paddingAll": "20px"
      }
    }
  },
  {
    id: "b3",
    name: "Real Estate Listing",
    category: "Bubble",
    description: "Showcase property details, pricing, and features in a compact view.",
    content: {
      "type": "bubble",
      "hero": {
        "type": "image",
        "url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "Luxury Condo", "weight": "bold", "size": "xl" },
          { "type": "text", "text": "Sukhumvit, Bangkok", "weight": "bold", "size": "xs", "color": "#aaaaaa" },
          { "type": "separator", "margin": "md" },
          { 
              "type": "text", 
              "text": "3 Bedrooms • 2 Bathrooms • 120sqm", 
              "size": "xs", 
              "color": "#aaaaaa", 
              "margin": "md" 
          },
          { "type": "text", "text": "฿ 15,000,000", "weight": "bold", "size": "xl", "color": "#1DB446", "margin": "md" }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [
            { "type": "button", "style": "primary", "action": { "type": "uri", "label": "Contact Agent", "uri": "https://linecorp.com" } }
        ],
        "paddingAll": "md" // Fixed Padding
      }
    }
  },
  {
    id: "b4",
    name: "Social Profile",
    category: "Bubble",
    description: "User profile card with circular avatar, stats, and bio information.",
    content: {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "xl",
            "aspectMode": "cover",
            "aspectRatio": "1:1",
            "gravity": "center",
            "cornerRadius": "100px"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "text", "text": "Alex Brown", "weight": "bold", "size": "xl", "align": "center" },
                { "type": "text", "text": "Product Designer @LINE", "size": "xs", "color": "#aaaaaa", "align": "center" }
            ],
            "paddingAll": "lg"
          },
          {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                  { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "150", "weight": "bold", "align": "center" }, { "type": "text", "text": "Posts", "size": "xs", "color": "#aaaaaa", "align": "center" }] },
                  { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "2.5k", "weight": "bold", "align": "center" }, { "type": "text", "text": "Followers", "size": "xs", "color": "#aaaaaa", "align": "center" }] },
                  { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "340", "weight": "bold", "align": "center" }, { "type": "text", "text": "Following", "size": "xs", "color": "#aaaaaa", "align": "center" }] }
              ]
          }
        ],
        "paddingAll": "lg"
      }
    }
  },

  // --- TYPE: CAROUSEL (Multiple Cards) ---
  {
    id: "c1",
    name: "Fashion Collection",
    category: "Carousel",
    description: "Horizontal scrollable list ideal for showcasing multiple products.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "3:4", "aspectMode": "cover" },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Streetwear Hoodie", "weight": "bold", "size": "md" }, { "type": "text", "text": "$49.99", "size": "sm", "color": "#888888" }] },
          "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Add to Cart", "uri": "https://example.com" } }], "paddingAll": "md" }
        },
        {
          "type": "bubble",
          "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "3:4", "aspectMode": "cover" },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Running Shoes", "weight": "bold", "size": "md" }, { "type": "text", "text": "$89.99", "size": "sm", "color": "#888888" }] },
          "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Add to Cart", "uri": "https://example.com" } }], "paddingAll": "md" }
        }
      ]
    }
  },
  {
    id: "c2",
    name: "Travel Destinations",
    category: "Carousel",
    description: "Engaging scrollable cards for travel spots with ratings and images.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "4:3", "aspectMode": "cover" },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Kyoto, Japan", "weight": "bold", "size": "xl" }, { "type": "text", "text": "⭐️ 4.9 (2k reviews)", "size": "xs", "color": "#aaaaaa" }] },
          "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "style": "secondary", "action": { "type": "uri", "label": "View Details", "uri": "https://example.com" } }], "paddingAll": "md" }
        },
        {
          "type": "bubble",
          "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "4:3", "aspectMode": "cover" },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Venice, Italy", "weight": "bold", "size": "xl" }, { "type": "text", "text": "⭐️ 4.8 (1.5k reviews)", "size": "xs", "color": "#aaaaaa" }] },
          "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "style": "secondary", "action": { "type": "uri", "label": "View Details", "uri": "https://example.com" } }], "paddingAll": "md" }
        }
      ]
    }
  },
  {
    id: "c3",
    name: "Food Menu",
    category: "Carousel",
    description: "Compact food menu items with price and images.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "1:1", "aspectMode": "cover" },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Cheese Burger", "weight": "bold", "align": "center" }, { "type": "text", "text": "$8.50", "size": "xs", "color": "#888888", "align": "center" }] }
        },
        {
          "type": "bubble",
          "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "1:1", "aspectMode": "cover" },
          "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Pepperoni Pizza", "weight": "bold", "align": "center" }, { "type": "text", "text": "$12.00", "size": "xs", "color": "#888888", "align": "center" }] }
        },
        {
            "type": "bubble",
            "hero": { "type": "image", "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80", "size": "full", "aspectRatio": "1:1", "aspectMode": "cover" },
            "body": { "type": "box", "layout": "vertical", "contents": [{ "type": "text", "text": "Mixed Drinks", "weight": "bold", "align": "center" }, { "type": "text", "text": "$5.00", "size": "xs", "color": "#888888", "align": "center" }] }
          }
      ]
    }
  },
  {
    id: "c4",
    name: "News Digest",
    category: "Carousel",
    description: "Daily news headlines summary for quick reading.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "TECHNOLOGY", "weight": "bold", "color": "#1DB446", "size": "xxs" },
              { "type": "text", "text": "AI Breakthrough in 2026", "weight": "bold", "size": "md", "wrap": true },
              { "type": "text", "text": "New models are faster and more accurate than ever before.", "size": "xs", "color": "#aaaaaa", "wrap": true, "margin": "sm" }
            ]
          },
          "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "height": "sm", "action": { "type": "uri", "label": "Read More", "uri": "https://example.com" } }], "paddingAll": "md" }
        },
        {
          "type": "bubble",
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "BUSINESS", "weight": "bold", "color": "#1DB446", "size": "xxs" },
              { "type": "text", "text": "Global Markets Rally", "weight": "bold", "size": "md", "wrap": true },
              { "type": "text", "text": "Stocks hit record highs as inflation data cools down.", "size": "xs", "color": "#aaaaaa", "wrap": true, "margin": "sm" }
            ]
          },
          "footer": { "type": "box", "layout": "vertical", "contents": [{ "type": "button", "height": "sm", "action": { "type": "uri", "label": "Read More", "uri": "https://example.com" } }], "paddingAll": "md" }
        }
      ]
    }
  }
];

const CreateModal = ({ isOpen, onClose, onCreate }) => {
  const [activeTab, setActiveTab] = useState("scratch");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [json, setJson] = useState("{\n  \n}");
  const [quickReply, setQuickReply] = useState("");

  if (!isOpen) return null;

  const handleSelectTemplate = (template) => {
    setName(template.name);
    setDesc(template.description);
    setJson(JSON.stringify(template.content, null, 2));
    setQuickReply("");
    setActiveTab("scratch");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-[1000px] max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center z-10">
            <div>
                <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight flex items-center gap-2">
                    <Sparkles className="text-yellow-500 fill-yellow-500" size={20} /> 
                    Create Flex Message
                </h2>
                <p className="text-slate-500 text-sm mt-1">Design rich messages or start from a template.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={24} />
            </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-slate-100 bg-white">
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
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-0 relative">
            
            {/* --- Editor Mode --- */}
            {activeTab === "scratch" && (
                <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message Name</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-semibold text-slate-800 transition-all shadow-sm"
                                placeholder="e.g., Welcome Campaign"
                                value={name} onChange={e => setName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-600 transition-all shadow-sm"
                                placeholder="Internal note..."
                                value={desc} onChange={e => setDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Flex Message JSON</label>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-medium">Main Content</span>
                        </div>
                        <textarea 
                            className="w-full h-80 p-5 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none shadow-sm text-slate-700"
                            value={json} onChange={e => setJson(e.target.value)}
                            spellCheck="false"
                            placeholder="{ ... }"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Reply JSON <span className="text-slate-400 font-normal lowercase">(optional)</span></label>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono font-medium">Interactive</span>
                        </div>
                        <textarea 
                            className="w-full h-24 p-5 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none shadow-sm text-slate-700"
                            value={quickReply} onChange={e => setQuickReply(e.target.value)}
                            placeholder='{ "items": [ { "type": "action", ... } ] }'
                            spellCheck="false"
                        />
                    </div>
                </div>
            )}

            {/* --- Template Mode --- */}
            {activeTab === "template" && (
                <div className="p-8 min-h-full animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-10">
                        {SAMPLE_TEMPLATES.map((t) => (
                            <div 
                                key={t.id}
                                onClick={() => handleSelectTemplate(t)}
                                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-900 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full transform hover:-translate-y-1"
                            >
                                {/* Preview */}
                                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100 pattern-dots">
                                    <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                                    <div className="scale-[0.5] origin-center shadow-lg rounded-lg overflow-hidden transition-transform duration-500 group-hover:scale-[0.55]">
                                        <FlexRender json={t.content} />
                                    </div>
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                                        {/* 🟢 BUTTON COLOR FIXED TO BLACK */}
                                        <span className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-900/30 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                                            <CheckCircle2 size={16} /> Use Template
                                        </span>
                                    </div>
                                </div>
                                {/* Info */}
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 text-sm">{t.name}</h3>
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">{t.category}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{t.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex justify-between items-center z-20">
          <div className="text-xs text-slate-400 font-medium px-2">
             {activeTab === "scratch" ? "Write valid JSON to render preview" : "Choose a template to get started"}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            {activeTab === "scratch" ? (
                // 🟢 BUTTON COLOR FIXED TO BLACK
                <button 
                    onClick={() => { onCreate(name, desc, json, quickReply); onClose(); }} 
                    className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
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