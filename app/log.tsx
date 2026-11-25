import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../src/context/ThemeContext";
import {
  deleteSession,
  getSessionLog,
  onSessionsChanged,
  type SessionLogItem,
} from "../src/db/sessions";
import { tone } from "../src/lib/colors";
import { addDays, toDateKey } from "../src/lib/dates";
import { formatDuration } from "../src/lib/format";
import { t } from "../src/strings";
import { centered, fonts, radius, space, type Palette } from "../src/theme";
import { PressableScale } from "../src/components/PressableScale";

type Section = { title: string; totalSec: number; data: SessionLogItem[] };

function dayTitle(key: string, ms: number, now: Date): string {
  if (key === toDateKey(now)) return t.log.today;
  if (key === toDateKey(addDays(now, -1))) return t.log.yesterday;
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupByDay(items: SessionLogItem[]): Section[] {
  const now = new Date();
  const sections: Section[] = [];
  let currentKey = "";
  items.forEach((item) => {
    const key = toDateKey(new Date(item.startedAt));
    if (key !== currentKey) {
      sections.push({
        title: dayTitle(key, item.startedAt, now),
        totalSec: 0,
        data: [],
      });
      currentKey = key;
    }
    const section = sections[sections.length - 1];
    section.data.push(item);
    if (item.completed) section.totalSec += item.durationSec;
  });
  return sections;
}

export default function LogScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [items, setItems] = useState<SessionLogItem[]>([]);

  const load = useCallback(async () => {
    setItems(await getSessionLog());
  }, []);
  useEffect(() => {
    load();
    return onSessionsChanged(load);
  }, [load]);

  const sections = useMemo(() => groupByDay(items), [items]);

  const confirmDelete = (item: SessionLogItem) => {
    Alert.alert(
      t.log.deleteTitle,
      `${item.subjectName ?? t.week.noSubject}, ${formatDuration(item.durationSec / 60)}. ${t.log.deleteNote}`,
      [
        { text: t.subjects.keep, style: "cancel" },
        {
          text: t.log.delete,
          style: "destructive",
          onPress: () => deleteSession(item.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t.log.title}</Text>
        <PressableScale
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.back}>{t.log.back}</Text>
        </PressableScale>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          sections.length === 0 ? styles.emptyWrap : styles.content
        }
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          sections.length > 0 ? (
            <Text style={styles.hint}>{t.log.hint}</Text>
          ) : undefined
        }
        ListEmptyComponent={<Text style={styles.empty}>{t.log.empty}</Text>}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionTotal}>
              {formatDuration(section.totalSec / 60)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <PressableScale
            onLongPress={() => confirmDelete(item)}
            style={styles.row}
            accessibilityHint={t.log.hint}
          >
            <View
              style={[
                styles.bar,
                {
                  backgroundColor: item.subjectColor
                    ? tone(item.subjectColor, isDark)
                    : colors.muted,
                },
              ]}
            />
            <View style={styles.rowMain}>
              <Text style={styles.name}>
                {item.subjectName ?? t.week.noSubject}
              </Text>
              <Text style={styles.when}>
                {new Date(item.startedAt).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.rowSide}>
              <Text style={styles.duration}>
                {formatDuration(item.durationSec / 60)}
              </Text>
              {!item.completed ? (
                <Text style={styles.early}>{t.log.stoppedEarly}</Text>
              ) : null}
            </View>
          </PressableScale>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: space.lg,
      paddingTop: space.md,
    },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 28,
      letterSpacing: -0.5,
    },
    back: { color: c.muted, fontFamily: fonts.medium, fontSize: 15 },
    content: { ...centered, padding: space.lg, paddingBottom: space.xl },
    emptyWrap: {
      ...centered,
      flexGrow: 1,
      justifyContent: "center",
      padding: space.xl,
    },
    empty: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 16,
      textAlign: "center",
      lineHeight: 24,
    },
    hint: { color: c.muted, fontFamily: fonts.regular, fontSize: 13 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: space.lg,
      marginBottom: space.sm,
    },
    sectionTitle: { color: c.ink, fontFamily: fonts.semibold, fontSize: 15 },
    sectionTotal: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: space.md,
      marginBottom: space.sm,
    },
    bar: {
      width: 4,
      alignSelf: "stretch",
      borderRadius: 2,
      marginRight: space.md,
    },
    rowMain: { flex: 1 },
    rowSide: { alignItems: "flex-end" },
    name: { color: c.ink, fontFamily: fonts.semibold, fontSize: 16 },
    when: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 13,
      marginTop: 2,
    },
    duration: {
      color: c.ink,
      fontFamily: fonts.medium,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
    },
    early: {
      color: c.danger,
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 2,
    },
  });
