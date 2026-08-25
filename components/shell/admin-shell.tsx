"use client";

import React from "react";
import { AppShell } from "@/components/shell/app-shell";

export function AdminShell({
  children,
  userName = "Admin",
  userRole = null,
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string | null;
}) {
  return (
    <AppShell userName={userName} maxWidth="full" userRole={userRole}>
      {children}
    </AppShell>
  );
}
