import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../theme";

// The app icon in miniature: a bold "U" with its accent underline.
export function LogoMark({ size = 28 }: { size?: number }) {
  const { colors } = useTheme();
  const bar = Math.max(3, Math.round(size * 0.12));
  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Underline"
    >
      <Text
        style={[
          styles.glyph,
          { color: colors.ink, fontSize: size, lineHeight: size },
        ]}
      >
        U
      </Text>
      <View
        style={{
          width: size * 0.78,
          height: bar,
          borderRadius: bar / 2,
          backgroundColor: colors.accent,
          marginTop: Math.round(size * 0.08),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center" },
  glyph: { fontFamily: fonts.bold, includeFontPadding: false },
});
