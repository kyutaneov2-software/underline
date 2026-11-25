import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../theme";

const ROLL_MS = 220;

// 1 = digits roll up (counting down), -1 = roll down (reset, or a longer session).
type Dir = 1 | -1;

type DigitProps = { value: string; dir: Dir; size: number; color: string };

// One digit in a fixed-width box. When the value changes, the old digit slides out and the
// new one slides in. Because every box has the same width, the clock never jitters.
function Digit({ value, dir, size, color }: DigitProps) {
  const [prev, setPrev] = useState<string | null>(null);
  const [curr, setCurr] = useState(value);
  const shown = useRef(value);
  const progress = useSharedValue(1);
  const direction = useSharedValue<number>(1);
  const h = size * 1.05;

  useEffect(() => {
    if (value === shown.current) return;
    setPrev(shown.current);
    setCurr(value);
    shown.current = value;
    direction.value = dir;
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: ROLL_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, dir, direction, progress]);

  const incoming = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [direction.value * h, 0],
        ),
      },
    ],
  }));
  const outgoing = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, -direction.value * h],
        ),
      },
    ],
  }));

  const textStyle = {
    fontFamily: fonts.semibold,
    fontSize: size,
    lineHeight: h,
    color,
  };

  return (
    <View style={{ width: size * 0.6, height: h, overflow: "hidden" }}>
      {prev !== null ? (
        <Animated.Text style={[styles.digit, textStyle, outgoing]}>
          {prev}
        </Animated.Text>
      ) : null}
      <Animated.Text style={[styles.digit, textStyle, incoming]}>
        {curr}
      </Animated.Text>
    </View>
  );
}

export function RollingClock({
  remainingMs,
  size = 84,
}: {
  remainingMs: number;
  size?: number;
}) {
  const { colors } = useTheme();
  const totalSec = Math.ceil(remainingMs / 1000);

  // Counting down rolls up; anything that makes the clock go up (reset, longer session) rolls down.
  const lastSec = useRef(totalSec);
  const dirRef = useRef<Dir>(1);
  if (totalSec !== lastSec.current) {
    dirRef.current = totalSec < lastSec.current ? 1 : -1;
    lastSec.current = totalSec;
  }

  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const text = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  const label = useMemo(() => `${m} minutes ${s} seconds`, [m, s]);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={label}
      importantForAccessibility="yes"
    >
      {text.split("").map((ch, i) => {
        const fromRight = text.length - 1 - i; // keeps each box's identity when minutes gain a digit
        return ch === ":" ? (
          <View
            key={`c${fromRight}`}
            style={{ width: size * 0.3, height: size * 1.05 }}
          >
            <Text
              style={[
                styles.colon,
                {
                  fontFamily: fonts.semibold,
                  fontSize: size,
                  lineHeight: size * 1.05,
                  color: colors.ink,
                },
              ]}
            >
              :
            </Text>
          </View>
        ) : (
          <Digit
            key={`d${fromRight}`}
            value={ch}
            dir={dirRef.current}
            size={size}
            color={colors.ink}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  digit: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    textAlign: "center",
    includeFontPadding: false,
  },
  colon: { textAlign: "center", includeFontPadding: false },
});
