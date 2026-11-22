import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DatePicker } from "../src/components/DatePicker";
import { MAX_SUBJECT_NAME, SUBJECT_COLORS } from "../src/config";
import { useSubjects } from "../src/context/SubjectsContext";
import { useTheme } from "../src/context/ThemeContext";
import { tone } from "../src/lib/colors";
import { formatDateLong } from "../src/lib/dates";
import { formatDuration } from "../src/lib/format";
import { t } from "../src/strings";
import { fonts, radius, space, type Palette } from "../src/theme";

const GOAL_STEP = 30;
const GOAL_MIN = 30;
const GOAL_MAX = 2400;
const GOAL_START = 120;

export default function SubjectScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { subjects, byId, saveSubject, removeSubject } = useSubjects();

  const existing = id ? byId(Number(id)) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [color, setColor] = useState(
    existing?.color ?? SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
  );
  const [goal, setGoal] = useState<number | null>(
    existing?.weeklyGoalMin ?? null,
  );
  const [exam, setExam] = useState<string | null>(existing?.examDate ?? null);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const decGoal = () =>
    setGoal((g) =>
      g === null ? null : g - GOAL_STEP < GOAL_MIN ? null : g - GOAL_STEP,
    );
  const incGoal = () =>
    setGoal((g) =>
      g === null ? GOAL_START : Math.min(GOAL_MAX, g + GOAL_STEP),
    );

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    const err = await saveSubject({
      id: existing?.id,
      name,
      color,
      weeklyGoalMin: goal,
      examDate: exam,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    router.back();
  };

  const onRemove = () => {
    if (!existing) return;
    Alert.alert(t.subjects.removeTitle(existing.name), t.subjects.removeNote, [
      { text: t.subjects.keep, style: "cancel" },
      {
        text: t.subjects.remove,
        style: "destructive",
        onPress: async () => {
          await removeSubject(existing.id);
          router.back();
        },
      },
    ]);
  };

  const canRemove = !!existing && subjects.length > 1;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {existing ? t.subjects.editTitle : t.subjects.newTitle}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.cancel}>{t.subjects.cancel}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{t.subjects.name}</Text>
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (error) setError(null);
          }}
          placeholder={t.subjects.namePlaceholder}
          placeholderTextColor={colors.muted}
          maxLength={MAX_SUBJECT_NAME + 5}
          autoFocus={!existing}
          returnKeyType="done"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>{t.subjects.color}</Text>
        <View style={styles.swatches}>
          {SUBJECT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="button"
              accessibilityLabel={`${t.subjects.color} ${c}`}
              accessibilityState={{ selected: color === c }}
              style={[styles.swatchRing, color === c && styles.swatchRingOn]}
            >
              <View
                style={[styles.swatch, { backgroundColor: tone(c, isDark) }]}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t.subjects.weeklyGoal}</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={decGoal}
              disabled={goal === null}
              hitSlop={8}
              style={[styles.stepBtn, goal === null && styles.stepBtnOff]}
              accessibilityLabel="Decrease goal"
            >
              <Text style={styles.stepBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>
              {goal === null ? t.subjects.none : formatDuration(goal)}
            </Text>
            <Pressable
              onPress={incGoal}
              disabled={goal !== null && goal >= GOAL_MAX}
              hitSlop={8}
              style={styles.stepBtn}
              accessibilityLabel="Increase goal"
            >
              <Text style={styles.stepBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t.subjects.examDate}</Text>
          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.rowAction}>
              {exam ? formatDateLong(exam) : t.subjects.none}
              {"  "}
              <Text style={styles.rowActionHint}>
                {exam ? t.subjects.change : t.subjects.set}
              </Text>
            </Text>
          </Pressable>
        </View>
        {showPicker ? <DatePicker value={exam} onChange={setExam} /> : null}

        {canRemove ? (
          <Pressable
            onPress={onRemove}
            style={styles.remove}
            accessibilityRole="button"
          >
            <Text style={styles.removeText}>{t.subjects.remove}</Text>
          </Pressable>
        ) : existing ? (
          <Text style={styles.note}>{t.subjects.keepOne}</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onSave}
          disabled={!name.trim() || saving}
          style={[styles.save, (!name.trim() || saving) && styles.saveOff]}
          accessibilityRole="button"
        >
          <Text style={styles.saveText}>{t.subjects.save}</Text>
        </Pressable>
      </View>
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
    cancel: { color: c.muted, fontFamily: fonts.medium, fontSize: 15 },
    content: { padding: space.lg, paddingBottom: space.xl },
    label: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: space.md,
      marginBottom: space.sm,
    },
    input: {
      height: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      paddingHorizontal: space.md,
      color: c.ink,
      fontFamily: fonts.medium,
      fontSize: 17,
    },
    error: {
      color: c.danger,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: space.sm,
    },
    swatches: { flexDirection: "row", gap: space.sm },
    swatchRing: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    swatchRingOn: { borderColor: c.ink },
    swatch: { width: 30, height: 30, borderRadius: 15 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 56,
      marginTop: space.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.line,
      paddingTop: space.sm,
    },
    rowLabel: { color: c.ink, fontFamily: fonts.medium, fontSize: 16 },
    rowAction: { color: c.ink, fontFamily: fonts.medium, fontSize: 15 },
    rowActionHint: {
      color: c.accent,
      fontFamily: fonts.semibold,
      fontSize: 15,
    },
    stepper: { flexDirection: "row", alignItems: "center", gap: space.sm },
    stepBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    stepBtnOff: { opacity: 0.35 },
    stepBtnText: {
      color: c.ink,
      fontFamily: fonts.medium,
      fontSize: 20,
      lineHeight: 22,
    },
    stepValue: {
      color: c.ink,
      fontFamily: fonts.semibold,
      fontSize: 15,
      minWidth: 76,
      textAlign: "center",
    },
    remove: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      marginTop: space.lg,
    },
    removeText: { color: c.danger, fontFamily: fonts.medium, fontSize: 15 },
    note: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 13,
      textAlign: "center",
      marginTop: space.lg,
    },
    footer: {
      paddingHorizontal: space.lg,
      paddingBottom: space.md,
      paddingTop: space.sm,
    },
    save: {
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    saveOff: { opacity: 0.4 },
    saveText: { color: c.onAccent, fontFamily: fonts.bold, fontSize: 17 },
  });
