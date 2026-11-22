import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RollingClock } from "../../src/components/RollingClock";
import { useThemeToggle } from "../../src/components/ThemeReveal";
import { UnderlineBar } from "../../src/components/UnderlineBar";
import { APP_NAME, FOCUS_CHOICES } from "../../src/config";
import { useSettings } from "../../src/context/SettingsContext";
import { useSubjects } from "../../src/context/SubjectsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useTimerContext } from "../../src/context/TimerContext";
import { getFocusSecondsSince, onSessionsChanged } from "../../src/db/sessions";
import { t } from "../../src/strings";
import { fonts, radius, space, type Palette } from "../../src/theme";

const KEEP_AWAKE_TAG = "underline-timer";

export default function TimerScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { toggleTheme } = useThemeToggle();
  const timer = useTimerContext();
  const { settings, update } = useSettings();
  const { subjects, byId } = useSubjects();

  // Focus time logged today, for the goal line.
  const [todaySec, setTodaySec] = useState(0);
  const loadToday = useCallback(async () => {
    const d = new Date();
    const start = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
    ).getTime();
    setTodaySec(await getFocusSecondsSince(start));
  }, []);
  useEffect(() => {
    loadToday();
    return onSessionsChanged(loadToday);
  }, [loadToday]);

  // Optionally keep the screen on while a timer is running.
  useEffect(() => {
    if (timer.status === "running" && settings.keepAwake) {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        Promise.resolve(deactivateKeepAwake(KEEP_AWAKE_TAG)).catch(() => {});
      };
    }
    return undefined;
  }, [timer.status, settings.keepAwake]);

  if (!timer.ready) return <View style={styles.root} />;

  const isFocus = timer.mode === "focus";
  const idle = timer.status === "idle";
  const running = timer.status === "running";
  const subject = byId(timer.subjectId);

  const goalSec = settings.dailyGoalMin * 60;
  const goalFraction = goalSec > 0 ? Math.min(1, todaySec / goalSec) : 0;

  let statusText: string;
  if (timer.status === "paused") statusText = t.timer.paused;
  else if (!isFocus)
    statusText = timer.longBreak ? t.timer.longBreak : t.timer.shortBreak;
  else
    statusText = t.timer.sessionOf(
      timer.focusDone + 1,
      settings.longBreakEvery,
    );

  const primaryLabel = running
    ? t.timer.pause
    : timer.status === "paused"
      ? t.timer.resume
      : t.timer.start;
  const savedSubject = timer.lastCompleted
    ? (byId(timer.lastCompleted.subjectId)?.name ?? "")
    : "";

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>{APP_NAME}</Text>
          {/* Temporary home for the theme switch; it moves to Settings in step 5. */}
          <Pressable
            style={styles.themeButton}
            onPress={(e) =>
              toggleTheme(e.nativeEvent.pageX, e.nativeEvent.pageY)
            }
            accessibilityRole="button"
            accessibilityLabel={isDark ? t.theme.toLight : t.theme.toNight}
          >
            <Text style={styles.themeButtonText}>
              {isDark ? t.theme.toLight : t.theme.toNight}
            </Text>
          </Pressable>
        </View>

        <View style={styles.modeRow}>
          <Chip
            styles={styles}
            label={t.timer.focus}
            selected={isFocus}
            disabled={!idle}
            onPress={() => timer.setMode("focus")}
          />
          <Chip
            styles={styles}
            label={t.timer.break}
            selected={!isFocus}
            disabled={!idle}
            onPress={() => timer.setMode("break")}
          />
        </View>

        <View style={styles.stage}>
          <Text style={styles.label}>
            {isFocus ? t.timer.studying : statusText}
          </Text>
          <Text style={styles.subject}>
            {isFocus ? (subject?.name ?? "") : t.timer.break}
          </Text>
          <View style={styles.underline}>
            <UnderlineBar
              status={timer.status}
              remainingMs={timer.remainingMs}
              totalMs={timer.totalMs}
            />
          </View>
          <View style={styles.clock}>
            <RollingClock remainingMs={timer.remainingMs} />
          </View>
          <Text style={styles.label}>
            {isFocus ? statusText : t.timer.sessionLength(settings.breakMin)}
          </Text>
        </View>

        {timer.lastCompleted && idle ? (
          <Text style={styles.saved}>
            {t.timer.saved(timer.lastCompleted.minutes, savedSubject)}
          </Text>
        ) : null}

        <Pressable
          style={styles.primary}
          onPress={running ? timer.pause : timer.start}
        >
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>
        <Pressable
          style={[styles.secondary, idle && styles.secondaryDisabled]}
          onPress={timer.reset}
          disabled={idle}
        >
          <Text style={styles.secondaryText}>{t.timer.reset}</Text>
        </Pressable>

        <View style={styles.goalHeader}>
          <Text style={styles.label}>
            {t.timer.todayOf(Math.floor(todaySec / 60), settings.dailyGoalMin)}
          </Text>
          {goalFraction >= 1 ? (
            <Text style={styles.goalDone}>{t.timer.goalReached}</Text>
          ) : null}
        </View>
        <View style={styles.goalTrack}>
          <View
            style={[styles.goalFill, { width: `${goalFraction * 100}%` }]}
          />
        </View>

        {isFocus ? (
          <>
            <Text style={styles.section}>{t.timer.chooseSubject}</Text>
            <View style={styles.chipRow}>
              {subjects.map((s) => (
                <Chip
                  key={s.id}
                  styles={styles}
                  label={s.name}
                  dot={s.color}
                  selected={timer.subjectId === s.id}
                  disabled={!idle}
                  onPress={() => timer.setSubject(s.id)}
                />
              ))}
            </View>

            <Text style={styles.section}>{t.timer.chooseLength}</Text>
            <View style={styles.chipRow}>
              {FOCUS_CHOICES.map((min) => (
                <Chip
                  key={min}
                  styles={styles}
                  label={t.timer.minutes(min)}
                  selected={settings.focusMin === min}
                  disabled={!idle}
                  onPress={() => update({ focusMin: min })}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type ChipProps = {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  dot?: string;
};

function Chip({ styles, label, selected, disabled, onPress, dot }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && !selected && styles.chipDisabled,
      ]}
    >
      {dot ? <View style={[styles.chipDot, { backgroundColor: dot }]} /> : null}
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: space.lg, paddingBottom: space.xl },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    wordmark: { color: c.ink, fontFamily: fonts.bold, fontSize: 16 },
    themeButton: {
      height: 36,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    themeButtonText: { color: c.ink, fontFamily: fonts.medium, fontSize: 13 },
    modeRow: { flexDirection: "row", gap: space.sm, marginTop: space.md },
    stage: { marginTop: space.lg },
    label: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    subject: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 40,
      letterSpacing: -0.8,
      marginTop: 4,
    },
    underline: { marginTop: 14 },
    clock: { marginTop: space.lg, marginBottom: space.sm },
    saved: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: space.md,
    },
    primary: {
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.lg,
    },
    primaryText: { color: c.onAccent, fontFamily: fonts.bold, fontSize: 17 },
    secondary: {
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.xs,
    },
    secondaryDisabled: { opacity: 0.4 },
    secondaryText: { color: c.muted, fontFamily: fonts.regular, fontSize: 15 },
    goalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: space.lg,
    },
    goalDone: { color: c.accent, fontFamily: fonts.semibold, fontSize: 14 },
    goalTrack: {
      height: 3,
      borderRadius: 2,
      backgroundColor: c.line,
      marginTop: space.sm,
      overflow: "hidden",
    },
    goalFill: { height: 3, borderRadius: 2, backgroundColor: c.accent },
    section: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: space.lg,
      marginBottom: space.sm,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
    },
    chipSelected: { borderColor: c.ink, borderWidth: 1.5 },
    chipDisabled: { opacity: 0.5 },
    chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    chipText: { color: c.ink, fontFamily: fonts.medium, fontSize: 14 },
  });
