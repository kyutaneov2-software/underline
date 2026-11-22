import { Tabs } from "expo-router";
import { useTheme } from "../../src/context/ThemeContext";
import { t } from "../../src/strings";
import { fonts } from "../../src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontSize: 14, fontFamily: fonts.semibold },
        tabBarIconStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.timer }} />
      <Tabs.Screen name="subjects" options={{ title: t.tabs.subjects }} />
      <Tabs.Screen name="week" options={{ title: t.tabs.week }} />
      <Tabs.Screen name="settings" options={{ title: t.tabs.settings }} />
    </Tabs>
  );
}
