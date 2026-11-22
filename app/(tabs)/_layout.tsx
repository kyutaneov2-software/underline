import { Redirect, Tabs } from "expo-router";
import { TabBar } from "../../src/components/TabBar";
import { useSettings } from "../../src/context/SettingsContext";
import { t } from "../../src/strings";

export default function TabsLayout() {
  const { settings } = useSettings();

  // First launch: show the short intro before the app itself.
  if (!settings.introDone) return <Redirect href="../intro" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.timer }} />
      <Tabs.Screen name="subjects" options={{ title: t.tabs.subjects }} />
      <Tabs.Screen name="week" options={{ title: t.tabs.week }} />
      <Tabs.Screen name="settings" options={{ title: t.tabs.settings }} />
    </Tabs>
  );
}
