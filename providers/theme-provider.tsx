"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Dark-first design system with OS respect on first visit.
 * User preference persists via localStorage (zolanzo-theme).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="zolanzo-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
