"use client";

import { Bell, Menu, Search, User } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/utils";

export type TopbarProps = {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  themeToggle?: ReactNode;
  searchPlaceholder?: string;
  userMenu?: ReactNode;
  notifications?: ReactNode;
  title?: string;
  className?: string;
};

export function Topbar({
  onSidebarToggle,
  showSidebarToggle = true,
  themeToggle,
  searchPlaceholder = "Search…",
  userMenu,
  notifications,
  title,
  className,
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-topbar px-4 backdrop-blur-md sm:gap-4 sm:px-6",
        className,
      )}
    >
      {showSidebarToggle ? (
        <IconButton
          label="Toggle sidebar"
          variant="ghost"
          size="sm"
          className="shrink-0 lg:hidden"
          onClick={onSidebarToggle}
        >
          <Menu className="size-5" aria-hidden />
        </IconButton>
      ) : null}

      {title ? (
        <h1 className="hidden truncate text-h3 sm:block">{title}</h1>
      ) : null}

      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor="topbar-search">
          Search
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id="topbar-search"
          type="search"
          placeholder={searchPlaceholder}
          className="focus-ring h-10 w-full max-w-md rounded-lg border border-border bg-surface pl-10 text-small text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {notifications ?? (
          <IconButton label="Notifications" variant="ghost" size="sm">
            <Bell className="size-5" aria-hidden />
          </IconButton>
        )}

        {themeToggle}

        {userMenu ?? (
          <IconButton label="User menu" variant="outline" size="sm">
            <User className="size-5" aria-hidden />
          </IconButton>
        )}
      </div>
    </header>
  );
}
