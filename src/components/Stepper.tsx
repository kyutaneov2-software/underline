import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { fonts, space, type Palette } from "../theme";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
  label: string; // spoken by screen readers, for example "Focus length"
};

// A minus button, the value, and a plus button.
export function Stepper({
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
  label,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={atMin}
        hitSlop={8}
        style={[styles.btn, atMin && styles.btnOff]}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{format ? format(value) : String(value)}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={atMax}
        hitSlop={8}
        style={[styles.btn, atMax && styles.btnOff]}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: space.sm },
    btn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    btnOff: { opacity: 0.35 },
    btnText: {
      color: c.ink,
      fontFamily: fonts.medium,
      fontSize: 20,
      lineHeight: 22,
    },
    value: {
      color: c.ink,
      fontFamily: fonts.semibold,
      fontSize: 15,
      minWidth: 84,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
  });
