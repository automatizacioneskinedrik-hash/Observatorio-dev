import { v4 as uuidv4 } from "uuid";
import { bigquery } from "../config/bigquery.js";
import { BQ_PROJECT_ID, BQ_DATASET, BQ_TABLE, BQ_TABLE_REF } from "../config/constants.js";
import { normalizeProfileType } from "../utils/helpers.js";

let bqUserTableColumnsCache = null;

export async function getUserTableColumns() {
  if (bqUserTableColumnsCache) return bqUserTableColumnsCache;

  const [rows] = await bigquery.query({
    query: `SELECT column_name FROM \`${BQ_PROJECT_ID}.${BQ_DATASET}.INFORMATION_SCHEMA.COLUMNS\` WHERE table_name = @tableName`,
    params: { tableName: BQ_TABLE },
  });

  bqUserTableColumnsCache = new Set(
    rows.map((r) => String(r.column_name ?? "").toLowerCase()).filter(Boolean)
  );
  return bqUserTableColumnsCache;
}

export function pickPasswordColumn(columns) {
  if (columns.has("password_hash")) return "password_hash";
  if (columns.has("contrasena")) return "contrasena";
  return null;
}

export async function upsertUserByEmail({
  email,
  name,
  provider,
  googleId,
  passwordHash,
  profileConfirmed,
  profileCategory,
  profileAnalysis,
  tipoPerfil,
}) {
  const columns = await getUserTableColumns();
  if (!columns.has("correo")) {
    throw new Error("La tabla de usuarios no contiene la columna correo");
  }

  const [existingRows] = await bigquery.query({
    query: `SELECT correo FROM ${BQ_TABLE_REF} WHERE correo = @email LIMIT 1`,
    params: { email },
  });
  const exists = existingRows.length > 0;

  const pwdColumn = pickPasswordColumn(columns);

  if (exists) {
    const updateParts = [];
    const params = { email };

    if (name && columns.has("nombre")) {
      updateParts.push("nombre = @name");
      params.name = name;
    }
    if (provider && columns.has("provider")) {
      updateParts.push("provider = @provider");
      params.provider = provider;
    }
    if (typeof googleId === "string" && columns.has("google_id")) {
      updateParts.push("google_id = @googleId");
      params.googleId = googleId;
    }
    if (typeof profileConfirmed === "boolean" && columns.has("perfil_confirmado")) {
      updateParts.push("perfil_confirmado = @profileConfirmed");
      params.profileConfirmed = profileConfirmed;
    }
    if (typeof profileCategory === "string" && columns.has("tipo_caracterizacion")) {
      updateParts.push("tipo_caracterizacion = @profileCategory");
      params.profileCategory = profileCategory;
    }
    if (typeof profileAnalysis === "string" && columns.has("analisis_perfil")) {
      updateParts.push("analisis_perfil = @profileAnalysis");
      params.profileAnalysis = profileAnalysis;
    }
    const normalizedTipoPerfil = normalizeProfileType(tipoPerfil);
    if (normalizedTipoPerfil && columns.has("tipo_perfil")) {
      updateParts.push("tipo_perfil = @tipoPerfil");
      params.tipoPerfil = normalizedTipoPerfil;
    }
    if (passwordHash && pwdColumn) {
      updateParts.push(`${pwdColumn} = @passwordHash`);
      params.passwordHash = passwordHash;
    }
    
    if (updateParts.length > 0) {
      await bigquery.query({
        query: `UPDATE ${BQ_TABLE_REF} SET ${updateParts.join(", ")} WHERE correo = @email`,
        params,
      });
    }
    return { exists: true };
  }

  const insertColumns = ["correo"];
  const insertValues = ["@email"];
  const params = { email };

  if (columns.has("id")) {
    insertColumns.push("id");
    insertValues.push("@id");
    params.id = uuidv4();
  }
  if (name && columns.has("nombre")) {
    insertColumns.push("nombre");
    insertValues.push("@name");
    params.name = name;
  }
  if (provider && columns.has("provider")) {
    insertColumns.push("provider");
    insertValues.push("@provider");
    params.provider = provider;
  }
  if (typeof googleId === "string" && columns.has("google_id")) {
    insertColumns.push("google_id");
    insertValues.push("@googleId");
    params.googleId = googleId;
  }
  if (typeof profileConfirmed === "boolean" && columns.has("perfil_confirmado")) {
    insertColumns.push("perfil_confirmado");
    insertValues.push("@profileConfirmed");
    params.profileConfirmed = profileConfirmed;
  }
  if (typeof profileCategory === "string" && columns.has("tipo_caracterizacion")) {
    insertColumns.push("tipo_caracterizacion");
    insertValues.push("@profileCategory");
    params.profileCategory = profileCategory;
  }
  if (typeof profileAnalysis === "string" && columns.has("analisis_perfil")) {
    insertColumns.push("analisis_perfil");
    insertValues.push("@profileAnalysis");
    params.profileAnalysis = profileAnalysis;
  }
  if (columns.has("tipo_perfil")) {
    insertColumns.push("tipo_perfil");
    insertValues.push("@tipoPerfil");
    params.tipoPerfil = normalizeProfileType(tipoPerfil) ?? "user";
  }
  if (passwordHash && pwdColumn) {
    insertColumns.push(pwdColumn);
    insertValues.push("@passwordHash");
    params.passwordHash = passwordHash;
  }
  if (columns.has("created_at")) {
    insertColumns.push("created_at");
    insertValues.push("@createdAt");
    params.createdAt = new Date();
  }

  await bigquery.query({
    query: `INSERT INTO ${BQ_TABLE_REF} (${insertColumns.join(", ")}) VALUES (${insertValues.join(", ")})`,
    params,
  });

  return { exists: false };
}
