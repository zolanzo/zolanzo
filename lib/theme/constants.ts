export const THEME_STORAGE_KEY = "zolanzo-theme";

/** Timestamp (ms) when a manual Light/Dark override expires. */
export const THEME_OVERRIDE_UNTIL_KEY = "zolanzo-theme-until";

/** Same-tab signal so preference updates work even if storage.ts is duplicated by HMR. */
export const THEME_CHANGE_EVENT = "zolanzo-theme-change";

export const THEME_MODES = ["light", "dark"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = ThemeMode;

/** Inclusive local hour when automatic mode switches to light (6:00 AM). */
export const AUTO_LIGHT_START_HOUR = 6;

/** Exclusive local hour when automatic mode switches to dark (6:00 PM). */
export const AUTO_LIGHT_END_HOUR = 18;

/** Browser chrome / PWA theme-color for the resolved light surface. */
export const THEME_BROWSER_COLOR_LIGHT = "#F8FAFC";

/** Browser chrome / PWA theme-color for the resolved dark surface. */
export const THEME_BROWSER_COLOR_DARK = "#050608";
