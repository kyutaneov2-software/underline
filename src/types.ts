export type Mode = "focus" | "break";
export type TimerStatus = "idle" | "running" | "paused";
export type ThemeChoice = "system" | "light" | "night";

export type Subject = {
  id: number;
  name: string;
  color: string;
  weeklyGoalMin: number | null;
  examDate: string | null; // 'YYYY-MM-DD'
};

export type Session = {
  id: number;
  startedAt: number; // unix ms
  durationSec: number;
  subjectId: number | null;
  completed: boolean;
};

export type Settings = {
  focusMin: number;
  breakMin: number;
  longBreakMin: number;
  longBreakEvery: number; // a long break after this many focus sessions
  autoStart: boolean; // start the next phase automatically (only while the app is open)
  keepAwake: boolean; // keep the screen on while a timer runs
  haptics: boolean;
  dailyGoalMin: number;
  theme: ThemeChoice;
};

export type TimerState = {
  mode: Mode;
  status: TimerStatus;
  subjectId: number | null;
  startedAt: number | null; // unix ms, when the current session first started
  endAt: number | null; // unix ms, only while running
  durationMs: number; // length of the current phase
  remainingMs: number; // used while idle or paused
  notifId: string | null;
  focusDone: number; // focus sessions finished since the last long break
  longBreak: boolean; // is the current or next break a long one?
};
