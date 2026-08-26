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

const OPEN_ACCESS_PLATFORMS = new Set(["Website", "GooglePlay"]);

export function isOpenAccessPlatform(platform: string): boolean {
  return OPEN_ACCESS_PLATFORMS.has(platform);
}

/** Device-local connection copy. Never claims server-side verification. */
export function connectionCopy(
  platform: Pick<PlatformCapability, "platform" | "status" | "statusText">,
): {
  statusLabel: string;
  actionLabel: string;
} {
  switch (platform.status) {
    case "pending":
      return { statusLabel: "Pending review", actionLabel: "View status" };
    case "rejected":
      return { statusLabel: "Failed", actionLabel: "Reconnect" };
    case "disabled":
      return { statusLabel: "Unavailable", actionLabel: "View status" };
    case "ready":
      if (
        isOpenAccessPlatform(platform.platform) ||
        platform.statusText === "Open access"
      ) {
        return { statusLabel: "Open access", actionLabel: "Ready" };
      }
      return { statusLabel: "Pending review", actionLabel: "View status" };
    default:
      return { statusLabel: "Not connected", actionLabel: "Connect" };
  }
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

function disconnected(platform: string, name = platform): PlatformCapability {
  return {
    platform,
    name,
    status: "unavailable",
    statusText: "Not connected",
    reason: `Connect ${name} to unlock matching tasks`,
    actionLabel: "Connect",
  };
}

const DEFAULT_PLATFORMS: Record<string, PlatformCapability> = {
  Instagram: disconnected("Instagram"),
  TikTok: disconnected("TikTok"),
  Facebook: disconnected("Facebook"),
  LinkedIn: disconnected("LinkedIn"),
  Telegram: disconnected("Telegram"),
  WhatsApp: disconnected("WhatsApp"),
  YouTube: disconnected("YouTube"),
  Threads: disconnected("Threads"),
  X: disconnected("X", "X"),
  Website: {
    platform: "Website",
    name: "Website",
    status: "ready",
    statusText: "Open access",
    reason: "No account connection required",
    actionLabel: "Ready",
  },
  GooglePlay: {
    platform: "GooglePlay",
    name: "Google Play",
    status: "ready",
    statusText: "Open access",
    reason: "No account connection required",
    actionLabel: "Ready",
  },
};


function normalizePlatforms(
  input: Record<string, PlatformCapability>,
): Record<string, PlatformCapability> {
  const next: Record<string, PlatformCapability> = {};
  for (const [key, value] of Object.entries(input)) {
    const openAccess =
      isOpenAccessPlatform(value.platform) || value.statusText === "Open access";
    if (value.status === "ready" && !openAccess) {
      next[key] = {
        ...value,
        status: "pending",
        statusText: "Pending review",
        reason: "Submitted on this device. Not verified by Zolanzo.",
        actionLabel: "View status",
      };
    } else {
      next[key] = value;
    }
  }
  return next;
}

const CapabilityContext = createContext<CapabilityContextType | undefined>(undefined);

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
  const [platforms, setPlatforms] =
    useState<Record<string, PlatformCapability>>(DEFAULT_PLATFORMS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("zolanzo_capabilities_v2");
    if (saved) {
      try {
        setPlatforms(
          normalizePlatforms(JSON.parse(saved) as Record<string, PlatformCapability>),
        );
      } catch {
        // Keep defaults when stored state is unreadable.
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("zolanzo_capabilities_v2", JSON.stringify(platforms));
  }, [platforms, hydrated]);

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
        status: "pending",
        statusText: "Submitted",
        reason: "Submitted on this device. Not verified by Zolanzo.",
        handle: handle.startsWith("@") ? handle : `@${handle}`,
        actionLabel: "View status",
      };

      return {
        ...prev,
        [platform]: updated,
      };
    });
  };

  const capabilities = useMemo<CapabilityItem[]>(() => {
    return Object.values(platforms).map((platform) => {
      const copy = connectionCopy(platform);
      return {
        id: platform.platform,
        label: platform.name,
        platform: platform.platform,
        status: platform.status,
        symbol: copy.statusLabel,
        reason: platform.reason,
      };
    });
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
        badgeColorClass: "bg-primary-subtle text-primary border-primary/30",
        buttonColorClass: "bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs",
      };
    }

    if (platformCap.status === "pending") {
      return {
        isAccessible: false,
        badgeText: "Pending review",
        status: "pending",
        reason: `${pName} was submitted on this device. It is not verified yet.`,
        platform,
        platformName: pName,
        actionLabel: "View status",
        badgeColorClass: "bg-warning/10 text-warning border-warning/25",
        buttonColorClass: "bg-warning hover:bg-warning/90 text-warning-foreground shadow-xs",
      };
    }

    if (platformCap.status === "rejected") {
      return {
        isAccessible: false,
        badgeText: "Failed",
        status: "rejected",
        reason: `${pName} connection failed. You can reconnect from Account Center.`,
        platform,
        platformName: pName,
        actionLabel: "Reconnect",
        badgeColorClass: "bg-danger/10 text-danger border-danger/25",
        buttonColorClass: "bg-danger hover:bg-danger/90 text-danger-foreground shadow-xs",
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
        badgeColorClass: "border-border bg-muted text-muted-foreground",
        buttonColorClass: "cursor-not-allowed bg-muted text-disabled",
      };
    }

    // Default: unavailable / Requires Connection
    return {
      isAccessible: false,
      badgeText: "Connection required",
      status: "unavailable",
      reason: `A ${pName} account is required to start this task.`,
      platform,
      platformName: pName,
      actionLabel: "Connect",
      badgeColorClass: "border-border bg-muted text-foreground",
      buttonColorClass: "bg-foreground hover:bg-foreground/90 text-background shadow-xs",
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
