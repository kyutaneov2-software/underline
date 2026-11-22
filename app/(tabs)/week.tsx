import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/context/ThemeContext";
import { useWeekData } from "../../src/hooks/useWeekData";
import { tone } from "../../src/lib/colors";
import { formatWeekRange } from "../../src/lib/dates";
import { formatDuration } from "../../src/lib/format";
import { t } from "../../src/strings";
import { fonts, radius, space, type Palette } from "../../src/theme";

const CHART_HEIGHT = 160;

export default function WeekScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const week = useWeekData(offset);

  const title =
    offset === 0
      ? t.week.thisWeek
      : offset === -1
        ? t.week.lastWeek
        : week
          ? formatWeekRange(week.start)
          : "";
  const maxSec = week
    ? Math.max(3600, ...week.days.map((d) => d.totalSec))
    : 3600;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            onPress={() => router.push("../log")}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.link}>{t.week.log}</Text>
          </Pressable>
        </View>

        <View style={styles.rangeRow}>
          <Text style={styles.range}>
            {week ? formatWeekRange(week.start) : " "}
          </Text>
          <View style={styles.nav}>
            <Pressable
              onPress={() => setOffset((o) => o - 1)}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel={t.week.previous}
            >
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Pressable
              onPress={() => setOffset((o) => Math.min(0, o + 1))}
              disabled={offset === 0}
              style={[styles.navBtn, offset === 0 && styles.navOff]}
              accessibilityRole="button"
              accessibilityLabel={t.week.next}
            >
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>
        </View>

        {week ? (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.total}>
                {formatDuration(week.totalSec / 60)}
              </Text>
              {offset === 0 ? (
                <Text style={styles.streak}>{t.week.streak(week.streak)}</Text>
              ) : null}
            </View>

            <View style={styles.chart}>
              {week.days.map((d) => (
                <View
                  key={d.key}
                  style={styles.col}
                  accessible
                  accessibilityLabel={`${d.label}, ${formatDuration(d.totalSec / 60)}`}
                >
                  <View style={styles.stack}>
                    {d.segments.map((s) => (
                      <View
                        key={s.key}
                        style={[
                          styles.segment,
                          {
                            height: Math.max(
                              3,
                              (s.seconds / maxSec) * CHART_HEIGHT,
                            ),
                            backgroundColor: s.color
                              ? tone(s.color, isDark)
                              : colors.muted,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}
                  >
                    {d.label}
                  </Text>
                </View>
              ))}
            </View>

            {week.totalSec === 0 ? (
              <Text style={styles.empty}>{t.week.noSessions}</Text>
            ) : null}

            <View style={styles.list}>
              {week.subjects.map((s) => (
                <View key={s.key} style={styles.listRow}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: s.color
                          ? tone(s.color, isDark)
                          : colors.muted,
                      },
                    ]}
                  />
                  <Text style={styles.listName}>
                    {s.name ?? t.week.noSubject}
                  </Text>
                  <Text style={styles.listTime}>
                    {formatDuration(s.seconds / 60)}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              style={styles.share}
              onPress={() =>
                router.push({
                  pathname: "/recap" as any,
                  params: { offset: String(offset) },
                })
              }
              accessibilityRole="button"
            >
              <Text style={styles.shareText}>{t.week.share}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: space.lg, paddingBottom: space.xl },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.5,
    },
    link: { color: c.accent, fontFamily: fonts.semibold, fontSize: 15 },
    rangeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    range: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    nav: { flexDirection: "row" },
    navBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    navOff: { opacity: 0.3 },
    navText: {
      color: c.ink,
      fontFamily: fonts.medium,
      fontSize: 26,
      lineHeight: 28,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: space.sm,
    },
    total: {
      color: c.ink,
      fontFamily: fonts.semibold,
      fontSize: 44,
      letterSpacing: -1,
    },
    streak: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      paddingBottom: 8,
    },
    chart: { flexDirection: "row", gap: 10, marginTop: space.lg },
    col: { flex: 1, alignItems: "center", gap: 8 },
    stack: {
      height: CHART_HEIGHT,
      width: "100%",
      justifyContent: "flex-end",
      gap: 2,
    },
    segment: { width: "100%", borderRadius: 3 },
    dayLabel: { color: c.muted, fontFamily: fonts.regular, fontSize: 13 },
    dayLabelToday: { color: c.ink, fontFamily: fonts.bold },
    empty: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: space.md,
    },
    list: { marginTop: space.lg },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.line,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    listName: { flex: 1, color: c.ink, fontFamily: fonts.medium, fontSize: 16 },
    listTime: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
    },
    share: {
      height: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.lg,
    },
    shareText: { color: c.ink, fontFamily: fonts.medium, fontSize: 16 },
  });
