import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { captureRef } from "react-native-view-shot";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import type { ThemeChoice } from "../types";

const REVEAL_MS = 650;
const FADE_MS = 350;

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

type Overlay = {
  oldUri: string;
  newUri: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
};

type RevealApi = {
  setTheme: (next: ThemeChoice, pageX: number, pageY: number) => Promise<void>;
};
const RevealContext = createContext<RevealApi>({ setTheme: async () => {} });

// setTheme('night', x, y) switches the theme with the reveal growing from the touch point.
// How the switch works: take a picture of the current screen and lay it over everything,
// switch the theme underneath, take a picture of the new look, then grow a circle of that
// picture from the touch point until it covers the old one. If anything fails, the theme
// still switches (instantly, or with a short fade).
export function ThemeRevealProvider({ children }: { children: ReactNode }) {
  const { update } = useSettings();
  const { isDark } = useTheme();
  const systemDark = useColorScheme() === "dark";

  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const size = useRef({ width: 0, height: 0 });
  const busy = useRef(false);
  const oldLoaded = useRef<(() => void) | null>(null);
  const newLoaded = useRef<(() => void) | null>(null);

  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const radius = useSharedValue(0);
  const fade = useSharedValue(1);

  const setTheme = useCallback(
    async (next: ThemeChoice, pageX: number, pageY: number) => {
      // If the choice doesn't change how the app looks (for example System on a light phone
      // while the app is already light), just save it without the animation.
      const targetDark = next === "system" ? systemDark : next === "night";
      if (targetDark === isDark) {
        update({ theme: next });
        return;
      }
      if (busy.current) return;
      busy.current = true;
      try {
        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        const { width, height } = size.current;
        if (reduceMotion || !rootRef.current || width === 0) {
          update({ theme: next });
          return;
        }

        const origin = await new Promise<{ x: number; y: number }>((resolve) =>
          rootRef.current
            ? rootRef.current.measureInWindow((x, y) => resolve({ x, y }))
            : resolve({ x: 0, y: 0 }),
        );
        const x = pageX - origin.x;
        const y = pageY - origin.y;

        let oldUri: string;
        try {
          oldUri = await captureRef(rootRef, {
            format: "jpg",
            quality: 0.95,
            result: "tmpfile",
          });
        } catch {
          update({ theme: next });
          return;
        }

        radius.value = 0;
        fade.value = 1;
        const oldReady = new Promise<void>((resolve) => {
          oldLoaded.current = resolve;
        });
        setOverlay({ oldUri, newUri: null, x, y, w: width, h: height });
        await Promise.race([oldReady, delay(500)]);

        update({ theme: next });
        await nextFrame();
        await delay(80);

        let newUri: string | null = null;
        try {
          newUri = await captureRef(rootRef, {
            format: "jpg",
            quality: 0.95,
            result: "tmpfile",
          });
        } catch {
          newUri = null;
        }

        if (newUri) {
          const newReady = new Promise<void>((resolve) => {
            newLoaded.current = resolve;
          });
          setOverlay((o) => (o ? { ...o, newUri } : o));
          await Promise.race([newReady, delay(500)]);
          const maxR = Math.hypot(
            Math.max(x, width - x),
            Math.max(y, height - y),
          );
          radius.value = withTiming(maxR, {
            duration: REVEAL_MS,
            easing: Easing.out(Easing.cubic),
          });
          await delay(REVEAL_MS + 80);
        } else {
          fade.value = withTiming(0, { duration: FADE_MS });
          await delay(FADE_MS + 60);
        }
      } finally {
        setOverlay(null);
        busy.current = false;
      }
    },
    [isDark, systemDark, update, radius, fade],
  );

  const api = useMemo(() => ({ setTheme }), [setTheme]);

  return (
    <RevealContext.Provider value={api}>
      <View style={styles.fill}>
        <View
          ref={rootRef}
          collapsable={false}
          style={styles.fill}
          onLayout={(e) => {
            size.current = {
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            };
          }}
        >
          {children}
        </View>
        {overlay ? (
          <RevealOverlay
            o={overlay}
            radius={radius}
            fade={fade}
            onOldLoad={() => oldLoaded.current?.()}
            onNewLoad={() => newLoaded.current?.()}
          />
        ) : null}
      </View>
    </RevealContext.Provider>
  );
}

type OverlayProps = {
  o: Overlay;
  radius: SharedValue<number>;
  fade: SharedValue<number>;
  onOldLoad: () => void;
  onNewLoad: () => void;
};

function RevealOverlay({
  o,
  radius,
  fade,
  onOldLoad,
  onNewLoad,
}: OverlayProps) {
  const oldStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const circleStyle = useAnimatedStyle(() => {
    const r = radius.value;
    return {
      left: o.x - r,
      top: o.y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
    };
  });
  const innerStyle = useAnimatedStyle(() => {
    const r = radius.value;
    return { left: r - o.x, top: r - o.y };
  });

  return (
    // The overlay also swallows touches while the animation runs.
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <Animated.Image
        source={{ uri: o.oldUri }}
        onLoad={onOldLoad}
        style={[
          styles.abs,
          { left: 0, top: 0, width: o.w, height: o.h },
          oldStyle,
        ]}
      />
      {o.newUri ? (
        <Animated.View style={[styles.abs, styles.clip, circleStyle]}>
          <Animated.Image
            source={{ uri: o.newUri }}
            onLoad={onNewLoad}
            style={[styles.abs, { width: o.w, height: o.h }, innerStyle]}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  abs: { position: "absolute" },
  clip: { overflow: "hidden" },
});

export const useThemeReveal = (): RevealApi => useContext(RevealContext);
