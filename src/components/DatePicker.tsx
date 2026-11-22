import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { parseDateKey, toDateKey } from "../lib/dates";
import { t } from "../strings";
import { fonts, space, type Palette } from "../theme";

type Props = {
  value: string | null; // 'YYYY-MM-DD'
  onChange: (key: string | null) => void;
};

// A small month calendar in the app's own style. Days before today can't be picked.
export function DatePicker({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = new Date();
  const todayKey = toDateKey(today);
  const start = value ? parseDateKey(value) : today;
  const [view, setView] = useState({
    year: start.getFullYear(),
    month: start.getMonth(),
  });

  const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const atOrBeforeCurrentMonth =
    view.year < today.getFullYear() ||
    (view.year === today.getFullYear() && view.month <= today.getMonth());

  const shift = (delta: number) =>
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => shift(-1)}
          disabled={atOrBeforeCurrentMonth}
          hitSlop={8}
          style={[styles.nav, atOrBeforeCurrentMonth && styles.navOff]}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{monthLabel}</Text>
        <Pressable
          onPress={() => shift(1)}
          hitSlop={8}
          style={styles.nav}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {t.weekdaysShort.map((d, i) => (
          <View key={`w${i}`} style={styles.cell}>
            <Text style={styles.weekday}>{d}</Text>
          </View>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const key = toDateKey(new Date(view.year, view.month, day));
          const selected = key === value;
          const disabled = key < todayKey;
          const isToday = key === todayKey;
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                onPress={() => onChange(key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={parseDateKey(key).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  },
                )}
                accessibilityState={{ selected, disabled }}
                style={[
                  styles.day,
                  isToday && !selected && styles.dayToday,
                  selected && styles.daySelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    disabled && styles.dayTextOff,
                    selected && styles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {value ? (
        <Pressable
          onPress={() => onChange(null)}
          style={styles.clear}
          accessibilityRole="button"
        >
          <Text style={styles.clearText}>{t.subjects.clearDate}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.line,
      padding: space.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: space.sm,
    },
    nav: {
      width: 44,
      height: 44,
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
    month: { color: c.ink, fontFamily: fonts.semibold, fontSize: 16 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cell: {
      width: "14.2857%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    weekday: { color: c.muted, fontFamily: fonts.medium, fontSize: 13 },
    day: {
      width: "86%",
      aspectRatio: 1,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
    },
    dayToday: { borderWidth: 1, borderColor: c.muted },
    daySelected: { backgroundColor: c.accent },
    dayText: { color: c.ink, fontFamily: fonts.medium, fontSize: 15 },
    dayTextOff: { color: c.muted, opacity: 0.4 },
    dayTextSelected: { color: c.onAccent, fontFamily: fonts.bold },
    clear: {
      alignSelf: "center",
      height: 44,
      justifyContent: "center",
      marginTop: space.xs,
    },
    clearText: { color: c.muted, fontFamily: fonts.medium, fontSize: 14 },
  });
