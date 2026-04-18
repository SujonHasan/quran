import { Hono } from "hono";
import { cors } from "hono/cors";
import { getSurahById, getSurahSummaries, searchTranslations } from "@quran-reader/quran-data";

export const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"]
  })
);

app.get("/health", (context) =>
  context.json({
    ok: true,
    service: "quran-reader-api"
  })
);

app.get("/surahs", (context) => context.json(getSurahSummaries()));

app.get("/surahs/:id", (context) => {
  const id = Number(context.req.param("id"));
  const surah = Number.isInteger(id) ? getSurahById(id) : undefined;

  if (!surah) {
    return context.json({ message: "Surah not found." }, 404);
  }

  return context.json(surah);
});

app.get("/search", (context) => {
  const query = context.req.query("q") ?? "";
  const limit = Number(context.req.query("limit") ?? "30");
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 30;

  return context.json({
    query,
    results: searchTranslations(query, safeLimit)
  });
});
