"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/utils";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type SidebarProps = {
  items: SidebarNavItem[];
  activePath?: string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
  className?: string;
  logoHref?: string;
};

export function Sidebar({
  items,
  activePath,
  collapsed: controlledCollapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  headerSlot,
  footerSlot,
  className,
  logoHref = "/dashboard",
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  return (
    <aside
      aria-label="Dashboard"
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/10",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <Link
          href={logoHref}
          className="focus-ring rounded-lg"
          aria-label="ZOLANZO dashboard home"
        >
          <BrandLogo
            asset="icon"
            width={collapsed ? 32 : 36}
            height={collapsed ? 32 : 36}
            priority
          />
        </Link>

        {!collapsed ? (
          <IconButton
            label="Collapse sidebar"
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground hover:bg-sidebar-foreground/10"
            onClick={toggleCollapsed}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </IconButton>
        ) : null}
      </div>

      {headerSlot ? (
        <div className={cn("border-b border-border/10 p-3", collapsed && "px-2")}>
          {headerSlot}
        </div>
      ) : null}

      <nav aria-label="Sidebar" className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePath === item.href ||
              (activePath?.startsWith(item.href) && item.href !== "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-small font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {!collapsed ? <span>{item.label}</span> : null}
                  {collapsed ? <span className="sr-only">{item.label}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "border-t border-border/10 p-3",
          collapsed ? "flex justify-center" : "space-y-3",
        )}
      >
        {collapsed ? (
          <IconButton
            label="Expand sidebar"
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground hover:bg-sidebar-foreground/10"
            onClick={toggleCollapsed}
          >
            <ChevronRight className="size-4" aria-hidden />
          </IconButton>
        ) : null}
        {footerSlot}
      </div>
    </aside>
  );
}
