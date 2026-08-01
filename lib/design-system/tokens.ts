/**
 * ZOLANZO Design System Tokens
 * Centralized design tokens for colors, typography, spacing, radius, shadows, transitions, and layout bounds.
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: "#008744",
      hover: "#00753b",
      light: "rgba(0, 135, 68, 0.15)",
      border: "rgba(0, 135, 68, 0.4)",
    },
    background: {
      deep: "#04090B",
      surface: "#0A0F12",
      elevated: "#12181C",
      border: "rgba(255, 255, 255, 0.1)",
    },
    status: {
      success: { text: "#34D399", bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.2)" },
      warning: { text: "#FBBF24", bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.2)" },
      error: { text: "#F87171", bg: "rgba(248, 113, 113, 0.1)", border: "rgba(248, 113, 113, 0.2)" },
      info: { text: "#60A5FA", bg: "rgba(96, 165, 250, 0.1)", border: "rgba(96, 165, 250, 0.2)" },
      purple: { text: "#C084FC", bg: "rgba(192, 132, 252, 0.1)", border: "rgba(192, 132, 252, 0.2)" },
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
