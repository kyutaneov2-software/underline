import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { fonts, space, type Palette } from "../theme";

export function Placeholder({ title, note }: { title: string; note: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    body: { padding: space.lg, gap: space.sm },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.5,
    },
    note: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
    },
  });
