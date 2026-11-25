import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
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
import { LogoMark } from "../../src/components/LogoMark";
import { PressableScale } from "../../src/components/PressableScale";
import { RollingClock } from "../../src/components/RollingClock";
import { Segmented } from "../../src/components/Segmented";
import { UnderlineBar } from "../../src/components/UnderlineBar";
import { APP_NAME, FOCUS_CHOICES } from "../../src/config";
import { useSettings } from "../../src/context/SettingsContext";
import { useSubjects } from "../../src/context/SubjectsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useTimerClock, useTimerContext } from "../../src/context/TimerContext";
import { getFocusSecondsSince, onSessionsChanged } from "../../src/db/sessions";
import { tone } from "../../src/lib/colors";
import { t } from "../../src/strings";
import { fonts, radius, space, type Palette } from "../../src/theme";
import type { Mode, TimerStatus } from "../../src/types";

const KEEP_AWAKE_TAG = "underline-timer";

// These two read the clock, so they re-render four times a second. Nothing else does.
function ClockView({ size }: { size: number }) {
  return <RollingClock remainingMs={useTimerClock()} size={size} />;
}

function UnderlineView({
  status,
  totalMs,
}: {
  status: TimerStatus;
  totalMs: number;
}) {
  return (
    <UnderlineBar
      status={status}
      remainingMs={useTimerClock()}
      totalMs={totalMs}
    />
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
    <PressableScale
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
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </PressableScale>
  );
}

