"use client";

import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Shield,
  ListChecks,
  Activity,
  ScrollText,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { SidebarNavItem } from "@/components/navigation/sidebar";

const ADMIN_NAV: SidebarNavItem[] = [
  { href: "/admin", label: "Command Center", icon: LayoutDashboard },
  { href: "/admin", label: "Queues", icon: ListChecks },
  { href: "/admin", label: "Audit", icon: ScrollText },
  { href: "/admin", label: "Moderation", icon: Shield },
  { href: "/admin", label: "Health", icon: Activity },
];

export type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
};

/**
 * Admin layout — Operations Platform nav taxonomy.
 */
export function AdminLayout({
  children,
  title = "Operations",
}: AdminLayoutProps) {
  return (
    <DashboardShell title={title} navItems={ADMIN_NAV} activePath="/admin">
      {children}
    </DashboardShell>
  );
}
