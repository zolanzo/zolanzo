"use client";

import React from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopHeader } from "@/components/shell/top-header";
import { BottomNav } from "@/components/shell/bottom-nav";
import { PageContainer } from "@/components/shell/page-container";

import { RealtimeDebugPanel } from "@/components/debug/realtime-debug-panel";
import { PerformanceDashboard } from "@/components/debug/performance-dashboard";
import { SecurityDashboard } from "@/components/debug/security-dashboard";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  avatarUrl?: string;
  maxWidth?: "default" | "full" | "narrow";
}

export function AppShell({
  children,
  userName = "ZOLANZO Member",
  avatarUrl = "/brand/lady1.png",
  maxWidth = "default",
}: AppShellProps) {
  return (
    <div className="surface-shell flex min-h-screen font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <TopHeader userName={userName} avatarUrl={avatarUrl} />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          <PageContainer maxWidth={maxWidth}>{children}</PageContainer>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Developer Debug Panels (Desktop Only) */}
      <div className="hidden lg:block">
        <RealtimeDebugPanel />
        <PerformanceDashboard />
        <SecurityDashboard />
      </div>
    </div>
  );
}
