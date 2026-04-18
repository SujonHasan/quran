import type { Metadata } from "next";
import { SettingsProvider } from "../components/settings-provider";
import { SettingsSidebar } from "../components/settings-sidebar";
import { SearchBox } from "../components/search-box";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/noto-naskh-arabic/arabic-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quran Reader",
  description: "Read the Quran in Arabic with English translation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SettingsProvider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b border-black/10 bg-mist/95 backdrop-blur">
              <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <a href="/" className="w-fit">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-leaf">Quran Reader</p>
                  <p className="text-xl font-semibold text-ink">Arabic text with English translation</p>
                </a>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <SearchBox />
                  <SettingsSidebar />
                </div>
              </div>
            </header>
            <main>{children}</main>
            <footer className="border-t border-black/10 bg-white">
              <div className="mx-auto max-w-7xl px-4 py-8 text-sm leading-7 text-ink/70 sm:px-6 lg:px-8">
                <p>
                  Quran data is collected from{" "}
                  <a className="font-medium text-leaf underline-offset-4 hover:underline" href="https://github.com/risan/quran-json">
                    risan/quran-json
                  </a>{" "}
                  under CC-BY-SA 4.0. The upstream project credits Tanzil for the English translation source.
                </p>
                <p>
                  Source notes:{" "}
                  <a className="font-medium text-leaf underline-offset-4 hover:underline" href="https://tanzil.ir/docs/text_license">
                    Tanzil text license
                  </a>{" "}
                  and{" "}
                  <a className="font-medium text-leaf underline-offset-4 hover:underline" href="https://tanzil.ir/trans/">
                    Tanzil translations
                  </a>
                  .
                </p>
              </div>
            </footer>
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
