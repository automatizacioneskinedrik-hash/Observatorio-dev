import express from "express";
import { BQ_TABLE_REF } from "../config/constants.js";
import { bigquery, getAdminBigQueryClient } from "../config/bigquery.js";
import { getUserTableColumns, upsertUserByEmail } from "../services/userService.js";
import { normalizeEmail, isValidEmail, isGmailAddress } from "../utils/validators.js";
import { normalizeProfileType, normalizeMeetingFileName, parseMeetingTimestamp, parseMeetingTableRef } from "../utils/helpers.js";
import { generateMeetingInsights, upsertMeetingTranscript, queueMeetingInsightsAnalysis } from "../services/meetingService.js";

const router = express.Router();

function applyAdminImportCors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

router.options("/reuniones/import", (req, res) => {
  applyAdminImportCors(res, req.headers.origin);
  return res.sendStatus(204);
});


router.get("/usuarios", async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const rawLimit = Number.parseInt(String(req.query.limit ?? "50"), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50;

    console.log("[admin/usuarios] consulta iniciada", { query: rawQuery, limit });

    const columns = await getUserTableColumns();
    if (!columns.has("correo")) return res.status(500).json({ error: "La tabla de usuarios no contiene la columna correo" });

    const selectParts = ["correo"];
    selectParts.push(columns.has("nombre") ? "nombre" : "NULL AS nombre");
    selectParts.push(columns.has("google_id") ? "google_id" : "NULL AS google_id");
    selectParts.push(columns.has("perfil_confirmado") ? "perfil_confirmado" : "NULL AS perfil_confirmado");
    selectParts.push(columns.has("tipo_caracterizacion") ? "tipo_caracterizacion" : "NULL AS tipo_caracterizacion");
    selectParts.push(columns.has("tipo_perfil") ? "tipo_perfil" : "NULL AS tipo_perfil");
    selectParts.push(columns.has("provider") ? "provider" : "NULL AS provider");

    const whereParts = [];
    const params = { limit };
    if (rawQuery) {
      params.search = `%${rawQuery.toLowerCase()}%`;
      whereParts.push("LOWER(CAST(correo AS STRING)) LIKE @search");
      if (columns.has("nombre")) whereParts.push("LOWER(CAST(nombre AS STRING)) LIKE @search");
      if (columns.has("google_id")) whereParts.push("LOWER(CAST(google_id AS STRING)) LIKE @search");
    }

    const query = `
SELECT ${selectParts.join(", ")}
FROM ${BQ_TABLE_REF}
${whereParts.length > 0 ? `WHERE (${whereParts.join(" OR ")})` : ""}
ORDER BY correo
LIMIT @limit
`;

    const [rows] = await bigquery.query({ query, params });
    const users = rows.map((row) => {
      const email = String(row.correo ?? "").trim();
      const fallbackName = email.includes("@") ? email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : email;
      return {
        email,
        name: String(row.nombre ?? "").trim() || fallbackName || email,
        googleId: row.google_id ? String(row.google_id).trim() : null,
        profileConfirmed: row.perfil_confirmado === true || row.perfil_confirmado === "true" || row.perfil_confirmado === 1,
        profileCategory: row.tipo_caracterizacion ? String(row.tipo_caracterizacion).trim() : null,
        tipoPerfil: row.tipo_perfil ? String(row.tipo_perfil).trim().toLowerCase() : "user",
        provider: row.provider ? String(row.provider).trim() : null,
        isGmail: isGmailAddress(email),
      };
    });

    console.log("[admin/usuarios] consulta completada", { query: rawQuery, returned: users.length });
    return res.json({ ok: true, count: users.length, users });
  } catch (error) {
    console.error("[admin/usuarios] error:", error);
    return res.status(500).json({ error: "No se pudo listar los usuarios." });
  }
});

router.post("/usuarios/tipo-perfil", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const tipoPerfil = normalizeProfileType(req.body?.tipoPerfil || req.body?.tipo_perfil);

    console.log("[admin/usuarios/tipo-perfil] solicitud recibida", { email, tipoPerfil });

    if (!email || !isValidEmail(email)) return res.status(400).json({ error: "Email invalido" });
    if (!tipoPerfil) return res.status(400).json({ error: "tipoPerfil invalido. Usa admin o user." });
    if (tipoPerfil === "admin" && !isGmailAddress(email)) return res.status(400).json({ error: "Solo se pueden asignar administradores a cuentas Gmail." });

    const columns = await getUserTableColumns();
    if (!columns.has("correo") || !columns.has("tipo_perfil")) return res.status(500).json({ error: "Columnas faltantes en la tabla" });

    const [existing] = await bigquery.query({ query: `SELECT correo FROM ${BQ_TABLE_REF} WHERE correo = @email LIMIT 1`, params: { email } });
    if (!existing.length) return res.status(404).json({ error: "No se encontro el usuario." });

    await bigquery.query({ query: `UPDATE ${BQ_TABLE_REF} SET tipo_perfil = @tipoPerfil WHERE correo = @email`, params: { email, tipoPerfil } });
    return res.status(200).json({ ok: true, email, tipoPerfil });
  } catch (error) {
    console.error("[admin/usuarios/tipo-perfil] error:", error);
    return res.status(500).json({ error: "No se pudo actualizar el tipo de perfil." });
  }
});

router.post("/reuniones/import", express.json({ limit: "25mb" }), async (req, res) => {
  try {
    const { filename, content, googleId } = req.body ?? {};
    if (!filename?.trim()) return res.status(400).json({ error: "Se requiere el nombre del archivo." });
    if (!content?.trim()) return res.status(400).json({ error: "El archivo no contiene texto valido." });

    const tableRef = process.env.BQ_REUNIONES_TABLE_REF || process.env.BQ_MEETINGS_TABLE_REF || process.env.BQ_REUNIONES_TABLE || "observatorio_aec.reuniones";
    const meetingId = normalizeMeetingFileName(filename);
    const meetingDate = parseMeetingTimestamp(filename);
    const transcript = content.replace(/\r\n/g, "\n").trim();
    const tableConfig = parseMeetingTableRef(tableRef);

    if (!tableConfig) return res.status(500).json({ error: "Referencia de tabla invalida." });

    const bqAdmin = getAdminBigQueryClient();
    if (!bqAdmin) return res.status(500).json({ error: "No se pudo inicializar BigQuery Admin." });

    console.log("[admin/reuniones/import] paso 1/4 iniciado", { id_reunion: meetingId, filename });
    applyAdminImportCors(res, req.headers.origin);
    
    const insights = await generateMeetingInsights(transcript);

    await upsertMeetingTranscript({ bigQuery: bqAdmin, tableConfig, meetingId, meetingDate, transcript, googleId, insights });

    if (!insights.hasInsights) {
      queueMeetingInsightsAnalysis({ bigQuery: bqAdmin, tableConfig, meetingId, transcript });
    }

    return res.status(200).json({ ok: true, id_reunion: meetingId, filename, message: "Archivo recibido con exito." });
  } catch (error) {
    console.error("Error importando:", error);
    return res.status(500).json({ error: error.message || "Error interno." });
  }
});

export default router;
