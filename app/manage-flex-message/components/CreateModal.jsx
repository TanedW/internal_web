"use client";
import React, { useState } from "react";
import { X } from "lucide-react";

const CreateModal = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [json, setJson] = useState("{\n  \n}");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-[500px]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Create New JSON Item</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Name</label>
            <input 
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
              placeholder="Enter item name"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Description</label>
            <input 
              className="w-full p-2 border rounded focus:outline-none focus:border-black"
              placeholder="Enter description"
              value={desc} onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">JSON Content</label>
            <textarea 
              className="w-full h-32 p-2 border rounded font-mono text-sm focus:outline-none focus:border-black"
              value={json} onChange={e => setJson(e.target.value)}
            />
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button 
            onClick={() => { onCreate(name, desc, json); onClose(); }} 
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateModal;