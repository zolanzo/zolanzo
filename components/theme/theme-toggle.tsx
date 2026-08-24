"use client";

import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/utils";

const subscribeToNothing = () => () => undefined;
const clientMounted = () => true;
const serverNotMounted = () => false;

type ThemeModeControlProps = {
  variant?: "compact" | "menu";
  className?: string;
};

export function ThemeModeControl({
  variant = "compact",
  className = "",
}: ThemeModeControlProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    clientMounted,
    serverNotMounted,
  );
  const isMenu = variant === "menu";
  const isDark = resolvedTheme === "dark";

  const buttonClassName = cn(
    "focus-ring flex cursor-pointer touch-manipulation items-center border border-border bg-surface font-semibold text-foreground shadow-soft transition-colors hover:bg-hover",
    isMenu
      ? "h-11 min-h-11 w-full justify-between gap-3 rounded-xl px-3 text-[13px]"
      : "h-8 min-h-8 justify-center gap-1.5 rounded-full px-2.5 text-[11px]",
  );

  return (
    <div className={cn(isMenu ? "w-full" : "shrink-0", className)}>
      {isMenu ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Appearance
        </p>
      ) : null}

      {mounted ? (
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label={
            isDark ? "Dark theme. Switch to light." : "Light theme. Switch to dark."
          }
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
          data-theme={resolvedTheme}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleTheme();
          }}
          className={buttonClassName}
        >
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={isDark ? Moon02Icon : Sun01Icon} size={isMenu ? 16 : 14} />
            <span>{isDark ? "Dark" : "Light"}</span>
          </span>
          {isMenu ? (
            <span
              aria-hidden
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                isDark ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-primary-foreground shadow-sm transition-transform",
                  isDark && "translate-x-4",
                )}
              />
            </span>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={false}
          aria-label="Theme"
          disabled
          className={buttonClassName}
        >
          <span className="flex items-center gap-1.5">
            <span className={isMenu ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
            <span className="invisible">Light</span>
          </span>
          {isMenu ? <span aria-hidden className="h-5 w-9" /> : null}
        </button>
      )}
    </div>
  );
}
