"use client";

import React from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopHeader } from "@/components/shell/top-header";
import { BottomNav } from "@/components/shell/bottom-nav";
import { PageContainer } from "@/components/shell/page-container";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  avatarUrl?: string | null;
  availableBalance?: string;
  maxWidth?: "default" | "full" | "narrow";
  userRole?: string | null;
}

export function AppShell({
  children,
  userName = "Account",
  avatarUrl = null,
  availableBalance,
  maxWidth = "default",
  userRole = null,
}: AppShellProps) {
  return (
    <div className="surface-shell flex min-h-screen font-sans selection:bg-primary selection:text-primary-foreground">
      <Sidebar userRole={userRole} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          userName={userName}
          avatarUrl={avatarUrl}
          availableBalance={availableBalance}
          userRole={userRole}
        />

        <main className="flex-1 overflow-y-auto">
          <PageContainer maxWidth={maxWidth}>{children}</PageContainer>
        </main>

        <BottomNav userRole={userRole} />
      </div>
    </div>
  );
}
