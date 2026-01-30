"use client";
import React, { useState } from "react";
import { X, Code, LayoutTemplate, CheckCircle2 } from "lucide-react";
import FlexRender from "./FlexRender"; 

// --- EXPANDED TEMPLATES DATA ---
const SAMPLE_TEMPLATES = [
  // --- TYPE: BUBBLE (Single Card) ---
  {
    id: "b1",
    name: "Restaurant Info (Bubble)",
    description: "Single card for a restaurant with rating and location.",
    content: {
      "type": "bubble",
      "hero": {
        "type": "image",
        "url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "Brown Cafe", "weight": "bold", "size": "xl" },
          {
            "type": "box",
            "layout": "baseline",
            "margin": "md",
            "contents": [
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
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          { "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Call Now", "uri": "tel:0000000000" } },
          { "type": "button", "style": "secondary", "height": "sm", "action": { "type": "uri", "label": "Website", "uri": "https://linecorp.com" } }
        ]
      }
    }
  },
  {
    id: "b2",
    name: "Digital Receipt (Bubble)",
    description: "A clean layout for transaction details.",
    content: {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          { "type": "text", "text": "PAYMENT SUCCESS", "weight": "bold", "color": "#1DB446", "size": "sm" },
          { "type": "text", "text": "Brown Store", "weight": "bold", "size": "xxl", "margin": "md" },
          { "type": "separator", "margin": "xxl" },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xxl",
            "spacing": "sm",
            "contents": [
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "Energy Drink", "size": "sm", "color": "#555555" },
                  { "type": "text", "text": "$2.99", "size": "sm", "color": "#111111", "align": "end" }
                ]
              },
              {
                "type": "box",
                "layout": "horizontal",
                "contents": [
                  { "type": "text", "text": "Chewing Gum", "size": "sm", "color": "#555555" },
                  { "type": "text", "text": "$0.99", "size": "sm", "color": "#111111", "align": "end" }
                ]
              }
            ]
          },
          { "type": "separator", "margin": "xxl" },
          {
            "type": "box",
            "layout": "horizontal",
            "margin": "md",
            "contents": [
              { "type": "text", "text": "TOTAL", "size": "sm", "weight": "bold", "color": "#555555" },
              { "type": "text", "text": "$3.98", "size": "sm", "weight": "bold", "color": "#111111", "align": "end" }
            ]
          }
        ]
      }
    }
  },
  {
    id: "b3",
    name: "Real Estate (Bubble)",
    description: "Property listing with details and price.",
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
        ]
      }
    }
  },
  {
    id: "b4",
    name: "Social Profile (Bubble)",
    description: "User profile with avatar, stats and bio.",
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
    name: "Fashion Collection (Carousel)",
    description: "Horizontal scrollable list of fashion items.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "full",
            "aspectRatio": "3:4",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Streetwear Hoodie", "weight": "bold", "size": "md" },
              { "type": "text", "text": "$49.99", "size": "sm", "color": "#888888" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{ "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Add to Cart", "uri": "https://example.com" } }]
          }
        },
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "full",
            "aspectRatio": "3:4",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Running Shoes", "weight": "bold", "size": "md" },
              { "type": "text", "text": "$89.99", "size": "sm", "color": "#888888" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{ "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Add to Cart", "uri": "https://example.com" } }]
          }
        },
        {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
              "size": "full",
              "aspectRatio": "3:4",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                { "type": "text", "text": "Denim Jacket", "weight": "bold", "size": "md" },
                { "type": "text", "text": "$65.00", "size": "sm", "color": "#888888" }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [{ "type": "button", "style": "primary", "height": "sm", "action": { "type": "uri", "label": "Add to Cart", "uri": "https://example.com" } }]
            }
          }
      ]
    }
  },
  {
    id: "c2",
    name: "Travel Destinations (Carousel)",
    description: "Showcase popular travel spots with ratings.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "full",
            "aspectRatio": "4:3",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Kyoto, Japan", "weight": "bold", "size": "xl" },
              { "type": "text", "text": "⭐️ 4.9 (2k reviews)", "size": "xs", "color": "#aaaaaa" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{ "type": "button", "style": "secondary", "action": { "type": "uri", "label": "View Details", "uri": "https://example.com" } }]
          }
        },
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "full",
            "aspectRatio": "4:3",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Venice, Italy", "weight": "bold", "size": "xl" },
              { "type": "text", "text": "⭐️ 4.8 (1.5k reviews)", "size": "xs", "color": "#aaaaaa" }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{ "type": "button", "style": "secondary", "action": { "type": "uri", "label": "View Details", "uri": "https://example.com" } }]
          }
        }
      ]
    }
  },
  {
    id: "c3",
    name: "Food Menu (Carousel)",
    description: "Recommended dishes for a restaurant.",
    content: {
      "type": "carousel",
      "contents": [
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "full",
            "aspectRatio": "1:1",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Cheese Burger", "weight": "bold", "align": "center" },
              { "type": "text", "text": "$8.50", "size": "xs", "color": "#888888", "align": "center" }
            ]
          }
        },
        {
          "type": "bubble",
          "hero": {
            "type": "image",
            "url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "size": "full",
            "aspectRatio": "1:1",
            "aspectMode": "cover"
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              { "type": "text", "text": "Pepperoni Pizza", "weight": "bold", "align": "center" },
              { "type": "text", "text": "$12.00", "size": "xs", "color": "#888888", "align": "center" }
            ]
          }
        },
        {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
              "size": "full",
              "aspectRatio": "1:1",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                { "type": "text", "text": "Mixed Drinks", "weight": "bold", "align": "center" },
                { "type": "text", "text": "$5.00", "size": "xs", "color": "#888888", "align": "center" }
              ]
            }
          }
      ]
    }
  },
  {
    id: "c4",
    name: "News Digest (Carousel)",
    description: "Daily news headlines summary.",
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
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{ "type": "button", "height": "sm", "action": { "type": "uri", "label": "Read More", "uri": "https://example.com" } }]
          }
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
          "footer": {
            "type": "box",
            "layout": "vertical",
            "contents": [{ "type": "button", "height": "sm", "action": { "type": "uri", "label": "Read More", "uri": "https://example.com" } }]
          }
        }
      ]
    }
  }
];

