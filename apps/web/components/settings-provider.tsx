"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ArabicFont = "amiri" | "naskh";

interface ReaderSettings {
  arabicFont: ArabicFont;
  arabicSize: number;
  translationSize: number;
}

interface SettingsContextValue {
  settings: ReaderSettings;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
}

const defaultSettings: ReaderSettings = {
  arabicFont: "amiri",
  arabicSize: 32,
  translationSize: 16
};

const storageKey = "quran-reader-settings";
const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return;
    }

    try {
      setSettings({ ...defaultSettings, ...JSON.parse(storedValue) });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    const arabicFontFamily = settings.arabicFont === "naskh" ? "\"Noto Naskh Arabic\", serif" : "\"Amiri\", serif";
    document.documentElement.style.setProperty("--arabic-font-family", arabicFontFamily);
    document.documentElement.style.setProperty("--arabic-font-size", `${settings.arabicSize}px`);
    document.documentElement.style.setProperty("--translation-font-size", `${settings.translationSize}px`);
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings: (nextSettings) => setSettings((current) => ({ ...current, ...nextSettings }))
    }),
    [settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useReaderSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useReaderSettings must be used within SettingsProvider.");
  }
  return context;
}
