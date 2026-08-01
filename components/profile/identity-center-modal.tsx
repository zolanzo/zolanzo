"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Shield01Icon,
  CheckmarkBadge01Icon,
  File01Icon,
  SmartPhone01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { FileUploader } from "@/components/ui/file-uploader";

interface IdentityCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IdentityCenterModal({ isOpen, onClose }: IdentityCenterModalProps) {
  const [nin, setNin] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitNIN = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[520px] bg-[#0A0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white space-y-5 max-h-[90vh] overflow-y-auto">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <HugeiconsIcon icon={Shield01Icon} size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Identity Verification Center</h3>
          <p className="text-xs text-zinc-400">Verify your identity to unlock higher payout limits and premium opportunities.</p>
        </div>

        {/* Verification Status Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Mail01Icon} size={16} className="text-emerald-400" />
              <span className="font-bold text-white">Email Address</span>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={SmartPhone01Icon} size={16} className="text-emerald-400" />
              <span className="font-bold text-white">Phone OTP Verification</span>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={File01Icon} size={16} className="text-amber-400" />
              <span className="font-bold text-white">National Identity Number (NIN)</span>
            </div>
            <span className="text-amber-400 font-bold">Action Required</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitNIN} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">11-Digit NIN Number</label>
            <input
              type="text"
              required
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="12345678901"
              className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-base font-bold font-mono focus:outline-none"
            />
          </div>

          <FileUploader label="Upload Government ID Copy (NIN Slip / Drivers License / Voter Card)" />

          {submitted && (
            <p className="text-xs text-emerald-400 font-bold text-center">
              Identity documents submitted for NIMC verification!
            </p>
          )}

          <button
            type="submit"
            disabled={nin.length !== 11}
            className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-md"
          >
            Submit Identity Verification
          </button>
        </form>

      </div>
    </div>
  );
}
