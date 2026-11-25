import type { Tabs } from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { fonts, type Palette } from "../theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";

// The tab bar's props, taken from expo-router itself so no other package is needed.
type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const INDICATOR_WIDTH = 20;

const ICONS: Record<string, IconName> = {
  index: "clock",
  subjects: "book-open",
  week: "bar-chart-2",
  settings: "sliders",
};

// One tab: its icon lifts and grows a little when it becomes the active one.
function TabIcon({
  name,
  focused,
  color,
  size,
}: {
  name: IconName;
  focused: boolean;
  color: string;
  size: number;
}) {
  const lift = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    lift.value = withSpring(focused ? 1 : 0, {
      damping: 14,
      stiffness: 260,
      mass: 0.7,
    });
  }, [focused, lift]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + lift.value * 0.14 },
      { translateY: -lift.value * 1.5 },
    ],
  }));
  return (
    <Animated.View style={style}>
      <Icon name={name} size={size} color={color} />
    </Animated.View>
  );
}

// The tab bar: icons with labels, and a short accent underline that slides to the active tab.
export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const landscape = winWidth > winHeight;
  const [width, setWidth] = useState(0);
  const placed = useRef(false);
  const x = useSharedValue(0);

  // The tabs sit between the left and right safe-area insets (the notch in landscape).
  const inner = Math.max(0, width - insets.left - insets.right);
  const tabWidth = inner / state.routes.length;

  useEffect(() => {
    if (width === 0) return;
    const target =
      insets.left + state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    if (!placed.current) {
      x.value = target; // first layout: no slide from the left edge
      placed.current = true;
    } else {
      x.value = withTiming(target, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [state.index, width, tabWidth, insets.left, x]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.indicator, indicator]} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const color = focused ? colors.ink : colors.muted;

        const onPress = () => {
          const event = emitter.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <PressableScale
            key={route.key}
            onPress={onPress}
            scaleTo={0.92}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={[
              styles.tab,
              landscape ? styles.tabLandscape : styles.tabPortrait,
            ]}
          >
            <TabIcon
              name={ICONS[route.name] ?? "circle"}
              focused={focused}
              color={color}
              size={landscape ? 18 : 21}
            />
            <Text style={[styles.label, { color }, focused && styles.labelOn]}>
              {label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: {
      flexDirection: "row",
      backgroundColor: c.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.line,
    },
    indicator: {
      position: "absolute",
      top: 0,
      left: 0,
      width: INDICATOR_WIDTH,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.accent,
    },
    tab: { flex: 1, alignItems: "center", justifyContent: "center" },
    tabPortrait: { height: 62, flexDirection: "column", gap: 4 },
    tabLandscape: { height: 44, flexDirection: "row", gap: 8 },
    label: { fontFamily: fonts.medium, fontSize: 12 },
    labelOn: { fontFamily: fonts.bold },
  });
