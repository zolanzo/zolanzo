"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type ResolvedTheme, type ThemeMode } from "@/lib/theme/constants";
import { msUntilNextScheduleBoundary } from "@/lib/theme/schedule";
import {
  applyScheduledTheme,
  expireOverrideIfNeeded,
  getResolvedThemeSnapshot,
  persistManualTheme,
  subscribeThemeChange,
} from "@/lib/theme/storage";

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  ssrPreference?: ThemeMode | null;
};

function ssrResolved(ssrPreference: ThemeMode | null | undefined): ResolvedTheme {
  return ssrPreference === "dark" || ssrPreference === "light"
    ? ssrPreference
    : "light";
}

export function ThemeProvider({
  children,
  ssrPreference = "light",
}: ThemeProviderProps) {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    ssrResolved(ssrPreference),
  );

  useLayoutEffect(() => {
    const sync = () => setResolvedTheme(getResolvedThemeSnapshot());
    const unsubscribe = subscribeThemeChange(sync);
    expireOverrideIfNeeded();
    sync();
    return unsubscribe;
  }, []);

  useEffect(() => {
    let timeoutId = 0;
    const arm = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        applyScheduledTheme();
        arm();
      }, msUntilNextScheduleBoundary());
    };

    arm();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        expireOverrideIfNeeded();
        arm();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    persistManualTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    persistManualTheme(getResolvedThemeSnapshot() === "light" ? "dark" : "light");
  }, []);

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [resolvedTheme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
