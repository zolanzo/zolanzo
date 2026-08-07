"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (name: string, city: string) => void;
}

export function EditProfileModal({ isOpen, onClose, onSaved }: EditProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("Lagos");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaved(fullName, city);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[420px] bg-[#0A0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white space-y-5">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">Edit Profile</h3>
          <p className="text-xs text-zinc-400">Update your public identity details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">City / Region</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            <span>Save Profile</span>
          </button>
        </form>

      </div>
    </div>
  );
}
