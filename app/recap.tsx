import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { Icon } from "../src/components/Icon";
import { PressableScale } from "../src/components/PressableScale";
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
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const { offset: offsetParam } = useLocalSearchParams<{ offset?: string }>();
  const offset = Number(offsetParam ?? 0) || 0;
  const week = useWeekData(offset);

  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Portrait: the card fills the width. Landscape: it is sized by the height, with Share beside it.
  const cardWidth = landscape
    ? Math.max(120, Math.min(340, (height - 150) / 1.25))
    : Math.min(340, width - space.lg * 2);

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

  const shareButton = (
    <PressableScale
      onPress={onShare}
      disabled={!week || busy}
      style={[
        styles.share,
        landscape && styles.shareLandscape,
        (!week || busy) && styles.shareOff,
      ]}
      accessibilityRole="button"
    >
      <Icon name="share-2" size={18} color={colors.onAccent} />
      <Text style={styles.shareText}>{t.recap.share}</Text>
    </PressableScale>
  );

  const card = week ? (
    <View ref={cardRef} collapsable={false}>
      <RecapCard
        width={cardWidth}
        range={formatWeekRange(week.start)}
        totalSec={week.totalSec}
        subjects={week.subjects}
        streak={offset === 0 ? week.streak : null}
      />
    </View>
  ) : null;

  return (
    <SafeAreaView
      style={styles.root}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t.recap.title}</Text>
        <PressableScale
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.close}>{t.recap.close}</Text>
        </PressableScale>
      </View>

      {landscape ? (
        <View style={styles.landscapeBody}>
          {card}
          <View style={styles.side}>
            {shareButton}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.center}>
            {card}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
          <View style={styles.footer}>{shareButton}</View>
        </>
      )}
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
    landscapeBody: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space.xl,
      paddingHorizontal: space.lg,
    },
    side: { width: 200, gap: space.md },
    error: { color: c.danger, fontFamily: fonts.regular, fontSize: 14 },
    footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
    share: {
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.accent,
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    shareLandscape: { width: "100%" },
    shareOff: { opacity: 0.4 },
    shareText: { color: c.onAccent, fontFamily: fonts.bold, fontSize: 17 },
  });
