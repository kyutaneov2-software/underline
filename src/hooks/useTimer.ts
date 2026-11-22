import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Haptics from "expo-haptics";
import { MIN_LOG_SECONDS } from "../config";
import { useSettings } from "../context/SettingsContext";
import { useSubjects } from "../context/SubjectsContext";
import { getJSON, setJSON } from "../db/kv";
import { insertSession } from "../db/sessions";
import { cancelTimerEnd, scheduleTimerEnd } from "../lib/notifications";
import type { Mode, Settings, TimerState } from "../types";

const STATE_KEY = "timer_state_v1";
const MIN = 60 * 1000;

// The timer never counts seconds. While running it stores the moment it should end
// (endAt) and derives "time left" from the clock, so it stays correct if the app is
// backgrounded, throttled, or closed and reopened.

function phaseDuration(st: Settings, mode: Mode, longBreak: boolean): number {
  if (mode === "focus") return st.focusMin * MIN;
  return (longBreak ? st.longBreakMin : st.breakMin) * MIN;
}

function initialState(st: Settings): TimerState {
  const d = phaseDuration(st, "focus", false);
  return {
    mode: "focus",
    status: "idle",
    subjectId: null,
    startedAt: null,
    endAt: null,
    durationMs: d,
    remainingMs: d,
    notifId: null,
    focusDone: 0,
    longBreak: false,
  };
}

// Saves a finished focus session and returns the next idle phase.
async function complete(s: TimerState, st: Settings): Promise<TimerState> {
  if (s.mode === "focus") {
    await insertSession({
      startedAt: s.startedAt ?? Date.now(),
      durationSec: Math.round(s.durationMs / 1000),
      subjectId: s.subjectId,
      completed: true,
    });
    const done = s.focusDone + 1;
    const longBreak = st.longBreakEvery > 0 && done % st.longBreakEvery === 0;
    const d = phaseDuration(st, "break", longBreak);
    return {
      ...s,
      mode: "break",
      status: "idle",
      startedAt: null,
      endAt: null,
      notifId: null,
      durationMs: d,
      remainingMs: d,
      focusDone: longBreak ? 0 : done,
      longBreak,
    };
  }
  const d = phaseDuration(st, "focus", false);
  return {
    ...s,
    mode: "focus",
    status: "idle",
    startedAt: null,
    endAt: null,
    notifId: null,
    durationMs: d,
    remainingMs: d,
    longBreak: false,
  };
}

export type LastCompleted = { subjectId: number | null; minutes: number };

export type TimerApi = {
  ready: boolean;
  mode: Mode;
  status: TimerState["status"];
  subjectId: number | null;
  remainingMs: number;
  totalMs: number;
  focusDone: number;
  longBreak: boolean;
  lastCompleted: LastCompleted | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
  setMode: (mode: Mode) => void;
  setSubject: (id: number) => void;
};

