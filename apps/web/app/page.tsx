import Link from "next/link";
import { getSurahSummaries } from "@quran-reader/quran-data";

export default function HomePage() {
  const surahs = getSurahSummaries();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 grid gap-5 border-b border-black/10 pb-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-gold">114 Surahs</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Read with a calmer rhythm, search by meaning, and tune the text to your eyes.
          </h1>
        </div>
        <p className="max-w-2xl text-base leading-8 text-ink/70 lg:justify-self-end">
          Choose a surah to read Arabic verses with English translation. Use the settings button to change Arabic font,
          Arabic size, and translation size.
        </p>
      </section>

      <figure className="mb-8 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Birmingham_Quran_manuscript_full.jpg/1280px-Birmingham_Quran_manuscript_full.jpg"
          alt="Seventh-century Birmingham Quran manuscript"
          className="h-48 w-full object-cover sm:h-64"
        />
        <figcaption className="px-4 py-3 text-xs leading-6 text-ink/60 sm:px-5">
          Seventh-century Birmingham Quran manuscript, public domain via{" "}
          <a
            className="font-medium text-leaf underline-offset-4 hover:underline"
            href="https://commons.wikimedia.org/wiki/File:Birmingham_Quran_manuscript_full.jpg"
          >
            Wikimedia Commons
          </a>
          .
        </figcaption>
      </figure>

      <section aria-label="Surah list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {surahs.map((surah) => (
          <Link
            key={surah.id}
            href={`/surah/${surah.id}`}
            className="group rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-leaf/40 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-leaf text-sm font-semibold text-white">
                {surah.id}
              </span>
              <p className="arabic-text text-right text-[1.9rem] leading-none text-ink">{surah.name}</p>
            </div>
            <h2 className="text-xl font-semibold text-ink group-hover:text-leaf">{surah.transliteration}</h2>
            <p className="mt-1 text-sm text-ink/65">{surah.translation}</p>
            <div className="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">
              <span>{surah.type}</span>
              <span>{surah.totalVerses} ayahs</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
