"use client";

import { useState } from "react";
import { useReaderSettings } from "./settings-provider";

export function SettingsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useReaderSettings();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-11 rounded-lg border border-leaf/30 bg-white px-4 text-sm font-semibold text-leaf shadow-sm transition hover:border-leaf hover:bg-leaf hover:text-white"
      >
        Settings
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close settings"
            className="absolute inset-0 bg-black/35"
            onClick={() => setIsOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white p-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Reader</p>
                <h2 className="text-2xl font-semibold text-ink">Settings</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-mist"
              >
                Close
              </button>
            </div>

            <div className="space-y-7">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-ink">Arabic font</span>
                <select
                  value={settings.arabicFont}
                  onChange={(event) => updateSettings({ arabicFont: event.target.value as "amiri" | "naskh" })}
                  className="h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-ink outline-none focus:border-leaf"
                >
                  <option value="amiri">Amiri</option>
                  <option value="naskh">Noto Naskh Arabic</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between text-sm font-semibold text-ink">
                  Arabic font size <span className="text-ink/55">{settings.arabicSize}px</span>
                </span>
                <input
                  type="range"
                  min="24"
                  max="52"
                  value={settings.arabicSize}
                  onChange={(event) => updateSettings({ arabicSize: Number(event.target.value) })}
                  className="w-full accent-leaf"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center justify-between text-sm font-semibold text-ink">
                  Translation font size <span className="text-ink/55">{settings.translationSize}px</span>
                </span>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={settings.translationSize}
                  onChange={(event) => updateSettings({ translationSize: Number(event.target.value) })}
                  className="w-full accent-leaf"
                />
              </label>
            </div>

            <div className="mt-8 rounded-lg bg-mist p-4">
              <p className="arabic-text text-right text-ink">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>
              <p className="translation-text mt-3 text-ink/70">
                In the name of Allah, the Entirely Merciful, the Especially Merciful.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
