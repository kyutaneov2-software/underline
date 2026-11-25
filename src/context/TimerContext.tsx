import { createContext, useContext, type ReactNode } from "react";
import { useTimer, type TimerApi } from "../hooks/useTimer";

// The timer lives above the tab navigator, so it keeps running (and saving finished
// sessions) no matter which tab is open. The clock has its own context, so the rest of the
// screen doesn't re-render every time it ticks.
const TimerContext = createContext<TimerApi | null>(null);
const ClockContext = createContext<number>(0);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { api, remainingMs } = useTimer();
  return (
    <TimerContext.Provider value={api}>
      <ClockContext.Provider value={remainingMs}>
        {children}
      </ClockContext.Provider>
    </TimerContext.Provider>
  );
}

export function useTimerContext(): TimerApi {
  const ctx = useContext(TimerContext);
  if (!ctx)
    throw new Error("useTimerContext must be used inside TimerProvider");
  return ctx;
}

// Milliseconds left on the clock. Only components that draw the clock should call this.
export const useTimerClock = (): number => useContext(ClockContext);
