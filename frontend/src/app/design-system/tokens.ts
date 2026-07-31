/**
 * SM Travels Design System — TypeScript token mirrors
 */
export const BRAND = {
  primary: "#1B75BC",
  primaryHover: "#14588F",
  secondary: "#4338CA",
  accent: "#0E7C66",
  brandMark: "#F15A24",
  sidebar: "#0B1F33",
  sidebarMid: "#17456B",
  erpBg: "#F7F8FA",
  // Legacy aliases used across the app
  navy: "#1B75BC",
  navyDk: "#14588F",
  gold: "#F15A24",
  emerald: "#0E7C66",
} as const;

export const ELEVATION = {
  0: "none",
  1: "var(--elevation-1)",
  2: "var(--elevation-2)",
  3: "var(--elevation-3)",
} as const;

export const RADIUS = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
} as const;
