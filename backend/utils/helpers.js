import path from "path";
import { PROFILE_CATEGORIES, BQ_PROJECT_ID } from "../config/constants.js";

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function normalizeMeetingFileName(filename) {
  const baseName = path.basename(String(filename || "")).trim();
  return baseName
    .replace(/\.transcript\.vtt$/i, "")
    .replace(/\.webvtt$/i, "")
    .replace(/\.vtt$/i, "")
    .replace(/\.txt$/i, "")
    .replace(/\.srt$/i, "");
}

export function parseMeetingTimestamp(filename) {
  const match = String(filename || "").match(/GMT(\d{8})-(\d{6})/i);
  if (!match) return new Date();

  const [, datePart, timePart] = match;
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6)) - 1;
  const day = Number(datePart.slice(6, 8));
  const hour = Number(timePart.slice(0, 2));
  const minute = Number(timePart.slice(2, 4));
  const second = Number(timePart.slice(4, 6));

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

export function parseMeetingTableRef(tableRef) {
  const tableParts = String(tableRef || "").split(".").filter(Boolean);
  const projectId = tableParts.length === 3 ? tableParts[0] : BQ_PROJECT_ID;
  const datasetId = tableParts.length === 3 ? tableParts[1] : tableParts[0];
  const tableId = tableParts.length === 3 ? tableParts[2] : tableParts[1];

  if (!datasetId || !tableId) return null;

  return {
    projectId,
    datasetId,
    tableId,
    queryTableRef: `\`${projectId}.${datasetId}.${tableId}\``,
  };
}

export function isStreamingBufferError(error) {
  const message = String(error?.message ?? error ?? "").toLowerCase();
  return message.includes("streaming buffer") || message.includes("would affect rows in the streaming buffer");
}

export async function waitForRetryDelay(attempt) {
  const delaysMs = [15000, 30000, 60000, 120000];
  const delayMs = delaysMs[Math.min(attempt, delaysMs.length - 1)];

  console.log("[admin/reuniones/import] reintentando actualizacion de insights", {
    attempt: attempt + 1,
    delayMs,
  });

  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function normalizeCategory(value) {
  const clean = String(value ?? "").trim().toLowerCase();
  const byExact = PROFILE_CATEGORIES.find((c) => c.toLowerCase() === clean);
  if (byExact) return byExact;

  if (clean.includes("tecnico")) return "Técnico Profesional";
  if (clean.includes("coordinador")) return "Coordinador";
  if (clean.includes("lider")) return "Líder Directivo";
  if (clean.includes("inversor")) return "Inversor";
  if (clean.includes("dueno") || clean.includes("dueño") || clean.includes("propietario")) {
    return "Dueño";
  }
  if (clean.includes("ceo")) return "CEO";
  return null;
}

export function normalizeProfileType(value) {
  const clean = String(value ?? "").trim().toLowerCase();
  if (clean === "admin" || clean === "user") {
    return clean;
  }
  return null;
}
