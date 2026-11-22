import type { Tabs } from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { fonts, type Palette } from "../theme";

// The tab bar's props, taken from expo-router itself so no other package is needed.
type BottomTabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const INDICATOR_WIDTH = 20;
const BAR_HEIGHT = 56;

// The tab bar: plain labels with a short accent underline that slides to the active tab.
export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const placed = useRef(false);
  const x = useSharedValue(0);

  const tabWidth = width / state.routes.length;

  useEffect(() => {
    if (width === 0) return;
    const target = state.index * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    if (!placed.current) {
      x.value = target; // first layout: no slide from the left edge
      placed.current = true;
    } else {
      x.value = withTiming(target, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [state.index, width, tabWidth, x]);

  const indicator = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={[styles.root, { paddingBottom: insets.bottom }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.indicator, indicator]} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;

        const onPress = () => {
          const event = emitter.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.tab}
          >
            <Text style={[styles.label, focused && styles.labelOn]}>
              {label}
            </Text>
          </Pressable>
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
      height: 2,
      borderRadius: 1,
      backgroundColor: c.accent,
    },
    tab: {
      flex: 1,
      height: BAR_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    labelOn: { color: c.ink, fontFamily: fonts.semibold },
  });
