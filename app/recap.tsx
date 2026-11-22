import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { RecapCard } from "../src/components/RecapCard";
import { useTheme } from "../src/context/ThemeContext";
import { useWeekData } from "../src/hooks/useWeekData";
import { formatWeekRange } from "../src/lib/dates";
import { t } from "../src/strings";
import { fonts, radius, space, type Palette } from "../src/theme";

export default function RecapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { offset: offsetParam } = useLocalSearchParams<{ offset?: string }>();
  const offset = Number(offsetParam ?? 0) || 0;
  const week = useWeekData(offset);

  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardWidth = Math.min(340, width - space.lg * 2);

  const onShare = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: t.recap.title,
        });
      } else {
        setError(t.recap.unavailable);
      }
    } catch {
      setError(t.recap.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.recap.title}</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.close}>{t.recap.close}</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        {week ? (
          <View ref={cardRef} collapsable={false}>
            <RecapCard
              width={cardWidth}
              range={formatWeekRange(week.start)}
              totalSec={week.totalSec}
              subjects={week.subjects}
              streak={offset === 0 ? week.streak : null}
            />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onShare}
          disabled={!week || busy}
          style={[styles.share, (!week || busy) && styles.shareOff]}
          accessibilityRole="button"
        >
          <Text style={styles.shareText}>{t.recap.share}</Text>
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
    close: { color: c.muted, fontFamily: fonts.medium, fontSize: 15 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: space.md,
    },
    error: { color: c.danger, fontFamily: fonts.regular, fontSize: 14 },
    footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
    share: {
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    shareOff: { opacity: 0.4 },
    shareText: { color: c.onAccent, fontFamily: fonts.bold, fontSize: 17 },
  });
