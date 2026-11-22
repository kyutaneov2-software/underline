// Design tokens from the approved mockups: Light and Night palettes, one accent.
export type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  onAccent: string;
  danger: string;
};

export const lightPalette: Palette = {
  bg: "#F6F7F9",
  surface: "#FFFFFF",
  ink: "#0E1116",
  muted: "#6B7280",
  line: "#E4E7EC",
  accent: "#3347FF",
  onAccent: "#FFFFFF",
  danger: "#B5483A",
};

export const nightPalette: Palette = {
  bg: "#0B0D12",
  surface: "#141821",
  ink: "#F2F4F8",
  muted: "#9AA3B2",
  line: "#232937",
  accent: "#7C8BFF",
  onAccent: "#0B0D12",
  danger: "#F0907F",
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };

// React Native picks a font file by family name, so each weight is its own name.
export const fonts = {
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  semibold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
} as const;
