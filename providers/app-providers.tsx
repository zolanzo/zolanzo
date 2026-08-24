"use client";

import type { ReactNode } from "react";
import type { ThemeMode } from "@/lib/theme/constants";
import { ThemeProvider } from "@/providers/theme-provider";

type AppProvidersProps = {
  children: ReactNode;
  ssrPreference?: ThemeMode | null;
};

export function AppProviders({
  children,
  ssrPreference,
}: AppProvidersProps) {
  return (
    <ThemeProvider ssrPreference={ssrPreference}>{children}</ThemeProvider>
  );
}