export function useTimer(): TimerApi {
  const { settings } = useSettings();
  const { subjects } = useSubjects();

  const [state, setState] = useState<TimerState>(() => initialState(settings));
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [lastCompleted, setLastCompleted] = useState<LastCompleted | null>(
    null,
  );

  const stateRef = useRef<TimerState>(state);
  const settingsRef = useRef<Settings>(settings);
  settingsRef.current = settings;
  const finishingRef = useRef(false);

  // Single place that updates state, the ref used by callbacks, and the saved copy.
  const commit = useCallback((next: TimerState) => {
    stateRef.current = next;
    setState(next);
    setJSON(STATE_KEY, next).catch(() => {});
  }, []);

  const buzz = useCallback((kind: "done" | "tap") => {
    if (!settingsRef.current.haptics) return;
    const p =
      kind === "done"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    p.catch(() => {});
  }, []);

  // Start or resume the current phase.
  const begin = useCallback(async () => {
    const s = stateRef.current;
    if (s.status === "running") return;
    const t = Date.now();
    const endAt = t + s.remainingMs;
    const notifId = await scheduleTimerEnd(endAt, s.mode);
    commit({
      ...s,
      status: "running",
      startedAt: s.status === "paused" ? s.startedAt : t,
      endAt,
      notifId,
    });
    setNow(t);
  }, [commit]);

  // allowForeground is false when catching up on a session that ended while the app was
  // closed: no buzz, and never auto-start a phase in the past.
  const finish = useCallback(
    async (allowForeground: boolean) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      try {
        const s = stateRef.current;
        if (s.status !== "running") return;
        const st = settingsRef.current;
        if (s.mode === "focus") {
          setLastCompleted({
            subjectId: s.subjectId,
            minutes: Math.round(s.durationMs / MIN),
          });
        }
        if (allowForeground) buzz("done");
        commit(await complete(s, st));
        if (allowForeground && st.autoStart) await begin();
      } finally {
        finishingRef.current = false;
      }
    },
    [commit, begin, buzz],
  );

  // Load the saved timer on launch. If it ran out while the app was closed, finish it now.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getJSON<Partial<TimerState> | null>(STATE_KEY, null);
      if (cancelled) return;
      const base = initialState(settingsRef.current);
      const s: TimerState = saved ? { ...base, ...saved } : base;
      stateRef.current = s;
      setState(s);
      setNow(Date.now());
      setReady(true);
      if (s.status === "running" && (s.endAt ?? 0) <= Date.now()) {
        await finish(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [finish]);

  // Tick while running, and re-check the clock when the app returns to the foreground.
  useEffect(() => {
    if (state.status !== "running") return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [state.status]);

  const remainingMs =
    state.status === "running"
      ? Math.max(0, (state.endAt ?? now) - now)
      : state.remainingMs;

  useEffect(() => {
    if (ready && state.status === "running" && remainingMs <= 0) finish(true);
  }, [ready, state.status, remainingMs, finish]);

  // When lengths change in settings while idle, the clock follows them.
  useEffect(() => {
    if (!ready) return;
    const s = stateRef.current;
    if (s.status !== "idle") return;
    const d = phaseDuration(settingsRef.current, s.mode, s.longBreak);
    if (d !== s.durationMs) commit({ ...s, durationMs: d, remainingMs: d });
  }, [
    ready,
    settings.focusMin,
    settings.breakMin,
    settings.longBreakMin,
    commit,
  ]);

  // Keep the selected subject valid (first launch, or the subject was removed).
  useEffect(() => {
    if (!ready) return;
    const first = subjects[0];
    if (!first) return;
    const s = stateRef.current;
    if (s.subjectId === null || !subjects.some((x) => x.id === s.subjectId)) {
      commit({ ...s, subjectId: first.id });
    }
  }, [ready, subjects, commit]);

  // ----- actions -----

  const start = useCallback(async () => {
    setLastCompleted(null);
    buzz("tap");
    await begin();
  }, [begin, buzz]);

  const pause = useCallback(async () => {
    const s = stateRef.current;
    if (s.status !== "running") return;
    buzz("tap");
    await cancelTimerEnd(s.notifId);
    commit({
      ...s,
      status: "paused",
      remainingMs: Math.max(0, (s.endAt ?? Date.now()) - Date.now()),
      endAt: null,
      notifId: null,
    });
  }, [commit, buzz]);

  const reset = useCallback(async () => {
    const s = stateRef.current;
    if (s.status === "idle") return;
    await cancelTimerEnd(s.notifId);

    // Keep a record of a focus session that was stopped early, if it was long enough.
    if (s.mode === "focus") {
      const left =
        s.status === "running"
          ? Math.max(0, (s.endAt ?? 0) - Date.now())
          : s.remainingMs;
      const elapsedSec = Math.round((s.durationMs - left) / 1000);
      if (elapsedSec >= MIN_LOG_SECONDS) {
        await insertSession({
          startedAt: s.startedAt ?? Date.now(),
          durationSec: elapsedSec,
          subjectId: s.subjectId,
          completed: false,
        });
      }
    }

    const d = phaseDuration(settingsRef.current, s.mode, s.longBreak);
    commit({
      ...s,
      status: "idle",
      startedAt: null,
      endAt: null,
      notifId: null,
      durationMs: d,
      remainingMs: d,
    });
  }, [commit]);

  // The setters below only work while idle, so a running session can't change under you.
  const setMode = useCallback(
    (mode: Mode) => {
      const s = stateRef.current;
      if (s.status !== "idle" || s.mode === mode) return;
      const d = phaseDuration(settingsRef.current, mode, s.longBreak);
      commit({ ...s, mode, durationMs: d, remainingMs: d });
    },
    [commit],
  );

  const setSubject = useCallback(
    (id: number) => {
      const s = stateRef.current;
      if (s.status !== "idle") return;
      commit({ ...s, subjectId: id });
    },
    [commit],
  );

  return {
    ready,
    mode: state.mode,
    status: state.status,
    subjectId: state.subjectId,
    remainingMs,
    totalMs: state.durationMs,
    focusDone: state.focusDone,
    longBreak: state.longBreak,
    lastCompleted,
    start,
    pause,
    reset,
    setMode,
    setSubject,
  };
}
