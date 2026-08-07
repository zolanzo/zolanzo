"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { CapabilityProvider } from "@/lib/capabilities-service";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <CapabilityProvider>
          <ToastProvider>{children}</ToastProvider>
        </CapabilityProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
