import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "../../src/context/SettingsContext";
import { useSubjects } from "../../src/context/SubjectsContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  getFocusSecondsBySubject,
  onSessionsChanged,
} from "../../src/db/sessions";
import { tone } from "../../src/lib/colors";
import { daysUntil, startOfWeek } from "../../src/lib/dates";
import { formatDuration } from "../../src/lib/format";
import { t } from "../../src/strings";
import { fonts, radius, space, type Palette } from "../../src/theme";
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
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.subjects.title}</Text>

        {subjects.map((s) => {
          const seconds = weekSec[s.id] ?? 0;
          const color = tone(s.color, isDark);
          const exam = examLabel(s.examDate);
          const fraction = s.weeklyGoalMin
            ? Math.min(1, seconds / 60 / s.weeklyGoalMin)
            : 0;
          return (
            <Pressable
              key={s.id}
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: "/subject",
                  params: { id: String(s.id) },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${s.name}. ${weekText(s, seconds)}. ${exam.text}`}
            >
              <View style={styles.rowTop}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.name}>{s.name}</Text>
                <Text
                  style={[styles.exam, exam.soon && { color: colors.accent }]}
                >
                  {exam.text}
                </Text>
              </View>
              <Text style={styles.sub}>{weekText(s, seconds)}</Text>
              {s.weeklyGoalMin ? (
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${fraction * 100}%`, backgroundColor: color },
                    ]}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <Pressable
          style={styles.add}
          onPress={() => router.push("/subject")}
          accessibilityRole="button"
        >
          <Text style={styles.addText}>{t.subjects.add}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: space.lg, paddingBottom: space.xl },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.5,
      marginBottom: space.sm,
    },
    row: { paddingTop: 18, paddingBottom: 16 },
    rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    name: { flex: 1, color: c.ink, fontFamily: fonts.semibold, fontSize: 17 },
    exam: { color: c.muted, fontFamily: fonts.regular, fontSize: 13 },
    sub: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: 6,
      marginLeft: 22,
    },
    track: {
      height: 3,
      borderRadius: 2,
      backgroundColor: c.line,
      marginTop: 12,
      overflow: "hidden",
    },
    fill: { height: 3, borderRadius: 2 },
    add: {
      height: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.lg,
    },
    addText: { color: c.ink, fontFamily: fonts.medium, fontSize: 16 },
  });
