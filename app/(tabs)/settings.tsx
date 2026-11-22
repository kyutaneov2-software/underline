import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Segmented } from '../../src/components/Segmented';
import { Stepper } from '../../src/components/Stepper';
import { useThemeReveal } from '../../src/components/ThemeReveal';
import { APP_NAME } from '../../src/config';
import { useSettings } from '../../src/context/SettingsContext';
import { useTheme } from '../../src/context/ThemeContext';
import { formatDuration } from '../../src/lib/format';
import { t } from '../../src/strings';
import { fonts, space, type Palette } from '../../src/theme';
import type { ThemeChoice } from '../../src/types';

type RowProps = {
  styles: ReturnType<typeof makeStyles>;
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

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { settings, update } = useSettings();
  const { setTheme } = useThemeReveal();

  const switchProps = {
    trackColor: { false: colors.line, true: colors.accent },
    thumbColor: '#FFFFFF',
    ios_backgroundColor: colors.line,
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.settings.title}</Text>

        <Text style={styles.section}>{t.settings.timer}</Text>
        <Row styles={styles} label={t.settings.focusLength}>
          <Stepper label={t.settings.focusLength} value={settings.focusMin} min={5} max={120} step={5} format={t.timer.minutes} onChange={(v) => update({ focusMin: v })} />
        </Row>
        <Row styles={styles} label={t.settings.shortBreak}>
          <Stepper label={t.settings.shortBreak} value={settings.breakMin} min={1} max={30} format={t.timer.minutes} onChange={(v) => update({ breakMin: v })} />
        </Row>
        <Row styles={styles} label={t.settings.longBreak}>
          <Stepper label={t.settings.longBreak} value={settings.longBreakMin} min={5} max={60} step={5} format={t.timer.minutes} onChange={(v) => update({ longBreakMin: v })} />
        </Row>
        <Row styles={styles} label={t.settings.longBreakAfter}>
          <Stepper label={t.settings.longBreakAfter} value={settings.longBreakEvery} min={2} max={8} format={t.settings.sessions} onChange={(v) => update({ longBreakEvery: v })} />
        </Row>

        <Text style={styles.section}>{t.settings.goals}</Text>
        <Row styles={styles} label={t.settings.dailyGoal}>
          <Stepper label={t.settings.dailyGoal} value={settings.dailyGoalMin} min={15} max={600} step={15} format={formatDuration} onChange={(v) => update({ dailyGoalMin: v })} />
        </Row>
        <View style={styles.block}>
          <Text style={styles.rowLabel}>{t.settings.weekStarts}</Text>
          <View style={styles.segWrap}>
            <Segmented<0 | 1>
              options={[
                { value: 1, label: t.settings.monday },
                { value: 0, label: t.settings.sunday },
              ]}
              value={settings.weekStartsOn}
              onSelect={(v) => update({ weekStartsOn: v })}
            />
          </View>
        </View>

        <Text style={styles.section}>{t.settings.behavior}</Text>
        <Row styles={styles} label={t.settings.autoStart} hint={t.settings.autoStartHint}>
          <Switch {...switchProps} value={settings.autoStart} onValueChange={(v) => update({ autoStart: v })} />
        </Row>
        <Row styles={styles} label={t.settings.keepAwake} hint={t.settings.keepAwakeHint}>
          <Switch {...switchProps} value={settings.keepAwake} onValueChange={(v) => update({ keepAwake: v })} />
        </Row>
        <Row styles={styles} label={t.settings.haptics}>
          <Switch {...switchProps} value={settings.haptics} onValueChange={(v) => update({ haptics: v })} />
        </Row>

        <Text style={styles.section}>{t.settings.look}</Text>
        <View style={styles.block}>
          <Text style={styles.rowLabel}>{t.settings.theme}</Text>
          <View style={styles.segWrap}>
            <Segmented<ThemeChoice>
              options={[
                { value: 'system', label: t.settings.system },
                { value: 'light', label: t.settings.light },
                { value: 'night', label: t.settings.night },
              ]}
              value={settings.theme}
              onSelect={(v, x, y) => setTheme(v, x, y)}
            />
          </View>
        </View>

        <Text style={styles.section}>{t.settings.about}</Text>
        <Text style={styles.about}>{APP_NAME}</Text>
        <Text style={styles.privacy}>{t.settings.privacy}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    content: { padding: space.lg, paddingBottom: space.xl },
    title: { color: c.ink, fontFamily: fonts.bold, fontSize: 28, letterSpacing: -0.5 },
    section: { color: c.muted, fontFamily: fonts.regular, fontSize: 14, marginTop: space.lg + space.sm, marginBottom: space.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.line,
    },
    rowText: { flex: 1, paddingRight: space.md },
    rowLabel: { color: c.ink, fontFamily: fonts.medium, fontSize: 16 },
    rowHint: { color: c.muted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
    block: { paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
    segWrap: { marginTop: space.sm },
    about: { color: c.ink, fontFamily: fonts.semibold, fontSize: 16, marginTop: space.sm },
    privacy: { color: c.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, marginTop: 4 },
  });