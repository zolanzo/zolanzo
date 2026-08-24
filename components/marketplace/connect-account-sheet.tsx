"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
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

  if (!isOpen) return null;

  const isPending = readiness.status === "pending";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    connectPlatform(platform, username.trim());
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-account-title"
        className="bg-card rounded-t-2xl sm:rounded-2xl max-w-md w-full p-4 space-y-3 shadow-floating max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <SocialBrandIcon platform={platform} size={24} />
            <h3 id="connect-account-title" className="text-sm font-black text-foreground truncate">
              {isPending ? readiness.platformName : `Connect ${readiness.platformName}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-foreground min-h-11 min-w-11"
            aria-label="Close"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {isPending ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-warning">Pending review</p>
            <p className="text-xs text-foreground leading-snug">
              Submitted on this device. Zolanzo has not verified this account.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-muted text-foreground text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <p className="text-foreground leading-snug">
              Submit a handle to save it on this device. This is not a live verification.
            </p>
            <div>
              <label htmlFor="connect-handle" className="font-bold text-foreground block mb-1">
                Username
              </label>
              <input
                id="connect-handle"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`@your_${platform.toLowerCase()}_handle`}
                className="w-full h-11 px-3 rounded-xl border border-border text-xs font-bold text-foreground"
              />
            </div>
            <div>
              <label htmlFor="connect-url" className="font-bold text-foreground block mb-1">
                Profile link (optional)
              </label>
              <input
                id="connect-url"
                type="url"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://"
                className="w-full h-11 px-3 rounded-xl border border-border text-xs font-medium text-foreground"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl bg-muted text-foreground text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!username.trim()}
                className="flex-1 h-11 rounded-xl bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-xs font-bold"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
