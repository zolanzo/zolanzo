"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Upload01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useCapabilities, type TaskReadinessResult } from "@/lib/capabilities-service";

interface ConnectAccountSheetProps {
  platform: string;
  readiness: TaskReadinessResult;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectAccountSheet({
  platform,
  readiness,
  isOpen,
  onClose,
  onSuccess,
}: ConnectAccountSheetProps) {
  const { connectPlatform } = useCapabilities();
  const [username, setUsername] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsSubmitting(true);
    setTimeout(() => {
      connectPlatform(platform, username);
      setIsSubmitting(false);
      onSuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-floating animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <SocialBrandIcon platform={platform} size={22} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 leading-tight">Connect {readiness.platformName}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${readiness.badgeColorClass}`}>
                  {readiness.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {readiness.reason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              {readiness.platformName} Username / Handle
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={`@your_${platform.toLowerCase()}_handle`}
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Profile Link (Optional)
            </label>
            <input
              type="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder={`https://${platform.toLowerCase()}.com/your_profile`}
              className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Profile Screenshot Proof
            </label>
            <div
              onClick={() => setScreenshotUploaded(true)}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-center cursor-pointer transition-colors bg-slate-50/50"
            >
              {screenshotUploaded ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                  <span>Profile screenshot attached ✓</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1 text-slate-500">
                  <HugeiconsIcon icon={Upload01Icon} size={20} className="text-slate-400" />
                  <span className="font-semibold text-xs">Tap to upload verification screenshot</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!username || isSubmitting}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Verifying..." : `Verify & Start Task ⚡`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
