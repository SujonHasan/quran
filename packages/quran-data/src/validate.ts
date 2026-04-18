import { validateQuranData } from "./index.js";

const errors = validateQuranData();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Quran data is valid: 114 surahs and 6,236 ayahs.");
