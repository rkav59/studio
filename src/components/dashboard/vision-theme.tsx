"use client";

import type { ReactNode } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";

export const visionColors = {
  background: "#F8F9FA",
  paper: "#FFFFFF",
  primary: "#0075FF",
  heading: "#2D3748",
  muted: "#718096",
  subtle: "#A0AEC0",
  border: "#E9EDF3",
  positive: "#1DAF75",
  warning: "#E8A53A",
  negative: "#E35B67",
} as const;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: visionColors.primary },
    background: { default: visionColors.background, paper: visionColors.paper },
    text: { primary: visionColors.heading, secondary: visionColors.muted },
    success: { main: visionColors.positive },
    warning: { main: visionColors.warning },
    error: { main: visionColors.negative },
    divider: visionColors.border,
  },
  typography: {
    fontFamily: "var(--font-app)",
    h4: { fontSize: "1.75rem", fontWeight: 750, letterSpacing: "-0.045em" },
    h5: { fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.025em" },
    h6: { fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 650 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: "0", borderRadius: 16, boxShadow: "0 7px 32px rgba(37, 64, 97, 0.055)" } },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, boxShadow: "none", minHeight: 44 } } },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiInputBase: { styleOverrides: { root: { minWidth: 0, fontSize: 16, "@media (min-width: 600px)": { fontSize: 14 } } } },
    MuiOutlinedInput: { styleOverrides: { root: { minHeight: 44, borderRadius: 10, backgroundColor: "#FFFFFF" } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiDialog: { styleOverrides: { paper: { margin: 16, maxWidth: "calc(100% - 32px)", maxHeight: "calc(100dvh - 32px)" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 650 } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: visionColors.border } } },
  },
});

export function VisionThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
