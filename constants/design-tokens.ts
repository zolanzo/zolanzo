/**
 * ZOLANZO design tokens — single source of truth for TS consumers.
 * CSS mirrors live in styles/tokens.css and app/globals.css @theme.
 */

export const COLOR = {
  darkBackground: "#050608",
  darkSurface: "#0B0F14",
  darkCard: "#131922",
  lightBackground: "#F8FAFC",
  lightSurface: "#FFFFFF",
  lightCard: "#FFFFFF",
  navy: "#0F172A",
  primary: "#059669",
  primaryHover: "#047857",
  gold: "#D97706",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  borderDark: "#242D3D",
  borderLight: "#E2E8F0",
} as const;

/** 8-point spacing scale (px) */
export const SPACE = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 40,
  10: 48,
  11: 56,
  12: 64,
  14: 80,
  16: 96,
  20: 128,
} as const;

export const RADIUS = {
  none: "0",
  sm: "0.375rem", // 6
  md: "0.5rem", // 8
  lg: "0.75rem", // 12
  xl: "1rem", // 16
  "2xl": "1.25rem", // 20
  pill: "9999px",
} as const;

export const SHADOW = {
  soft: "0 2px 8px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
  medium: "0 4px 16px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.03)",
  floating: "0 12px 32px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.04)",
  dialog: "0 24px 48px rgba(15, 23, 42, 0.12), 0 8px 16px rgba(15, 23, 42, 0.06)",
  hero: "0 20px 40px rgba(5, 150, 105, 0.15)",
} as const;

export const TYPE = {
  display: {
    size: "3.5rem",
    lineHeight: "1.1",
    weight: 800,
    tracking: "-0.03em",
  },
  h1: { size: "2.5rem", lineHeight: "1.15", weight: 700, tracking: "-0.025em" },
  h2: { size: "2rem", lineHeight: "1.2", weight: 700, tracking: "-0.02em" },
  h3: { size: "1.5rem", lineHeight: "1.3", weight: 600, tracking: "-0.015em" },
  bodyLarge: {
    size: "1.125rem",
    lineHeight: "1.6",
    weight: 400,
    tracking: "0",
  },
  body: { size: "1rem", lineHeight: "1.6", weight: 400, tracking: "0" },
  small: { size: "0.875rem", lineHeight: "1.5", weight: 400, tracking: "0" },
  caption: {
    size: "0.75rem",
    lineHeight: "1.4",
    weight: 500,
    tracking: "0.02em",
  },
  button: {
    size: "0.875rem",
    lineHeight: "1",
    weight: 600,
    tracking: "0.01em",
  },
} as const;

export const BREAKPOINTS = {
  xs: 320,
  sm: 375,
  smd: 390,
  mdPhone: 414,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  "3xl": 1920,
} as const;

export const Z_INDEX = {
  base: 0,
  sticky: 40,
  dropdown: 50,
  overlay: 60,
  modal: 70,
  toast: 80,
  tooltip: 90,
} as const;

export const MOTION = {
  fast: 0.15,
  base: 0.22,
  slow: 0.35,
  spring: { type: "spring" as const, stiffness: 420, damping: 32 },
};
