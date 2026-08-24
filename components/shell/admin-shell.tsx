"use client";

import React from "react";
import { AppShell } from "@/components/shell/app-shell";

export function AdminShell({
  children,
  userName = "Admin",
}: {
  children: React.ReactNode;
  userName?: string;
}) {
  return (
    <AppShell userName={userName} maxWidth="full">
      {children}
    </AppShell>
  );
}
