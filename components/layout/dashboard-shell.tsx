"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Wallet,
  Settings,
  Plus,
} from "lucide-react";
import { Sidebar, type SidebarNavItem } from "@/components/navigation/sidebar";
import { Topbar } from "@/components/navigation/topbar";
import { FloatingActionButton } from "@/components/navigation/floating-action-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/utils";

type DashboardShellContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

const DashboardShellContext =
  createContext<DashboardShellContextValue | null>(null);

export function useDashboardShell(): DashboardShellContextValue {
  const ctx = useContext(DashboardShellContext);
  if (!ctx) {
    throw new Error("useDashboardShell must be used within DashboardShell");
  }
  return ctx;
}

const DEFAULT_NAV: SidebarNavItem[] = [
  { href: "/templates/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/templates/list", label: "Work", icon: ListTodo },
  { href: "/templates/detail", label: "Workforce", icon: Users },
  { href: "/templates/settings", label: "Billing", icon: Wallet },
  { href: "/templates/settings", label: "Settings", icon: Settings },
];

export type DashboardShellProps = {
  children: ReactNode;
  title?: string;
  navItems?: SidebarNavItem[];
  activePath?: string;
  className?: string;
  showFab?: boolean;
};

/**
 * Enterprise dashboard shell — desktop collapsible sidebar,
 * tablet/mobile drawer, sticky topbar, theme toggle, placeholders.
 */
export function DashboardShell({
  children,
  title = "Dashboard",
  navItems = DEFAULT_NAV,
  activePath = "/templates/dashboard",
  className,
  showFab = true,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      toggleSidebarCollapsed,
      openMobileSidebar: () => setMobileOpen(true),
      closeMobileSidebar: () => setMobileOpen(false),
    }),
    [sidebarCollapsed, toggleSidebarCollapsed],
  );

  return (
    <DashboardShellContext.Provider value={value}>
      <div
        className={cn(
          "bg-background text-foreground flex min-h-dvh w-full",
          className,
        )}
      >
        <a
          href="#main-content"
          className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        <div className="sticky top-0 hidden h-dvh lg:block">
          <Sidebar
            items={navItems}
            activePath={activePath}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          side="left"
          title="Navigation"
          className="bg-sidebar p-0 lg:hidden"
        >
          <Sidebar
            items={navItems}
            activePath={activePath}
            collapsed={false}
            className="h-full w-full border-0"
          />
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={title}
            themeToggle={<ThemeToggle />}
            onSidebarToggle={() => setMobileOpen(true)}
            showSidebarToggle
          />
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8"
          >
            {children}
          </main>
        </div>

        {showFab ? (
          <FloatingActionButton label="Quick actions" icon={Plus} />
        ) : null}
      </div>
    </DashboardShellContext.Provider>
  );
}
