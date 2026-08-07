"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";

export type CapabilityStatus = "ready" | "pending" | "unavailable" | "disabled" | "rejected";

export interface PlatformCapability {
  platform: string;
  name: string;
  status: CapabilityStatus;
  statusText: string;
  reason: string;
  handle?: string;
  actionLabel: string;
}

export interface CapabilityItem {
  id: string;
  label: string;
  platform: string;
  status: CapabilityStatus;
  symbol: string;
  reason: string;
}

export interface TaskReadinessResult {
  isAccessible: boolean;
  badgeText: string;
  status: CapabilityStatus;
  reason: string;
  platform: string;
  platformName: string;
  actionLabel: string;
  badgeColorClass: string;
  buttonColorClass: string;
}

interface CapabilityContextType {
  platforms: Record<string, PlatformCapability>;
  capabilities: CapabilityItem[];
  readinessPercentage: number;
  connectPlatform: (platform: string, handle: string) => void;
  getTaskAccess: (platform: string) => TaskReadinessResult;
  getReadinessByPlatform: (platform: string) => TaskReadinessResult;
}

const DEFAULT_PLATFORMS: Record<string, PlatformCapability> = {
  Instagram: { platform: "Instagram", name: "Instagram", status: "ready", statusText: "✓ Verified", reason: "Connected & Verified", handle: "@graceofficial", actionLabel: "Manage" },
  TikTok: { platform: "TikTok", name: "TikTok", status: "ready", statusText: "✓ Verified", reason: "Connected & Verified", handle: "@grace_tiktok", actionLabel: "Manage" },
  Facebook: { platform: "Facebook", name: "Facebook", status: "ready", statusText: "✓ Verified", reason: "Connected & Verified", handle: "grace.okafor", actionLabel: "Manage" },
  LinkedIn: { platform: "LinkedIn", name: "LinkedIn", status: "pending", statusText: "Pending Verification", reason: "Connect LinkedIn first to complete tasks", handle: "grace.linkedin", actionLabel: "View Status" },
  Telegram: { platform: "Telegram", name: "Telegram", status: "unavailable", statusText: "Connect Telegram", reason: "Connect Telegram account to unlock tasks", actionLabel: "Connect Telegram" },
  WhatsApp: { platform: "WhatsApp", name: "WhatsApp", status: "ready", statusText: "✓ Verified", reason: "Connected & Verified", handle: "+234 812 *** 4920", actionLabel: "Manage" },
  YouTube: { platform: "YouTube", name: "YouTube", status: "pending", statusText: "Pending Verification", reason: "Account verification in progress", handle: "@grace_yt", actionLabel: "View Status" },
  Threads: { platform: "Threads", name: "Threads", status: "ready", statusText: "✓ Verified", reason: "Connected & Verified", handle: "@grace_threads", actionLabel: "Manage" },
  X: { platform: "X", name: "X (Twitter)", status: "unavailable", statusText: "Connect X", reason: "Connect X to unlock tasks", actionLabel: "Connect X" },
  Website: { platform: "Website", name: "Website", status: "ready", statusText: "Open Access", reason: "Open Access", handle: "Web Browser", actionLabel: "Active" },
  GooglePlay: { platform: "GooglePlay", name: "Google Play", status: "ready", statusText: "Open Access", reason: "Open Access", handle: "Android Ready", actionLabel: "Active" },
};

