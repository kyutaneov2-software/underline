import { Children, useMemo, type ReactNode } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../src/components/Icon";
import { LogoMark } from "../../src/components/LogoMark";
import { Segmented } from "../../src/components/Segmented";
import { Stepper } from "../../src/components/Stepper";
import { useThemeReveal } from "../../src/components/ThemeReveal";
import { APP_NAME } from "../../src/config";
import { useSettings } from "../../src/context/SettingsContext";
import { useTheme } from "../../src/context/ThemeContext";
import { previewSound } from "../../src/lib/sounds";
import { formatDuration } from "../../src/lib/format";
import { t } from "../../src/strings";
import { centered, fonts, space, type Palette } from "../../src/theme";
import type { SoundChoice, ThemeChoice } from "../../src/types";

type Styles = ReturnType<typeof makeStyles>;

// A titled card. Rows inside it are separated by thin dividers.
function Group({
  styles,
  title,
  icon,
  children,
}: {
  styles: Styles;
  title: string;
  icon: IconName;
  children: ReactNode;
}) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.group}>
      <View style={styles.sectionRow}>
        <Icon name={icon} size={16} />
        <Text style={styles.section}>{title}</Text>
      </View>
      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 ? styles.divider : undefined}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

type RowProps = {
  styles: Styles;
  label: string;
  hint?: string;
  children: ReactNode;
};

// Defined outside the screen so React doesn't rebuild every row on each render.
function Row({ styles, label, hint, children }: RowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Block({
  styles,
  label,
  hint,
  children,
}: {
  styles: Styles;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.rowLabel}>{label}</Text>
      {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      <View style={styles.segWrap}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { settings, update } = useSettings();
  const { setTheme } = useThemeReveal();

  const switchProps = {
    trackColor: { false: colors.line, true: colors.accent },
    thumbColor: "#FFFFFF",
    ios_backgroundColor: colors.line,
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.settings.title}</Text>

        <Group styles={styles} title={t.settings.timer} icon="clock">
          <Row styles={styles} label={t.settings.focusLength}>
            <Stepper
              label={t.settings.focusLength}
              value={settings.focusMin}
              min={5}
              max={120}
              step={5}
              format={t.timer.minutes}
              onChange={(v) => update({ focusMin: v })}
            />
          </Row>
          <Row styles={styles} label={t.settings.shortBreak}>
            <Stepper
              label={t.settings.shortBreak}
              value={settings.breakMin}
              min={1}
              max={30}
              format={t.timer.minutes}
              onChange={(v) => update({ breakMin: v })}
            />
          </Row>
          <Row styles={styles} label={t.settings.longBreak}>
            <Stepper
              label={t.settings.longBreak}
              value={settings.longBreakMin}
              min={5}
              max={60}
              step={5}
              format={t.timer.minutes}
              onChange={(v) => update({ longBreakMin: v })}
            />
          </Row>
          <Row styles={styles} label={t.settings.longBreakAfter}>
            <Stepper
              label={t.settings.longBreakAfter}
              value={settings.longBreakEvery}
              min={2}
              max={8}
              format={t.settings.sessions}
              onChange={(v) => update({ longBreakEvery: v })}
            />
          </Row>
        </Group>

        <Group styles={styles} title={t.settings.goals} icon="target">
          <Row styles={styles} label={t.settings.dailyGoal}>
            <Stepper
              label={t.settings.dailyGoal}
              value={settings.dailyGoalMin}
              min={15}
              max={600}
              step={15}
              format={formatDuration}
              onChange={(v) => update({ dailyGoalMin: v })}
            />
          </Row>
          <Block styles={styles} label={t.settings.weekStarts}>
            <Segmented<0 | 1>
              options={[
                { value: 1, label: t.settings.monday },
                { value: 0, label: t.settings.sunday },
              ]}
              value={settings.weekStartsOn}
              onSelect={(v) => update({ weekStartsOn: v })}
            />
          </Block>
        </Group>

        <Group styles={styles} title={t.settings.behavior} icon="sliders">
          <Row
            styles={styles}
            label={t.settings.autoStart}
            hint={t.settings.autoStartHint}
          >
            <Switch
              {...switchProps}
              value={settings.autoStart}
              onValueChange={(v) => update({ autoStart: v })}
            />
          </Row>
          <Row
            styles={styles}
            label={t.settings.keepAwake}
            hint={t.settings.keepAwakeHint}
          >
            <Switch
              {...switchProps}
              value={settings.keepAwake}
              onValueChange={(v) => update({ keepAwake: v })}
            />
          </Row>
        </Group>

        <Group styles={styles} title={t.settings.alerts} icon="bell">
          <Block
            styles={styles}
            label={t.settings.sound}
            hint={t.settings.soundHint}
          >
            <Segmented<SoundChoice>
              options={[
                { value: "soft", label: t.settings.soft },
                { value: "bell", label: t.settings.bell },
                { value: "pulse", label: t.settings.pulse },
                { value: "off", label: t.settings.off },
              ]}
              value={settings.sound}
              onSelect={(v) => {
                update({ sound: v });
                previewSound(v);
              }}
            />
          </Block>
          <Row styles={styles} label={t.settings.haptics}>
            <Switch
              {...switchProps}
              value={settings.haptics}
              onValueChange={(v) => update({ haptics: v })}
            />
          </Row>
        </Group>

        <Group styles={styles} title={t.settings.look} icon="moon">
          <Block styles={styles} label={t.settings.theme}>
            <Segmented<ThemeChoice>
              options={[
                { value: "system", label: t.settings.system },
                { value: "light", label: t.settings.light },
                { value: "night", label: t.settings.night },
              ]}
              value={settings.theme}
              onSelect={(v, x, y) => setTheme(v, x, y)}
            />
          </Block>
        </Group>

        <View style={styles.about}>
          <LogoMark size={34} />
          <Text style={styles.aboutName}>{APP_NAME}</Text>
          <Text style={styles.privacy}>{t.settings.privacy}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { ...centered, padding: space.lg, paddingBottom: space.xl },
    title: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 30,
      letterSpacing: -0.6,
    },
    group: { marginTop: space.lg },
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: space.sm,
      marginLeft: 4,
    },
    section: { color: c.ink, fontFamily: fonts.semibold, fontSize: 15 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: space.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.line,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 60,
    },
    rowText: { flex: 1, paddingRight: space.md },
    rowLabel: { color: c.ink, fontFamily: fonts.medium, fontSize: 16 },
    rowHint: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 13,
      marginTop: 2,
    },
    block: { paddingVertical: space.md },
    segWrap: { marginTop: space.sm },
    about: { alignItems: "center", marginTop: space.xl, gap: 6 },
    aboutName: {
      color: c.ink,
      fontFamily: fonts.bold,
      fontSize: 16,
      marginTop: 6,
    },
    privacy: {
      color: c.muted,
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      maxWidth: 280,
    },
  });
