import { createContext, useContext, type ReactNode } from "react";
import { useTimer, type TimerApi } from "../hooks/useTimer";

// The timer lives above the tab navigator, so it keeps running (and saving finished
// sessions) no matter which tab is open.
const TimerContext = createContext<TimerApi | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const timer = useTimer();
  return (
    <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>
  );
}

export function useTimerContext(): TimerApi {
  const ctx = useContext(TimerContext);
  if (!ctx)
    throw new Error("useTimerContext must be used inside TimerProvider");
  return ctx;
}
