import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 8080);
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const BQ_PROJECT_ID = process.env.BQ_PROJECT_ID ?? "observatorio-dev";
export const BQ_DATASET = process.env.BQ_DATASET ?? "observatorio_aec";
export const BQ_TABLE = process.env.BQ_TABLE ?? "usuarios";
export const BQ_TABLE_REF = `\`${BQ_PROJECT_ID}.${BQ_DATASET}.${BQ_TABLE}\``;

export const CORS_ORIGINS = (
  process.env.CORS_ORIGIN ??
  "https://observatorio-970552335718.europe-west1.run.app,https://observatorio-970552335718.europe-southwest1.run.app,http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const PROFILE_CATEGORIES = [
  "CEO",
  "Dueño",
  "Inversor",
  "Líder Directivo",
  "Coordinador",
  "Técnico Profesional",
];

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const VERIFIED_TTL_MS = 30 * 60 * 1000;
