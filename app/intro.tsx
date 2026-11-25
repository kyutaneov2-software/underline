import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DatePicker } from "../src/components/DatePicker";
import { LogoMark } from "../src/components/LogoMark";
import { MAX_SUBJECT_NAME, SUBJECT_COLORS } from "../src/config";
import { useSettings } from "../src/context/SettingsContext";
import { useSubjects } from "../src/context/SubjectsContext";
import { useTheme } from "../src/context/ThemeContext";
import { getSessionLog } from "../src/db/sessions";
import { tone } from "../src/lib/colors";
import { formatDateLong } from "../src/lib/dates";
import { formatDuration } from "../src/lib/format";
import { t } from "../src/strings";
import { centered, fonts, radius, space, type Palette } from "../src/theme";
import { PressableScale } from "../src/components/PressableScale";

type Draft = { name: string; color: string; examDate: string | null };

const GOAL_CHOICES = [30, 60, 120, 180, 240];
const STEPS = 3;

export default function IntroScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { settings, update } = useSettings();
  const { subjects, saveSubject, removeSubject } = useSubjects();

  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [input, setInput] = useState("");
  const [goal, setGoal] = useState(settings.dailyGoalMin);
  const [openDate, setOpenDate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const exists = (name: string) =>
    drafts.some((d) => d.name.toLowerCase() === name.toLowerCase());

  const addDraft = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (name.length > MAX_SUBJECT_NAME)
      return setError(t.errors.nameTooLong(MAX_SUBJECT_NAME));
    if (exists(name)) return setError(t.errors.nameTaken);
    setDrafts((d) => [
      ...d,
      {
        name,
        color: SUBJECT_COLORS[d.length % SUBJECT_COLORS.length],
        examDate: null,
      },
    ]);
    setInput("");
    setError(null);
  };

  const removeDraft = (index: number) => {
    setDrafts((d) => d.filter((_, i) => i !== index));
    setOpenDate(null);
  };

  const setExam = (index: number, key: string | null) =>
    setDrafts((d) =>
      d.map((x, i) => (i === index ? { ...x, examDate: key } : x)),
    );

  const leave = () => router.replace("/");

  const skip = () => {
    update({ introDone: true });
    leave();
  };

  const next = () => {
    if (step === 0 && drafts.length === 0) {
      setError(t.intro.needOne);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    for (const d of drafts) {
      const err = await saveSubject({
        name: d.name,
        color: d.color,
        weeklyGoalMin: null,
        examDate: d.examDate,
      });
      if (err) {
        setError(err);
        setStep(0);
        setSaving(false);
        return;
      }
    }
    // The starter subject is only needed until the student adds their own. Keep it if it
    // already has sessions, or if the student reused its name.
    const starter = subjects.find((s) => s.name === "General");
    if (starter && drafts.length > 0 && !exists("General")) {
      const used = (await getSessionLog(1)).length > 0;
      if (!used) await removeSubject(starter.id);
    }
    update({ dailyGoalMin: goal, introDone: true });
    setSaving(false);
    leave();
  };

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.top}>
        <View style={styles.progress}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View
              key={i}
              style={[styles.segment, i <= step && styles.segmentOn]}
            />
          ))}
        </View>
        <PressableScale onPress={skip} hitSlop={8} accessibilityRole="button">
          <Text style={styles.skip}>{t.intro.skip}</Text>
        </PressableScale>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? (
          <>
            <View style={styles.logo}>
              <LogoMark size={40} />
            </View>
            <Text style={styles.title}>{t.intro.step1Title}</Text>
            <Text style={styles.note}>{t.intro.step1Note}</Text>

            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={(v) => {
                  setInput(v);
                  if (error) setError(null);
                }}
                onSubmitEditing={() => addDraft(input)}
                placeholder={t.intro.addPlaceholder}
                placeholderTextColor={colors.muted}
                maxLength={MAX_SUBJECT_NAME + 5}
                returnKeyType="done"
                style={styles.input}
              />
              <PressableScale
                onPress={() => addDraft(input)}
                style={styles.addBtn}
                accessibilityRole="button"
              >
                <Text style={styles.addBtnText}>{t.intro.add}</Text>
              </PressableScale>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.chips}>
              {t.intro.suggestions
                .filter((name) => !exists(name))
                .map((name) => (
                  <PressableScale
                    key={name}
                    onPress={() => addDraft(name)}
                    style={styles.chip}
                    accessibilityRole="button"
                  >
                    <Text style={styles.chipText}>{name}</Text>
                  </PressableScale>
                ))}
            </View>

            <View style={styles.list}>
              {drafts.map((d, i) => (
                <View key={d.name} style={styles.listRow}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: tone(d.color, isDark) },
                    ]}
                  />
                  <Text style={styles.listName}>{d.name}</Text>
                  <PressableScale
                    onPress={() => removeDraft(i)}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={styles.listAction}>{t.intro.remove}</Text>
                  </PressableScale>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.title}>{t.intro.step2Title}</Text>
            <Text style={styles.note}>{t.intro.step2Note}</Text>
            <View style={styles.chips}>
              {GOAL_CHOICES.map((min) => (
                <PressableScale
                  key={min}
                  onPress={() => setGoal(min)}
                  style={[styles.chip, goal === min && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: goal === min }}
                >
                  <Text style={styles.chipText}>{formatDuration(min)}</Text>
                </PressableScale>
              ))}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.title}>{t.intro.step3Title}</Text>
            <Text style={styles.note}>{t.intro.step3Note}</Text>
            <View style={styles.list}>
              {drafts.map((d, i) => (
                <View key={d.name}>
                  <PressableScale
                    onPress={() => setOpenDate(openDate === i ? null : i)}
                    style={styles.listRow}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: tone(d.color, isDark) },
                      ]}
                    />
                    <Text style={styles.listName}>{d.name}</Text>
                    <Text style={styles.listAction}>
                      {d.examDate ? formatDateLong(d.examDate) : t.intro.noDate}
                    </Text>
                  </PressableScale>
                  {openDate === i ? (
                    <DatePicker
                      value={d.examDate}
                      onChange={(key) => setExam(i, key)}
                    />
                  ) : null}
                </View>
              ))}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <PressableScale
            onPress={() => setStep((s) => s - 1)}
            style={styles.backBtn}
            accessibilityRole="button"
          >
            <Text style={styles.backText}>{t.intro.back}</Text>
          </PressableScale>
        ) : null}
        <PressableScale
          onPress={step === STEPS - 1 ? finish : next}
          disabled={saving}
          style={[styles.primary, saving && styles.primaryOff]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>
            {step === STEPS - 1 ? t.intro.finish : t.intro.next}
          </Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    top: {
      ...centered,
      flexDirection: "row",
      alignItems: "center",
      gap: space.lg,
      paddingHorizontal: space.lg,
      paddingTop: space.md,
    },
    progress: { flex: 1, flexDirection: "row", gap: 6 },
    segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: c.line },
    segmentOn: { backgroundColor: c.accent },
    skip: { color: c.muted, fontFamily: fonts.medium, fontSize: 15 },
    content: { ...centered, padding: space.lg, paddingTop: space.lg },
    logo: { alignSelf: "flex-start", marginBottom: space.md },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 32,
      letterSpacing: -0.8,
      lineHeight: 38,
    },
    note: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 16,
      lineHeight: 24,
      marginTop: space.sm,
      marginBottom: space.lg,
    },
    inputRow: { flexDirection: "row", gap: space.sm },
    input: {
      flex: 1,
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
    addBtn: {
      height: 52,
      paddingHorizontal: space.lg,
      borderRadius: radius.md,
      backgroundColor: c.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtnText: { color: c.bg, fontFamily: fonts.semibold, fontSize: 15 },
    error: {
      color: c.danger,
      fontFamily: fonts.regular,
      fontSize: 14,
      marginTop: space.sm,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: space.sm,
      marginTop: space.md,
    },
    chip: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    chipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    chipText: { color: c.ink, fontFamily: fonts.medium, fontSize: 14 },
    list: { marginTop: space.lg },
    listRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 56,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.line,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    listName: {
      flex: 1,
      color: c.ink,
      fontFamily: fonts.semibold,
      fontSize: 16,
    },
    listAction: { color: c.muted, fontFamily: fonts.regular, fontSize: 14 },
    footer: {
      ...centered,
      flexDirection: "row",
      gap: space.sm,
      paddingHorizontal: space.lg,
      paddingBottom: space.md,
      paddingTop: space.sm,
    },
    backBtn: {
      height: 56,
      paddingHorizontal: space.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    backText: { color: c.muted, fontFamily: fonts.medium, fontSize: 16 },
    primary: {
      flex: 1,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryOff: { opacity: 0.5 },
    primaryText: { color: c.onAccent, fontFamily: fonts.bold, fontSize: 17 },
  });