export default function TimerScreen() {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const styles = useMemo(
    () => makeStyles(colors, landscape),
    [colors, landscape],
  );
  const timer = useTimerContext();
  const { settings, update } = useSettings();
  const { subjects, byId } = useSubjects();
  const [leftHeight, setLeftHeight] = useState(0);

  // Focus time logged today, for the goal card.
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
  const dotColor =
    isFocus && subject ? tone(subject.color, isDark) : colors.accent;

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

  const cycleLen = settings.longBreakEvery;
  const filled = timer.longBreak ? cycleLen : timer.focusDone;

  // In landscape the clock is sized to fit the height that is left, so it never needs scrolling.
  const clockSize = landscape
    ? Math.max(44, Math.min(96, Math.floor(((leftHeight || 240) - 140) / 1.05)))
    : 84;

  const header = (
    <View style={styles.header}>
      <View style={styles.brand}>
        <LogoMark size={24} />
        <Text style={styles.wordmark}>{APP_NAME}</Text>
      </View>
      <Segmented<Mode>
        size="compact"
        disabled={!idle}
        options={[
          { value: "focus", label: t.timer.focus },
          { value: "break", label: t.timer.break },
        ]}
        value={timer.mode}
        onSelect={(v) => timer.setMode(v)}
      />
    </View>
  );

  const hero = (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={[styles.heroDot, { backgroundColor: dotColor }]} />
        <Text style={styles.label}>
          {isFocus ? t.timer.studying : t.timer.break}
        </Text>
      </View>

      <View style={styles.subjectWrap}>
        <Text style={styles.subject} numberOfLines={landscape ? 1 : 2}>
          {isFocus ? (subject?.name ?? "") : statusText}
        </Text>
        <View style={styles.underline}>
          <UnderlineView status={timer.status} totalMs={timer.totalMs} />
        </View>
      </View>

      <View style={styles.clock}>
        <ClockView size={clockSize} />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.status}>
          {isFocus ? statusText : t.timer.sessionLength(settings.breakMin)}
        </Text>
        {cycleLen > 0 ? (
          <View
            style={styles.dots}
            accessibilityLabel={`${filled} of ${cycleLen} sessions before a long break`}
          >
            {Array.from({ length: cycleLen }, (_, i) => (
              <View
                key={i}
                style={[styles.cycleDot, i < filled && styles.cycleDotOn]}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  const controls = (
    <>
      {timer.lastCompleted && idle ? (
        <View style={styles.saved}>
          <Icon name="check" size={14} color={colors.accent} />
          <Text style={styles.savedText}>
            {t.timer.saved(timer.lastCompleted.minutes, savedSubject)}
          </Text>
        </View>
      ) : null}

      <View style={styles.buttons}>
        <PressableScale
          style={styles.primary}
          onPress={running ? timer.pause : timer.start}
          accessibilityRole="button"
        >
          <Icon
            name={running ? "pause" : "play"}
            size={20}
            color={colors.onAccent}
          />
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </PressableScale>
        <PressableScale
          style={[styles.secondary, idle && styles.secondaryDisabled]}
          onPress={timer.reset}
          disabled={idle}
          accessibilityRole="button"
        >
          <Icon name="rotate-ccw" size={17} />
          <Text style={styles.secondaryText}>{t.timer.reset}</Text>
        </PressableScale>
      </View>

      <View style={styles.goal}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalText}>
            {t.timer.todayOf(Math.floor(todaySec / 60), settings.dailyGoalMin)}
          </Text>
          {goalFraction >= 1 ? (
            <View style={styles.goalDoneRow}>
              <Icon name="check-circle" size={15} color={colors.accent} />
              <Text style={styles.goalDone}>{t.timer.goalReached}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.goalTrack}>
          <View
            style={[styles.goalFill, { width: `${goalFraction * 100}%` }]}
          />
        </View>
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
                dot={tone(s.color, isDark)}
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
    </>
  );

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {landscape ? (
        // Landscape: the timer stays put on the left. Only the controls on the right scroll.
        <View style={styles.landscapeRoot}>
          {header}
          <View style={styles.landscapeBody}>
            <View
              style={styles.leftFixed}
              onLayout={(e) => setLeftHeight(e.nativeEvent.layout.height)}
            >
              {hero}
            </View>
            <ScrollView
              style={styles.rightScroll}
              contentContainerStyle={styles.rightContent}
              showsVerticalScrollIndicator={false}
            >
              {controls}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {header}
          <View style={styles.body}>
            {hero}
            {controls}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette, compact: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: {
      width: "100%",
      maxWidth: 960,
      alignSelf: "center",
      padding: space.lg,
      paddingBottom: space.xl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 10 },
    wordmark: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 18,
      letterSpacing: -0.2,
    },
    body: { marginTop: space.lg },

    landscapeRoot: {
      flex: 1,
      width: "100%",
      maxWidth: 960,
      alignSelf: "center",
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
    },
    landscapeBody: {
      flex: 1,
      flexDirection: "row",
      gap: space.md,
      marginTop: space.sm,
    },
    leftFixed: { flex: 1.15, paddingBottom: space.sm },
    rightScroll: { flex: 1 },
    rightContent: { paddingBottom: space.md },

    hero: {
      flex: compact ? 1 : undefined,
      justifyContent: compact ? "space-between" : undefined,
      backgroundColor: c.surface,
      borderRadius: compact ? 22 : 28,
      borderWidth: 1,
      borderColor: c.line,
      padding: compact ? 14 : space.lg,
    },
    heroTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    heroDot: { width: 10, height: 10, borderRadius: 5 },
    label: { color: c.muted, fontFamily: fonts.medium, fontSize: 14 },
    subjectWrap: {
      alignSelf: "flex-start",
      maxWidth: "100%",
      marginTop: compact ? 2 : space.sm,
    },
    subject: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: compact ? 24 : 30,
      letterSpacing: -0.6,
      lineHeight: compact ? 28 : 36,
    },
    underline: { marginTop: compact ? 6 : 8 },
    clock: { marginTop: compact ? 0 : space.lg },
    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: compact ? 0 : space.md,
    },
    status: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    dots: { flexDirection: "row", gap: 6 },
    cycleDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: c.muted,
    },
    cycleDotOn: { backgroundColor: c.accent, borderColor: c.accent },

    saved: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.accentSoft,
      borderRadius: radius.pill,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginTop: compact ? 0 : space.md,
    },
    savedText: { color: c.accent, fontFamily: fonts.semibold, fontSize: 13 },

    buttons: {
      flexDirection: "row",
      gap: space.sm,
      marginTop: compact ? space.sm : space.md,
    },
    primary: {
      flex: 2,
      height: compact ? 52 : 60,
      borderRadius: 20,
      backgroundColor: c.accent,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryText: { color: c.onAccent, fontFamily: fonts.bold, fontSize: 18 },
    secondary: {
      flex: 1,
      height: compact ? 52 : 60,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryDisabled: { opacity: 0.45 },
    secondaryText: { color: c.ink, fontFamily: fonts.semibold, fontSize: 15 },

    goal: {
      backgroundColor: c.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.line,
      padding: space.md,
      marginTop: space.md,
    },
    goalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    goalText: { color: c.ink, fontFamily: fonts.semibold, fontSize: 15 },
    goalDoneRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    goalDone: { color: c.accent, fontFamily: fonts.semibold, fontSize: 13 },
    goalTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.accentSoft,
      marginTop: 10,
      overflow: "hidden",
    },
    goalFill: { height: 6, borderRadius: 3, backgroundColor: c.accent },

    section: {
      color: c.ink,
      fontFamily: fonts.semibold,
      fontSize: 15,
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
    chipSelected: { backgroundColor: c.accentSoft, borderColor: c.accent },
    chipDisabled: { opacity: 0.5 },
    chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    chipText: { color: c.ink, fontFamily: fonts.medium, fontSize: 14 },
    chipTextSelected: { fontFamily: fonts.semibold },
  });
