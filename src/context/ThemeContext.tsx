import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { lightPalette, nightPalette, type Palette } from "../theme";
import { useSettings } from "./SettingsContext";

type ThemeValue = { colors: Palette; isDark: boolean };

const ThemeContext = createContext<ThemeValue>({
  colors: lightPalette,
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const system = useColorScheme();
  const isDark =
    settings.theme === "system"
      ? system === "dark"
      : settings.theme === "night";

  const value = useMemo<ThemeValue>(
    () => ({ colors: isDark ? nightPalette : lightPalette, isDark }),
    [isDark],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeValue => useContext(ThemeContext);