const CapabilityContext = createContext<CapabilityContextType | undefined>(undefined);

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const [platforms, setPlatforms] = useState<Record<string, PlatformCapability>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zolanzo_user_capabilities");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_PLATFORMS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zolanzo_user_capabilities", JSON.stringify(platforms));
    }
  }, [platforms]);

  const connectPlatform = (platform: string, handle: string) => {
    setPlatforms((prev) => {
      const existing = prev[platform] || {
        platform,
        name: platform,
        status: "unavailable" as CapabilityStatus,
        statusText: "Not Connected",
        reason: "Not Connected",
        handle: "Not Connected",
        actionLabel: "Connect Account",
      };

      const updated: PlatformCapability = {
        ...existing,
        platform,
        name: existing.name || platform,
        status: "ready",
        statusText: "✓ Verified",
        reason: "Connected & Verified",
        handle: handle.startsWith("@") ? handle : `@${handle}`,
        actionLabel: "Manage",
      };

      return {
        ...prev,
        [platform]: updated,
      };
    });
  };

  const capabilities = useMemo<CapabilityItem[]>(() => {
    return [
      { id: "fb", label: "Facebook Tasks", platform: "Facebook", status: platforms.Facebook?.status || "ready", symbol: platforms.Facebook?.status === "ready" ? "✓" : platforms.Facebook?.status === "pending" ? "⏳" : "❌", reason: platforms.Facebook?.reason || "" },
      { id: "ig", label: "Instagram Tasks", platform: "Instagram", status: platforms.Instagram?.status || "ready", symbol: platforms.Instagram?.status === "ready" ? "✓" : platforms.Instagram?.status === "pending" ? "⏳" : "❌", reason: platforms.Instagram?.reason || "" },
      { id: "tt", label: "TikTok Tasks", platform: "TikTok", status: platforms.TikTok?.status || "ready", symbol: platforms.TikTok?.status === "ready" ? "✓" : platforms.TikTok?.status === "pending" ? "⏳" : "❌", reason: platforms.TikTok?.reason || "" },
      { id: "li", label: "LinkedIn Tasks", platform: "LinkedIn", status: platforms.LinkedIn?.status || "pending", symbol: platforms.LinkedIn?.status === "ready" ? "✓" : platforms.LinkedIn?.status === "pending" ? "⏳" : "❌", reason: platforms.LinkedIn?.reason || "" },
      { id: "tg", label: "Telegram Tasks", platform: "Telegram", status: platforms.Telegram?.status || "unavailable", symbol: platforms.Telegram?.status === "ready" ? "✓" : platforms.Telegram?.status === "pending" ? "⏳" : "❌", reason: platforms.Telegram?.reason || "" },
      { id: "web", label: "Website Tasks", platform: "Website", status: "ready", symbol: "✓", reason: "Open Access" },
      { id: "play", label: "Google Play Tasks", platform: "GooglePlay", status: "ready", symbol: "✓", reason: "Open Access" },
      { id: "downloads", label: "App Downloads", platform: "GooglePlay", status: "ready", symbol: "✓", reason: "Android Ready" },
      { id: "reviews", label: "Reviews & Ratings", platform: "Website", status: "ready", symbol: "✓", reason: "Trust Score Qualified" },
      { id: "surveys", label: "Surveys & Feedback", platform: "Website", status: "ready", symbol: "✓", reason: "Profile Qualified" },
      { id: "data", label: "Data Entry", platform: "Website", status: "ready", symbol: "✓", reason: "Basic Skills Verified" },
      { id: "ai", label: "AI Tasks (Future)", platform: "Website", status: "pending", symbol: "⏳", reason: "Unlocks at Level 5" },
    ];
  }, [platforms]);

  const readinessPercentage = useMemo(() => {
    const readyCount = capabilities.filter((c) => c.status === "ready").length;
    return Math.round((readyCount / capabilities.length) * 100);
  }, [capabilities]);

  const getTaskAccess = (platform: string): TaskReadinessResult => {
    const platformCap = platforms[platform];
    const pName = platformCap?.name || platform;

    if (!platformCap || platformCap.status === "ready") {
      return {
        isAccessible: true,
        badgeText: "Ready",
        status: "ready",
        reason: "Ready for task",
        platform,
        platformName: pName,
        actionLabel: "Start",
        badgeColorClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        buttonColorClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
      };
    }

    if (platformCap.status === "pending") {
      return {
        isAccessible: false,
        badgeText: "Pending Verification",
        status: "pending",
        reason: `${pName} verification is pending review`,
        platform,
        platformName: pName,
        actionLabel: "Pending",
        badgeColorClass: "bg-amber-50 text-amber-700 border-amber-200/60",
        buttonColorClass: "bg-amber-500 hover:bg-amber-600 text-white shadow-xs",
      };
    }

    if (platformCap.status === "rejected") {
      return {
        isAccessible: false,
        badgeText: "Verification Rejected",
        status: "rejected",
        reason: `${pName} proof was rejected. Re-connect account`,
        platform,
        platformName: pName,
        actionLabel: `Re-connect ${pName}`,
        badgeColorClass: "bg-red-50 text-red-700 border-red-200/60",
        buttonColorClass: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
      };
    }

    if (platformCap.status === "disabled") {
      return {
        isAccessible: false,
        badgeText: "Disabled",
        status: "disabled",
        reason: `${pName} integration is currently disabled`,
        platform,
        platformName: pName,
        actionLabel: "Unavailable",
        badgeColorClass: "bg-slate-100 text-slate-500 border-slate-200",
        buttonColorClass: "bg-slate-200 text-slate-400 cursor-not-allowed",
      };
    }

    // Default: unavailable / Requires Connection
    return {
      isAccessible: false,
      badgeText: `Connect ${pName}`,
      status: "unavailable",
      reason: `Connect ${pName} first`,
      platform,
      platformName: pName,
      actionLabel: `Connect ${pName}`,
      badgeColorClass: "bg-slate-100 text-slate-700 border-slate-200",
      buttonColorClass: "bg-slate-900 hover:bg-slate-800 text-white shadow-xs",
    };
  };

  return (
    <CapabilityContext.Provider
      value={{
        platforms,
        capabilities,
        readinessPercentage,
        connectPlatform,
        getTaskAccess,
        getReadinessByPlatform: getTaskAccess,
      }}
    >
      {children}
    </CapabilityContext.Provider>
  );
}

export function useCapabilities() {
  const context = useContext(CapabilityContext);
  if (!context) {
    throw new Error("useCapabilities must be used within a CapabilityProvider");
  }
  return context;
}
