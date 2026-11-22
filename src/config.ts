import type { Settings } from "./types";

export const APP_NAME = "Underline";

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  autoStart: false,
  keepAwake: false,
  haptics: true,
  dailyGoalMin: 120,
  theme: "system",
};

// Quick-pick lengths on the timer screen (they set the focus length in settings).
export const FOCUS_CHOICES: number[] = [15, 25, 45, 60];

// If you reset a focus session early, only log it if at least this much time passed.
export const MIN_LOG_SECONDS = 60;

export const SUBJECT_COLORS: string[] = [
  "#0FA3A3",
  "#7A4DFF",
  "#D98E04",
  "#E0457B",
  "#2F6FED",
  "#64748B",
];
export const MAX_SUBJECT_NAME = 24;
