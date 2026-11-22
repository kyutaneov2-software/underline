import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { Mode } from "../types";

const CHANNEL_ID = "timer";

// Show the alert even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Timer alerts",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.canAskAgain === false) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Schedules a local notification for when the timer ends. Returns its id, or null if
// permission was denied (the timer still works, you just get no alert).
export async function scheduleTimerEnd(
  endAtMs: number,
  mode: Mode,
): Promise<string | null> {
  try {
    if (!(await ensurePermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: mode === "focus" ? "Focus session complete" : "Break is over",
        body:
          mode === "focus"
            ? "Nice work. Time for a break."
            : "Ready for the next session?",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endAtMs),
        channelId: CHANNEL_ID,
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
