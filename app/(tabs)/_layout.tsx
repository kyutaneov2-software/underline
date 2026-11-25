import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing } from "react-native";
import { TabBar } from "../../src/components/TabBar";
import { useSettings } from "../../src/context/SettingsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { t } from "../../src/strings";

export default function TabsLayout() {
  const { settings } = useSettings();
  const { colors } = useTheme();

  // People who turn on Reduce Motion get an instant switch instead of the slide.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  // First launch: show the short intro before the app itself.
  if (!settings.introDone) return <Redirect href="/intro" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: reduceMotion ? "none" : "shift",
        // The screens slide toward the tab you picked while fading and settling in size.
        // progress is -1 for a screen to the left of the active one, 0 for the active one,
        // and 1 for a screen to the right.
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-64, 0, 64],
                }),
              },
              {
                scale: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0.96, 1, 0.96],
                }),
              },
            ],
          },
        }),
        transitionSpec: {
          animation: "timing",
          config: { duration: 300, easing: Easing.out(Easing.cubic) },
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.timer }} />
      <Tabs.Screen name="subjects" options={{ title: t.tabs.subjects }} />
      <Tabs.Screen name="week" options={{ title: t.tabs.week }} />
      <Tabs.Screen name="settings" options={{ title: t.tabs.settings }} />
    </Tabs>
  );
}
