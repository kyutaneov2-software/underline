import { StyleSheet, Text, View } from "react-native";
import { APP_NAME } from "../config";
import { tone } from "../lib/colors";
import { formatDuration } from "../lib/format";
import { t } from "../strings";
import { fonts, nightPalette } from "../theme";
import type { SubjectTotal } from "../lib/stats";

type Props = {
  width: number;
  range: string;
  totalSec: number;
  subjects: SubjectTotal[];
  streak: number | null; // only shown for the current week
};

// The shareable picture. It always uses the Night palette, so it looks the same for everyone.
export function RecapCard({ width, range, totalSec, subjects, streak }: Props) {
  const c = nightPalette;
  const top = subjects.slice(0, 3);
  return (
    <View
      style={[
        styles.card,
        { width, height: width * 1.25, backgroundColor: c.bg },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.brand, { color: c.ink }]}>{APP_NAME}</Text>
        <Text style={[styles.range, { color: c.muted }]}>{range}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={[styles.label, { color: c.muted }]}>
          {t.recap.focused}
        </Text>
        <Text style={[styles.total, { color: c.ink }]}>
          {formatDuration(totalSec / 60)}
        </Text>
        <View style={[styles.line, { backgroundColor: c.accent }]} />
      </View>

      <View style={styles.footer}>
        {top.map((s) => (
          <View key={s.key} style={styles.row}>
            <View
              style={[
                styles.dot,
                { backgroundColor: s.color ? tone(s.color, true) : c.muted },
              ]}
            />
            <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
              {s.name ?? t.week.noSubject}
            </Text>
            <Text style={[styles.time, { color: c.muted }]}>
              {formatDuration(s.seconds / 60)}
            </Text>
          </View>
        ))}
        {streak !== null && streak > 0 ? (
          <Text style={[styles.streak, { color: c.accent }]}>
            {t.week.streak(streak)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 28, justifyContent: "space-between" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontFamily: fonts.bold, fontSize: 16 },
  range: { fontFamily: fonts.regular, fontSize: 14 },
  middle: { gap: 6 },
  label: { fontFamily: fonts.regular, fontSize: 15 },
  total: { fontFamily: fonts.bold, fontSize: 44, letterSpacing: -1 },
  line: { height: 3, borderRadius: 2, marginTop: 8 },
  footer: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 16 },
  time: { fontFamily: fonts.regular, fontSize: 15 },
  streak: { fontFamily: fonts.semibold, fontSize: 15, marginTop: 4 },
});
