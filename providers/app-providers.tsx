"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";

type AppProvidersProps = {
  children: ReactNode;
  nonce?: string;
};

export function AppProviders({ children, nonce }: AppProvidersProps) {
  return <ThemeProvider nonce={nonce}>{children}</ThemeProvider>;
}
