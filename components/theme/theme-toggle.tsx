"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient) {
    return <div className={`h-9 w-9 rounded-full bg-muted ${className}`} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`focus-ring flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-soft transition-all duration-200 hover:scale-105 hover:text-foreground active:scale-95 ${className}`}
      aria-label="Toggle Theme"
    >
      <HugeiconsIcon
        icon={isDark ? Sun01Icon : Moon02Icon}
        size={18}
        className={isDark ? "text-warning" : "text-primary"}
      />
    </button>
  );
}