const CreateModal = ({ isOpen, onClose, onCreate }) => {
  const [activeTab, setActiveTab] = useState("scratch"); // 'scratch' | 'template'
  
  // Form State
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [json, setJson] = useState("{\n  \n}");

  if (!isOpen) return null;

  const handleSelectTemplate = (template) => {
    // 1. Fill data from template
    setName(template.name);
    setDesc(template.description);
    setJson(JSON.stringify(template.content, null, 2));
    
    // 2. Switch back to 'scratch' view so user can edit details before creating
    setActiveTab("scratch");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="bg-slate-50 border-b border-slate-200">
            <div className="flex justify-between items-center px-6 py-4">
                <h2 className="font-extrabold text-xl text-slate-800">Create New Flex Message</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={20} /></button>
            </div>
            
            {/* Tabs */}
            <div className="flex px-6 gap-6">
                <button 
                    onClick={() => setActiveTab("scratch")}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "scratch" 
                        ? "border-black text-black" 
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <Code size={16} /> Write from Scratch
                </button>
                <button 
                    onClick={() => setActiveTab("template")}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "template" 
                        ? "border-indigo-600 text-indigo-600" 
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <LayoutTemplate size={16} /> Use Template
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white p-0">
            
            {/* --- MODE 1: SCRATCH (Form) --- */}
            {activeTab === "scratch" && (
                <div className="p-8 max-w-2xl mx-auto space-y-6 animate-in slide-in-from-left-4 duration-300">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-6 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-700"><CheckCircle2 size={20}/></div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-800">Ready to create?</h3>
                            <p className="text-xs text-slate-500">Fill in the details below. If you chose a template, the JSON is already filled for you.</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Template Name</label>
                        <input 
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black font-bold text-slate-800 transition-all"
                            placeholder="e.g., Welcome Message V1"
                            value={name} onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                        <input 
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black text-sm text-slate-600 transition-all"
                            placeholder="Briefly describe this message..."
                            value={desc} onChange={e => setDesc(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">JSON Content</label>
                        <div className="relative">
                            <textarea 
                                className="w-full h-64 p-4 border border-slate-200 rounded-xl font-mono text-xs leading-5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none"
                                value={json} onChange={e => setJson(e.target.value)}
                                spellCheck="false"
                            />
                            <div className="absolute top-2 right-2 text-[10px] bg-slate-200 px-2 py-1 rounded text-slate-500 font-bold font-mono">JSON</div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODE 2: TEMPLATES (Grid) --- */}
            {activeTab === "template" && (
                <div className="p-8 bg-slate-50/50 min-h-full animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {SAMPLE_TEMPLATES.map((t) => (
                            <div 
                                key={t.id}
                                onClick={() => handleSelectTemplate(t)}
                                className="group bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col relative"
                            >
                                {/* Preview Header */}
                                <div className="h-40 bg-[#EAF2FA] relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                                    <div className="scale-[0.45] origin-center opacity-90 group-hover:scale-50 group-hover:opacity-100 transition-all duration-500">
                                        <FlexRender json={t.content} />
                                    </div>
                                    <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300 flex items-center justify-center">
                                        <span className="bg-white text-indigo-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">Use Template</span>
                                    </div>
                                </div>
                                
                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          
          {activeTab === "scratch" ? (
              <button 
                onClick={() => { onCreate(name, desc, json); onClose(); }} 
                className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-black/20 active:scale-95 transition-all"
              >
                Create Message
              </button>
          ) : (
              <button 
                onClick={() => setActiveTab("scratch")} 
                className="px-6 py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed"
              >
                Select a template above
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateModal;