import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { fonts, radius, type Palette } from "../theme";
import { PressableScale } from "./PressableScale";

type Option<T> = { value: T; label: string };

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T;
  // pageX and pageY tell the caller where the finger landed (used by the theme reveal).
  onSelect: (value: T, pageX: number, pageY: number) => void;
  size?: "regular" | "compact";
  disabled?: boolean;
};

export function Segmented<T extends string | number>({
  options,
  value,
  onSelect,
  size = "regular",
  disabled = false,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors, size), [colors, size]);
  return (
    <View
      style={[styles.root, disabled && styles.disabled]}
      accessibilityRole="radiogroup"
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <PressableScale
            key={String(o.value)}
            disabled={disabled}
            scaleTo={0.94}
            onPress={(e) =>
              onSelect(o.value, e.nativeEvent.pageX, e.nativeEvent.pageY)
            }
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            style={[styles.segment, selected && styles.segmentOn]}
          >
            <Text style={[styles.text, selected && styles.textOn]}>
              {o.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette, size: "regular" | "compact") => {
  const compact = size === "compact";
  return StyleSheet.create({
    root: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: compact ? 14 : radius.md,
      backgroundColor: c.surface,
      padding: compact ? 2 : 3,
      gap: compact ? 2 : 3,
    },
    disabled: { opacity: 0.5 },
    segment: {
      flex: compact ? undefined : 1,
      minWidth: compact ? 64 : undefined,
      paddingHorizontal: compact ? 12 : 0,
      height: compact ? 32 : 40,
      borderRadius: compact ? 12 : radius.md - 4,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentOn: { backgroundColor: c.ink },
    text: {
      color: c.ink,
      fontFamily: fonts.medium,
      fontSize: compact ? 13 : 14,
    },
    textOn: { color: c.bg, fontFamily: fonts.semibold },
  });
};
