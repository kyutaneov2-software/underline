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
import { iconFonts } from "../src/components/Icon";
import { ThemeRevealProvider } from "../src/components/ThemeReveal";
import { SettingsProvider } from "../src/context/SettingsContext";
import { SubjectsProvider } from "../src/context/SubjectsContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { TimerProvider } from "../src/context/TimerContext";
import { getDb } from "../src/db/database";
import { setupNotifications } from "../src/lib/notifications";
import { lightPalette } from "../src/theme";

// The app's screens. Rendered inside ThemeProvider so the background follows the theme.
function AppStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="intro"
        options={{ gestureEnabled: false, animation: "fade" }}
      />
      <Stack.Screen name="subject" options={{ presentation: "modal" }} />
      <Stack.Screen name="recap" options={{ presentation: "modal" }} />
      <Stack.Screen name="log" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

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
    ...iconFonts,
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
                  <AppStack />
                </Themed>
              </TimerProvider>
            </SubjectsProvider>
          </ThemeRevealProvider>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
