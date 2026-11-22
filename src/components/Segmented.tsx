import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { fonts, radius, type Palette } from "../theme";

type Option<T> = { value: T; label: string };

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T;
  // pageX and pageY tell the caller where the finger landed (used by the theme reveal).
  onSelect: (value: T, pageX: number, pageY: number) => void;
};

export function Segmented<T extends string | number>({
  options,
  value,
  onSelect,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.root} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={(e) =>
              onSelect(o.value, e.nativeEvent.pageX, e.nativeEvent.pageY)
            }
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentOn]}
          >
            <Text style={[styles.text, selected && styles.textOn]}>
              {o.label}
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
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      padding: 3,
      gap: 3,
    },
    segment: {
      flex: 1,
      height: 40,
      borderRadius: radius.md - 4,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentOn: { backgroundColor: c.ink },
    text: { color: c.ink, fontFamily: fonts.medium, fontSize: 14 },
    textOn: { color: c.bg, fontFamily: fonts.semibold },
  });
