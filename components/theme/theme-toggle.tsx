"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/utils";

type ThemeModeControlProps = {
  variant?: "compact" | "menu";
  className?: string;
};

export function ThemeModeControl({
  variant = "compact",
  className = "",
}: ThemeModeControlProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isMenu = variant === "menu";
  const isDark = resolvedTheme === "dark";

  const buttonClassName = cn(
    "focus-ring flex cursor-pointer touch-manipulation items-center border border-border bg-surface font-semibold text-foreground shadow-soft transition-colors hover:bg-hover",
    isMenu
      ? "h-11 min-h-11 w-full justify-between gap-3 rounded-xl px-3 text-[13px]"
      : "h-8 w-8 min-h-8 min-w-8 justify-center rounded-full p-0",
  );

  return (
    <div className={cn(isMenu ? "w-full" : "shrink-0", className)}>
      {isMenu ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Appearance
        </p>
      ) : null}

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={
          isDark ? "Dark theme. Switch to light." : "Light theme. Switch to dark."
        }
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        data-theme={resolvedTheme}
        suppressHydrationWarning
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleTheme();
        }}
        className={buttonClassName}
      >
        <HugeiconsIcon icon={isDark ? Moon02Icon : Sun01Icon} size={16} />
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
    </div>
  );
}
