import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSubjects } from "../../src/context/SubjectsContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getFocusSecondsBySubject,
  onSessionsChanged,
} from "../../src/db/sessions";
import { tone, withAlpha } from "../../src/lib/colors";
import { daysUntil, startOfWeek } from "../../src/lib/dates";
import { formatDuration } from "../../src/lib/format";
import { t } from "../../src/strings";
import { centered, fonts, radius, space, type Palette } from "../../src/theme";
import type { Subject } from "../../src/types";

function examLabel(examDate: string | null): { text: string; soon: boolean } {
  if (!examDate) return { text: t.subjects.addExam, soon: false };
  const days = daysUntil(examDate);
  if (days < 0) return { text: t.subjects.examPassed, soon: false };
  if (days === 0) return { text: t.subjects.examToday, soon: true };
  if (days === 1) return { text: t.subjects.examTomorrow, soon: true };
  return { text: t.subjects.examIn(days), soon: days <= 14 };
}

function weekText(s: Subject, seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) return t.subjects.notStarted;
  if (s.weeklyGoalMin)
    return t.subjects.thisWeekOf(
      formatDuration(minutes),
      formatDuration(s.weeklyGoalMin),
    );
  return t.subjects.thisWeek(formatDuration(minutes));
}

export default function SubjectsScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const twoColumns = width > height && width >= 640;
  const { subjects } = useSubjects();
  const { settings } = useSettings();

  const [weekSec, setWeekSec] = useState<Record<number, number>>({});
  const load = useCallback(async () => {
    const since = startOfWeek(new Date(), settings.weekStartsOn).getTime();
    setWeekSec(await getFocusSecondsBySubject(since));
  }, [settings.weekStartsOn]);
  useEffect(() => {
    load();
    return onSessionsChanged(load);
  }, [load]);

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t.subjects.title}</Text>
          <Text style={styles.count}>{subjects.length}</Text>
        </View>

        <View style={styles.grid}>
          {subjects.map((s) => {
            const seconds = weekSec[s.id] ?? 0;
            const color = tone(s.color, isDark);
            const exam = examLabel(s.examDate);
            const fraction = s.weeklyGoalMin
              ? Math.min(1, seconds / 60 / s.weeklyGoalMin)
              : 0;
            return (
              <PressableScale
                key={s.id}
                scaleTo={0.97}
                style={[styles.card, twoColumns && styles.cardHalf]}
                onPress={() =>
                  router.push({
                    pathname: "/subject",
                    params: { id: String(s.id) },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${s.name}. ${weekText(s, seconds)}. ${exam.text}`}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={styles.name} numberOfLines={1}>
                    {s.name}
                  </Text>
                </View>
                <Text style={styles.sub}>{weekText(s, seconds)}</Text>
                {s.weeklyGoalMin ? (
                  <View
                    style={[
                      styles.track,
                      { backgroundColor: withAlpha(s.color, 0.22) },
                    ]}
                  >
                    <View
                      style={[
                        styles.fill,
                        { width: `${fraction * 100}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                ) : null}
                <View style={[styles.pill, exam.soon && styles.pillSoon]}>
                  <Icon
                    name="calendar"
                    size={13}
                    color={exam.soon ? colors.accent : colors.muted}
                  />
                  <Text
                    style={[styles.pillText, exam.soon && styles.pillTextSoon]}
                  >
                    {exam.text}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>

        <PressableScale
          style={styles.add}
          onPress={() => router.push("/subject")}
          accessibilityRole="button"
        >
          <Icon name="plus" size={18} color={colors.accent} />
          <Text style={styles.addText}>{t.subjects.add}</Text>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { ...centered, padding: space.lg, paddingBottom: space.xl },
    titleRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 10,
      marginBottom: space.md,
    },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 30,
      letterSpacing: -0.6,
    },
    count: { color: c.muted, fontFamily: fonts.medium, fontSize: 16 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
    card: {
      width: "100%",
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.line,
      padding: space.md,
      gap: 8,
    },
    cardHalf: { width: "48.8%" },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    name: {
      flex: 1,
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 19,
      letterSpacing: -0.2,
    },
    sub: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    track: { height: 8, borderRadius: 4, overflow: "hidden" },
    fill: { height: 8, borderRadius: 4 },
    pill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.line,
      borderRadius: radius.pill,
      paddingVertical: 5,
      paddingHorizontal: 12,
    },
    pillSoon: { backgroundColor: c.accentSoft },
    pillText: { color: c.muted, fontFamily: fonts.medium, fontSize: 13 },
    pillTextSoon: { color: c.accent, fontFamily: fonts.semibold },
    add: {
      height: 56,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.md,
    },
    addText: { color: c.accent, fontFamily: fonts.bold, fontSize: 16 },
  });
