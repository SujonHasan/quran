import Link from "next/link";
import { notFound } from "next/navigation";
import { getSurahById, getSurahSummaries } from "@quran-reader/quran-data";

interface SurahPageProps {
  params: Promise<{
    id: string;
  }>;
}

export function generateStaticParams() {
  return getSurahSummaries().map((surah) => ({
    id: String(surah.id)
  }));
}

export async function generateMetadata({ params }: SurahPageProps) {
  const { id } = await params;
  const surah = getSurahById(Number(id));
  return {
    title: surah ? `${surah.transliteration} | Quran Reader` : "Surah | Quran Reader"
  };
}

export default async function SurahPage({ params }: SurahPageProps) {
  const { id } = await params;
  const surah = getSurahById(Number(id));

  if (!surah) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link className="mb-6 inline-flex text-sm font-semibold text-leaf underline-offset-4 hover:underline" href="/">
        Back to all surahs
      </Link>

      <section className="mb-8 border-b border-black/10 pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Surah {surah.id} · {surah.type} · {surah.totalVerses} ayahs
            </p>
            <h1 className="text-4xl font-semibold text-ink sm:text-5xl">{surah.transliteration}</h1>
            <p className="mt-2 text-lg text-ink/65">{surah.translation}</p>
          </div>
          <p className="arabic-text text-right text-[3rem] leading-none text-ink">{surah.name}</p>
        </div>
      </section>

      <section aria-label={`${surah.transliteration} verses`} className="space-y-4">
        {surah.verses.map((verse) => (
          <article
            key={verse.id}
            id={`ayah-${verse.id}`}
            className="scroll-mt-32 rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <span className="rounded-lg bg-mist px-3 py-1 text-sm font-semibold text-leaf">
                {surah.id}:{verse.id}
              </span>
              {verse.transliteration ? <span className="hidden text-sm text-ink/45 sm:inline">{verse.transliteration}</span> : null}
            </div>
            <p className="arabic-text text-right text-ink">{verse.text}</p>
            <p className="translation-text mt-5 border-t border-black/10 pt-5 text-ink/75">{verse.translation}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
