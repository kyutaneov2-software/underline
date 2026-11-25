import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import type { TimerStatus } from "../types";

type Props = {
  status: TimerStatus;
  remainingMs: number;
  totalMs: number;
  height?: number;
};

// The signature element, the same bold rounded underline as the app icon. It sits under the
// subject's name and is as wide as the name. While running, one linear animation covers the
// remaining time on the UI thread, so it moves smoothly instead of in steps. Pausing freezes
// it; finishing pulses it once.
export function UnderlineBar({
  status,
  remainingMs,
  totalMs,
  height = 8,
}: Props) {
  const { colors } = useTheme();
  const fill = useSharedValue(0);
  const pulse = useSharedValue(1);

  const elapsed = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
  const elapsedRef = useRef(elapsed);
  const remainingRef = useRef(remainingMs);
  const lastRunningElapsed = useRef(0);
  elapsedRef.current = elapsed;
  remainingRef.current = remainingMs;
  if (status === "running") lastRunningElapsed.current = elapsed;

  const prevStatus = useRef<TimerStatus>(status);

  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;

    if (status === "running") {
      cancelAnimation(pulse);
      pulse.value = 1;
      fill.value = elapsedRef.current;
      // This line shows how much time has passed, so it must keep moving even when the phone's
      // Reduce Motion setting is on. Otherwise the animation would jump straight to full.
      fill.value = withTiming(1, {
        duration: Math.max(0, remainingRef.current),
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      });
      return;
    }

    cancelAnimation(fill);
    if (status === "paused") return;

    // Idle: either a finished session (pulse, hold, then clear) or a reset.
    if (was === "running" && lastRunningElapsed.current >= 0.97) {
      fill.value = 1;
      pulse.value = withSequence(
        withTiming(0.3, { duration: 140 }),
        withTiming(1, { duration: 140 }),
        withTiming(0.3, { duration: 140 }),
        withTiming(1, { duration: 140 }),
      );
      fill.value = withDelay(
        900,
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      fill.value = withTiming(elapsedRef.current, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [status, totalMs, fill, pulse]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, fill.value * 100))}%`,
    opacity: pulse.value,
  }));
  const styles = useMemo(
    () => makeStyles(colors.accentSoft, colors.accent, height),
    [colors.accentSoft, colors.accent, height],
  );

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const makeStyles = (track: string, accent: string, height: number) =>
  StyleSheet.create({
    track: {
      height,
      borderRadius: height / 2,
      backgroundColor: track,
      overflow: "hidden",
    },
    fill: { height, borderRadius: height / 2, backgroundColor: accent },
  });
