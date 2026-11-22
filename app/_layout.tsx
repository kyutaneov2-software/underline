import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeRevealProvider } from "../src/components/ThemeReveal";
import { SettingsProvider } from "../src/context/SettingsContext";
import { SubjectsProvider } from "../src/context/SubjectsContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { TimerProvider } from "../src/context/TimerContext";
import { getDb } from "../src/db/database";
import { setupNotifications } from "../src/lib/notifications";
import { lightPalette } from "../src/theme";

// Rendered inside ThemeProvider so the status bar follows the theme.
function Themed({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    getDb().then(() => setDbReady(true));
    setupNotifications().catch(() => {});
  }, []);

  if (!dbReady || !fontsLoaded)
    return <View style={{ flex: 1, backgroundColor: lightPalette.bg }} />;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <ThemeRevealProvider>
            <SubjectsProvider>
              <TimerProvider>
                <Themed>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="subject"
                      options={{ presentation: "modal" }}
                    />
                    <Stack.Screen
                      name="recap"
                      options={{ presentation: "modal" }}
                    />
                    <Stack.Screen name="log" />
                  </Stack>
                </Themed>
              </TimerProvider>
            </SubjectsProvider>
          </ThemeRevealProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
