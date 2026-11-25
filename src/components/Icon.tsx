import Feather from "@expo/vector-icons/Feather";
import type { ComponentProps } from "react";
import { useTheme } from "../context/ThemeContext";

export type IconName = ComponentProps<typeof Feather>["name"];

// Thin line icons (Feather), in the theme's ink color unless told otherwise.
export function Icon({
  name,
  size = 20,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? colors.ink}
      accessible={false}
    />
  );
}

// Loaded once at startup so icons never flash empty.
export const iconFonts = Feather.font;
