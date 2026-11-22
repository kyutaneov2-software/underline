import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS } from "../config";
import { getJSON, setJSON } from "../db/kv";
import type { Settings } from "../types";

const SETTINGS_KEY = "settings";

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const ref = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getJSON<Partial<Settings>>(SETTINGS_KEY, {});
      if (cancelled) return;
      const merged: Settings = { ...DEFAULT_SETTINGS, ...saved };
      ref.current = merged;
      setSettings(merged);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // update({ focusMin: 30 }) merges into the current settings and saves them.
  const update = useCallback((patch: Partial<Settings>) => {
    const next: Settings = { ...ref.current, ...patch };
    ref.current = next;
    setSettings(next);
    setJSON(SETTINGS_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  if (!ready) return null;
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = (): SettingsContextValue =>
  useContext(SettingsContext);
