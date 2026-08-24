import { applyResolvedTheme } from "@/lib/theme/apply-theme";
import {
  nextScheduleBoundary,
  resolveEffectiveTheme,
  resolveScheduledTheme,
} from "@/lib/theme/schedule";
import {
  THEME_CHANGE_EVENT,
  THEME_OVERRIDE_UNTIL_KEY,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme/constants";

export function parseThemeMode(value: string | null | undefined): ThemeMode | null {
  if (value === "light" || value === "dark") {
    return value;
  }
  return null;
}

export function readStoredTheme(): ThemeMode | null {
  try {
    return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function readOverrideUntil(): number | null {
  try {
    const raw = window.localStorage.getItem(THEME_OVERRIDE_UNTIL_KEY);
    if (!raw) return null;
    const until = Number.parseInt(raw, 10);
    return Number.isFinite(until) && until > 0 ? until : null;
  } catch {
    return null;
  }
}

export function getResolvedThemeSnapshot(): ResolvedTheme {
  return resolveEffectiveTheme(readStoredTheme(), readOverrideUntil());
}

function persistResolvedCookie(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_STORAGE_KEY}=${resolved}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function emitThemeChange(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeThemeChange(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === THEME_STORAGE_KEY ||
      event.key === THEME_OVERRIDE_UNTIL_KEY ||
      event.key === null
    ) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

/** Manual Light/Dark choice. Lasts until the next 6:00 AM or 6:00 PM boundary. */
export function persistManualTheme(mode: ThemeMode): void {
  const until = nextScheduleBoundary().getTime();
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    window.localStorage.setItem(THEME_OVERRIDE_UNTIL_KEY, String(until));
  } catch {
    // Private mode or blocked storage must not break theming.
  }
  persistResolvedCookie(mode);
  applyResolvedTheme(mode);
  emitThemeChange();
}

export function toggleTheme(): void {
  persistManualTheme(getResolvedThemeSnapshot() === "light" ? "dark" : "light");
}

/** Drop a manual override and return to the local-time schedule. */
export function applyScheduledTheme(): void {
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    window.localStorage.removeItem(THEME_OVERRIDE_UNTIL_KEY);
  } catch {
    // Private mode or blocked storage must not break theming.
  }
  const resolved = resolveScheduledTheme();
  persistResolvedCookie(resolved);
  applyResolvedTheme(resolved);
  emitThemeChange();
}

export function expireOverrideIfNeeded(): void {
  const until = readOverrideUntil();
  if (until != null && Date.now() >= until) {
    applyScheduledTheme();
    return;
  }
  applyResolvedTheme(getResolvedThemeSnapshot());
  emitThemeChange();
}
