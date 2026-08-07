/**
 * ZOLANZO Design System Tokens
 * Centralized design tokens for colors, typography, spacing, radius, shadows, transitions, and layout bounds.
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: "var(--primary)",
      hover: "var(--primary-hover)",
      light: "color-mix(in srgb, var(--primary) 15%, transparent)",
      border: "color-mix(in srgb, var(--primary) 40%, transparent)",
    },
    background: {
      deep: "var(--background)",
      surface: "var(--surface)",
      elevated: "var(--card)",
      border: "var(--border)",
    },
    status: {
      success: { text: "var(--success)", bg: "color-mix(in srgb, var(--success) 10%, transparent)", border: "color-mix(in srgb, var(--success) 24%, transparent)" },
      warning: { text: "var(--warning)", bg: "color-mix(in srgb, var(--warning) 10%, transparent)", border: "color-mix(in srgb, var(--warning) 24%, transparent)" },
      error: { text: "var(--danger)", bg: "color-mix(in srgb, var(--danger) 10%, transparent)", border: "color-mix(in srgb, var(--danger) 24%, transparent)" },
      info: { text: "var(--info)", bg: "color-mix(in srgb, var(--info) 10%, transparent)", border: "color-mix(in srgb, var(--info) 24%, transparent)" },
      purple: { text: "var(--accent)", bg: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "color-mix(in srgb, var(--accent) 24%, transparent)" },
    },
  },

  typography: {
    fontFamily: "Inter, var(--font-sans), sans-serif",
    sizes: {
      xs: "11px",
      sm: "13px",
      base: "15px",
      lg: "18px",
      xl: "22px",
      "2xl": "28px",
      "3xl": "36px",
    },
  },

  spacing: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
  },

  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    full: "9999px",
  },

  transitions: {
    fast: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    default: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  iconSizes: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  zIndex: {
    header: 30,
    drawer: 40,
    modal: 50,
    toast: 60,
  },

  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1440px",
  },
} as const;
