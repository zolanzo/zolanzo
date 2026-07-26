import type { ReactNode } from "react";
import {
  DashboardShell,
  type DashboardShellProps,
} from "@/components/layout/dashboard-shell";

export type DashboardLayoutProps = DashboardShellProps;

/**
 * App Router–friendly alias for the dashboard shell.
 */
export function DashboardLayout(props: DashboardLayoutProps) {
  return <DashboardShell {...props} />;
}

/** Re-export for convenience */
export type { ReactNode };
