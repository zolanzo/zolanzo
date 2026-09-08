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
import { Drawer } from "@/components/ui/drawer";
import { ThemeModeControl } from "@/components/theme/theme-toggle";

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

export type DashboardShellProps = {
  children: ReactNode;
  title?: string;
  role?: "worker" | "employer" | "admin";
  activePath?: string;
  navItems?: SidebarNavItem[];
  showFab?: boolean;
};

const DEFAULT_WORKER_NAV: SidebarNavItem[] = [
  { href: "/earner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Find Work", icon: ListTodo },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

const DEFAULT_EMPLOYER_NAV: SidebarNavItem[] = [
  { href: "/hirer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hirer/opportunities", label: "Campaigns", icon: ListTodo },
  { href: "/hirer/applications", label: "Review", icon: Users },
  { href: "/hirer/wallet", label: "Wallet", icon: Wallet },
];

const DEFAULT_ADMIN_NAV: SidebarNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/lex/staff", label: "Staff", icon: ListTodo },
  { href: "/lex/auth", label: "Admin", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  children,
  title = "Dashboard",
  role = "worker",
  activePath,
  navItems: customNavItems,
  showFab = true,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebarCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const navItems = useMemo(() => {
    if (customNavItems) return customNavItems;
    if (role === "admin") return DEFAULT_ADMIN_NAV;
    if (role === "employer") return DEFAULT_EMPLOYER_NAV;
    return DEFAULT_WORKER_NAV;
  }, [customNavItems, role]);

  const contextValue = useMemo<DashboardShellContextValue>(
    () => ({
      sidebarCollapsed: collapsed,
      toggleSidebarCollapsed,
      openMobileSidebar,
      closeMobileSidebar,
    }),
    [collapsed, toggleSidebarCollapsed, openMobileSidebar, closeMobileSidebar],
  );

  return (
    <DashboardShellContext.Provider value={contextValue}>
      <div className="bg-background text-foreground flex min-h-dvh">
        <Sidebar
          items={navItems}
          activePath={activePath}
          collapsed={collapsed}
          onCollapsedChange={toggleSidebarCollapsed}
          className="hidden md:flex"
        />

        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          title="Navigation"
          side="left"
        >
          <div className="flex flex-col gap-4">
            <Sidebar
              items={navItems}
              activePath={activePath}
              collapsed={false}
              className="h-full w-full border-0"
            />
          </div>
        </Drawer>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={title}
            onSidebarToggle={() => setMobileOpen(true)}
            showSidebarToggle
            themeToggle={<ThemeModeControl variant="compact" />}
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
