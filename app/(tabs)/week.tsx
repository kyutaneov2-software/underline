import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../src/components/Icon";
import { PressableScale } from "../../src/components/PressableScale";
import { useSettings } from "../../src/context/SettingsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useWeekData } from "../../src/hooks/useWeekData";
import { tone } from "../../src/lib/colors";
import { formatWeekRange } from "../../src/lib/dates";
import { formatDuration } from "../../src/lib/format";
import { t } from "../../src/strings";
import { centered, fonts, radius, space, type Palette } from "../../src/theme";

export default function WeekScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const chartHeight = width > height ? 110 : 150;
  const { settings } = useSettings();
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

  // The bars are scaled so your daily goal always has room, which makes small days easy to see.
  const goalSec = settings.dailyGoalMin * 60;
  const maxSec = week
    ? Math.max(goalSec, ...week.days.map((d) => d.totalSec), 60)
    : goalSec;
  const goalBottom = (goalSec / maxSec) * chartHeight;

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <PressableScale
            onPress={() => router.push("/log")}
            hitSlop={8}
            style={styles.logPill}
            accessibilityRole="button"
          >
            <Icon name="list" size={15} color={colors.accent} />
            <Text style={styles.logText}>{t.week.log}</Text>
          </PressableScale>
        </View>

        <View style={styles.rangeRow}>
          <Text style={styles.range}>
            {week ? formatWeekRange(week.start) : " "}
          </Text>
          <View style={styles.nav}>
            <PressableScale
              onPress={() => setOffset((o) => o - 1)}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel={t.week.previous}
            >
              <Icon name="chevron-left" size={24} />
            </PressableScale>
            <PressableScale
              onPress={() => setOffset((o) => Math.min(0, o + 1))}
              disabled={offset === 0}
              style={[styles.navBtn, offset === 0 && styles.navOff]}
              accessibilityRole="button"
              accessibilityLabel={t.week.next}
            >
              <Icon name="chevron-right" size={24} />
            </PressableScale>
          </View>
        </View>

        {week ? (
          <>
            <View style={styles.card}>
              <View style={styles.totalRow}>
                <Text style={styles.total}>
                  {formatDuration(week.totalSec / 60)}
                </Text>
                {offset === 0 ? (
                  <View style={styles.streak}>
                    <Icon name="zap" size={14} color={colors.accent} />
                    <Text style={styles.streakText}>
                      {t.week.streak(week.streak)}
                    </Text>
                  </View>
                ) : null}
              </View>
              {week.totalSec === 0 ? (
                <Text style={styles.empty}>{t.week.noSessions}</Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={[styles.chart, { height: chartHeight + 28 }]}>
                <View style={[styles.goalLine, { bottom: goalBottom + 28 }]} />
                {week.days.map((d) => (
                  <View
                    key={d.key}
                    style={styles.col}
                    accessible
                    accessibilityLabel={`${d.label}, ${formatDuration(d.totalSec / 60)}`}
                  >
                    <View style={[styles.stack, { height: chartHeight }]}>
                      {d.segments.map((s) => (
                        <View
                          key={s.key}
                          style={[
                            styles.segment,
                            {
                              height: Math.max(
                                4,
                                (s.seconds / maxSec) * chartHeight,
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
                      style={[
                        styles.dayLabel,
                        d.isToday && styles.dayLabelToday,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={styles.goalNote}>
                {t.week.goalLine(formatDuration(settings.dailyGoalMin))}
              </Text>
            </View>

            {week.subjects.length > 0 ? (
              <View style={styles.card}>
                {week.subjects.map((s, i) => (
                  <View
                    key={s.key}
                    style={[styles.listRow, i > 0 && styles.listRowDivider]}
                  >
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
            ) : null}

            <PressableScale
              style={styles.share}
              onPress={() =>
                router.push({
                  pathname: "/recap",
                  params: { offset: String(offset) },
                })
              }
              accessibilityRole="button"
            >
              <Icon name="share-2" size={18} color={colors.accent} />
              <Text style={styles.shareText}>{t.week.share}</Text>
            </PressableScale>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: {
      ...centered,
      padding: space.lg,
      paddingBottom: space.xl,
      gap: space.sm,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 30,
      letterSpacing: -0.6,
    },
    logPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.accentSoft,
      borderRadius: radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    logText: { color: c.accent, fontFamily: fonts.bold, fontSize: 14 },
    rangeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    range: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    nav: { flexDirection: "row" },
    navBtn: {
      width: 44,
      height: 40,
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

    card: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.line,
      padding: space.md,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    total: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 40,
      letterSpacing: -1,
    },
    streak: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: c.accentSoft,
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    streakText: { color: c.accent, fontFamily: fonts.semibold, fontSize: 13 },
    empty: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: 4,
    },

    chart: { flexDirection: "row", gap: 10 },
    goalLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: c.muted,
      opacity: 0.35,
    },
    col: { flex: 1, alignItems: "center", gap: 8 },
    stack: { width: "100%", justifyContent: "flex-end", gap: 2 },
    segment: { width: "100%", borderRadius: 4 },
    dayLabel: { color: c.muted, fontFamily: fonts.regular, fontSize: 13 },
    dayLabelToday: { color: c.ink, fontFamily: fonts.bold },
    goalNote: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 6,
    },

    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    listRowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.line,
    },
    dot: { width: 12, height: 12, borderRadius: 6 },
    listName: {
      flex: 1,
      color: c.ink,
      fontFamily: fonts.semibold,
      fontSize: 16,
    },
    listTime: {
      color: c.muted,
      fontFamily: fonts.medium,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
    },

    share: {
      height: 56,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.xs,
    },
    shareText: { color: c.accent, fontFamily: fonts.bold, fontSize: 16 },
  });
