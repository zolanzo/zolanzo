/**
 * ZOLANZO design tokens — single source of truth for TS consumers.
 * CSS mirrors live in styles/tokens.css and app/globals.css @theme.
 */

export const COLOR = {
  darkBackground: "#050608",
  darkSurface: "#0B0F14",
  darkCard: "#131922",
  lightBackground: "#F6F8FB",
  lightSurface: "#FBFDFF",
  lightCard: "#FFFFFF",
  navy: "#071B34",
  primary: "#00B35A",
  primaryHover: "#00C864",
  gold: "#D9B15B",
  success: "#00B35A",
  warning: "#F59E0B",
  danger: "#FF5A5F",
  borderDark: "#242D3D",
  borderLight: "rgba(0,0,0,0.08)",
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
  soft: "0 1px 2px rgba(8,19,32,0.06), 0 1px 3px rgba(8,19,32,0.04)",
  medium: "0 4px 12px rgba(8,19,32,0.08), 0 2px 4px rgba(8,19,32,0.04)",
  floating: "0 12px 32px rgba(8,19,32,0.14), 0 4px 8px rgba(8,19,32,0.06)",
  dialog: "0 24px 48px rgba(8,19,32,0.22), 0 8px 16px rgba(8,19,32,0.1)",
  hero: "0 32px 64px rgba(8,19,32,0.28), 0 12px 24px rgba(22,198,198,0.08)",
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
