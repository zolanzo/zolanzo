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
  { href: "/worker/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/worker/jobs", label: "Available Tasks", icon: ListTodo },
  { href: "/worker/wallet", label: "Wallet & Earnings", icon: Wallet },
];

const DEFAULT_EMPLOYER_NAV: SidebarNavItem[] = [
  { href: "/organization/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organization/campaigns", label: "Campaigns", icon: ListTodo },
  { href: "/organization/escrow", label: "Escrow & Billing", icon: Wallet },
  { href: "/organization/applicants", label: "Applicants", icon: Users },
];

const DEFAULT_ADMIN_NAV: SidebarNavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/campaigns", label: "Campaign Approvals", icon: ListTodo },
  { href: "/admin/payouts", label: "Payout Approvals", icon: Wallet },
  { href: "/admin/users", label: "Users & Organizations", icon: Users },
  { href: "/admin/settings", label: "Platform Settings", icon: Settings },
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
