import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { t } from "../strings";
import type { Mode, SoundChoice } from "../types";

// Android fixes a channel's sound when the channel is first created, so every sound gets its
// own channel. Bump the version suffix if a channel's settings ever need to change.
const SOUNDS: SoundChoice[] = ["soft", "bell", "pulse", "off"];
const SOUND_FILE: Record<Exclude<SoundChoice, "off">, string> = {
  soft: "soft.wav",
  bell: "bell.wav",
  pulse: "pulse.wav",
};
const CHANNEL_LABEL: Record<SoundChoice, string> = {
  soft: "Session alerts: Soft chime",
  bell: "Session alerts: Bell",
  pulse: "Session alerts: Pulse",
  off: "Session alerts: Silent",
};
const channelId = (sound: SoundChoice) => `underline-${sound}-v1`;

// The custom sound files are packed into the app when it is built (see the expo-notifications
// plugin in app.json). Expo Go is a ready-made app, so it doesn't have them. There the
// system's default sound is used instead, and the real sounds appear in a built app.
const hasCustomSounds =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
const soundFor = (sound: Exclude<SoundChoice, "off">): string =>
  hasCustomSounds ? SOUND_FILE[sound] : "default";

// Show the alert even when the app is open. The sound comes from the notification itself.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Promise.all(
    SOUNDS.map((sound) =>
      Notifications.setNotificationChannelAsync(channelId(sound), {
        name: CHANNEL_LABEL[sound],
        importance: Notifications.AndroidImportance.HIGH,
        sound: sound === "off" ? null : soundFor(sound),
        enableVibrate: sound !== "off",
        vibrationPattern: [0, 220, 140, 220],
        lightColor: "#3347FF",
      }),
    ),
  );
  // The single channel from the first versions is no longer used.
  Notifications.deleteNotificationChannelAsync("timer").catch(() => {});
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// What the alert needs to say.
export type AlertInfo = {
  mode: Mode;
  subject: string | null;
  minutes: number; // length of the phase that is ending
  nextBreakMin: number | null; // after a focus session: how long the break will be
  nextIsLong: boolean;
};

// Schedules a local notification for when the timer ends. Returns its id, or null if
// permission was denied (the timer still works, you just get no alert).
export async function scheduleTimerEnd(
  endAtMs: number,
  info: AlertInfo,
  sound: SoundChoice,
): Promise<string | null> {
  try {
    if (!(await ensurePermission())) return null;
    const focus = info.mode === "focus";
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: focus ? t.notify.focusTitle : t.notify.breakTitle,
        body: focus
          ? t.notify.focusBody(
              info.subject,
              info.minutes,
              info.nextBreakMin,
              info.nextIsLong,
            )
          : t.notify.breakBody(info.subject),
        // iOS plays the file named here. Android uses the channel's sound instead.
        sound:
          sound === "off" ? false : hasCustomSounds ? SOUND_FILE[sound] : true,
        data: { mode: info.mode },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endAtMs),
        channelId: channelId(sound),
      },
    });
  } catch {
    return null;
  }
}

export async function cancelTimerEnd(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or cancelled.
  }
}
