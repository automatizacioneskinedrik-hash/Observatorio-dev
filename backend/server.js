import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { OAuth2Client } from "google-auth-library";
import { BigQuery } from "@google-cloud/bigquery";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import validator from "validator";
import nodemailer from "nodemailer";

const app = express();
const googleClient = new OAuth2Client();

const PORT = Number(process.env.PORT ?? 8080);
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const BQ_PROJECT_ID = process.env.BQ_PROJECT_ID ?? "observatorio-dev";
const BQ_DATASET = process.env.BQ_DATASET ?? "observatorio_aec";
const BQ_TABLE = process.env.BQ_TABLE ?? "usuarios";
const BQ_TABLE_REF = `\`${BQ_PROJECT_ID}.${BQ_DATASET}.${BQ_TABLE}\``;
const bigquery = new BigQuery(
  BQ_PROJECT_ID ? { projectId: BQ_PROJECT_ID } : {}
);
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const VERIFIED_TTL_MS = 30 * 60 * 1000;
const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? "false") === "true";
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER;
const CORS_ORIGINS = (
  process.env.CORS_ORIGIN ??
  "https://observatorio-970552335718.europe-west1.run.app,https://observatorio-970552335718.europe-southwest1.run.app,http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Temporary in-memory stores for local email OTP flow.
const otpStore = new Map();
const verifiedEmails = new Map();
let mailTransporter = null;
let bqUserTableColumnsCache = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_FROM) {
  mailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      return CORS_ORIGINS.includes(origin)
        ? cb(null, true)
        : cb(new Error("CORS bloqueado"));
    },
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "backend",
    message: "API activa. Usa GET /health o POST /chat",
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

function normalizeEmail(rawEmail) {
  const value = String(rawEmail ?? "").trim();
  const normalized = validator.normalizeEmail(value, {
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
  });
  return normalized ?? value.toLowerCase();
}

function isValidEmail(email) {
  return validator.isEmail(email);
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanupAuthStores() {
  const now = Date.now();

  for (const [email, record] of otpStore.entries()) {
    if (record.expires_at <= now) otpStore.delete(email);
  }

  for (const [email, record] of verifiedEmails.entries()) {
    if (record.expires_at <= now) verifiedEmails.delete(email);
  }
}

async function getUserTableColumns() {
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

function pickPasswordColumn(columns) {
  if (columns.has("password_hash")) return "password_hash";
  if (columns.has("contrasena")) return "contrasena";
  return null;
}

async function upsertUserByEmail({
  email,
  name,
  provider,
  googleId,
  passwordHash,
  profileConfirmed,
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

async function sendOtpEmail(toEmail, code) {
  if (!mailTransporter) {
    console.warn(
      "[auth/request-code] SMTP no configurado, usando simulacion por consola."
    );
    console.log(`[auth/request-code] OTP para ${toEmail}: ${code}`);
    return;
  }

  await mailTransporter.sendMail({
    from: SMTP_FROM,
    to: toEmail,
    subject: "Codigo de verificacion - AEECCO IA",
    text: `Tu codigo de verificacion es: ${code}. Expira en 10 minutos.`,
    html: `<p>Tu codigo de verificacion es: <strong>${code}</strong>.</p><p>Expira en 10 minutos.</p>`,
  });
}

// FASE 1 - Solicitud de codigo OTP
app.post("/auth/request-code", async (req, res) => {
  try {
    cleanupAuthStores();

    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email invalido" });
    }

    const code = generateOtpCode();
    const code_hash = await bcrypt.hash(code, 10);

    otpStore.set(email, {
      email,
      code_hash,
      expires_at: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });
    verifiedEmails.delete(email);

    await sendOtpEmail(email, code);

    return res.status(200).json({ status: "code_sent" });
  } catch (err) {
    console.error("[auth/request-code] error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// FASE 2 - Verificacion de codigo OTP
app.post("/auth/verify-code", async (req, res) => {
  try {
    cleanupAuthStores();

    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code ?? "").trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Datos invalidos" });
    }

    const otpRecord = otpStore.get(email);
    if (!otpRecord) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (otpRecord.expires_at <= Date.now()) {
      otpStore.delete(email);
      return res.status(401).json({ error: "Codigo expirado" });
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(email);
      return res.status(401).json({ error: "Maximo de intentos excedido" });
    }

    const match = await bcrypt.compare(code, otpRecord.code_hash);
    if (!match) {
      otpRecord.attempts += 1;
      otpStore.set(email, otpRecord);
      return res.status(401).json({ error: "Unauthorized" });
    }

    verifiedEmails.set(email, {
      verified_at: Date.now(),
      expires_at: Date.now() + VERIFIED_TTL_MS,
    });
    otpStore.delete(email);

    return res.status(200).json({ status: "verified" });
  } catch (err) {
    console.error("[auth/verify-code] error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// FASE 3 - Registro local con persistencia en BigQuery
app.post("/auth/register", async (req, res) => {
  try {
    cleanupAuthStores();

    //Datos en plano
    const email = normalizeEmail(req.body?.email);
    const name = String(req.body?.name ?? "").trim();
    const password = req.body?.password;

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email invalido" });
    }
    if (!name) {
      return res.status(400).json({ error: "Nombre requerido" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password invalida (minimo 8 caracteres)" });
    }

    const verification = verifiedEmails.get(email);
    if (!verification || verification.expires_at <= Date.now()) {
      return res
        .status(401)
        .json({ error: "Email no verificado o verificacion expirada" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      email,
      name,
      provider: "local",
      created_at: new Date(),
    };

    const upsert = await upsertUserByEmail({
      email,
      name,
      provider: "local",
      passwordHash: password_hash,
      profileConfirmed: true,
    });

    if (upsert.exists) {
      return res.status(409).json({ error: "El correo ya existe" });
    }

    verifiedEmails.delete(email);

    return res.status(201).json(user);
  } catch (err) {
    console.error("[auth/register] error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Google auth endpoint (token validation).
app.post("/auth/google", async (req, res) => {
  try {
    const { id_token } = req.body ?? {};

    if (typeof id_token !== "string" || !id_token.trim()) {
      return res.status(400).json({ error: "id_token requerido" });
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error("[auth/google] falta GOOGLE_CLIENT_ID en entorno");
      return res.status(500).json({ error: "Falta GOOGLE_CLIENT_ID" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ error: "Token de Google invalido" });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? "";

    console.log("[auth/google] Token verificado:", { email });

    try {
      const [rows] = await bigquery.query({
        query: `SELECT perfil_confirmado, tipo_caracterizacion FROM ${BQ_TABLE_REF} WHERE google_id = @googleId`,
        params: { googleId },
      });

      let isProfileComplete = false;
      let tipo_caracterizacion = null;

      if (rows.length === 0) {
        await bigquery.query({
          query: `INSERT INTO ${BQ_TABLE_REF} (google_id, correo, nombre, perfil_confirmado) VALUES (@googleId, @email, @name, FALSE)`,
          params: { googleId, email, name },
        });
        isProfileComplete = false;
      } else {
        isProfileComplete = rows[0].perfil_confirmado === true;
        tipo_caracterizacion = rows[0].tipo_caracterizacion ?? null;
      }

      return res.status(200).json({
        id: googleId,
        email,
        name,
        isProfileComplete,
        tipo_caracterizacion,
      });
    } catch (dbErr) {
      console.error("Error en BigQuery:", dbErr);
      return res.status(500).json({ error: "Error de base de datos" });
    }
  } catch (err) {
    console.warn("[auth/google] Error de autenticacion:", err?.message ?? err);
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/auth/social", (req, res) => {
  const { provider, user, metadata } = req.body ?? {};
  const email = normalizeEmail(user?.email);
  const name = String(user?.name ?? "").trim();
  const googleIdRaw = metadata?.googleId;
  const googleId =
    typeof googleIdRaw === "string" && googleIdRaw.trim()
      ? googleIdRaw.trim()
      : undefined;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email invalido" });
  }

  upsertUserByEmail({
    email,
    name,
    provider: typeof provider === "string" ? provider : "social",
    googleId: provider === "google" ? googleId : undefined,
    profileConfirmed: true,
  })
    .then(() => {
      const authEvent = {
        provider,
        user: { ...user, email, name },
        metadata,
        authenticatedAt: new Date().toISOString(),
      };
      console.log("[auth/social]", JSON.stringify(authEvent));
      return res.status(201).json({ ok: true, data: authEvent });
    })
    .catch((err) => {
      console.error("[auth/social] error:", err);
      return res.status(500).json({ error: "Error de base de datos" });
    });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "message requerido" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Falta OPENAI_API_KEY" });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres AECCO IA. Responde breve, claro y en espanol. Presentate como AECCO IA, una IA conversacional.",
        },
        { role: "user", content: message.trim() },
      ],
    });

    return res.json({ reply: r.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "Error llamando a OpenAI" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listo en http://0.0.0.0:${PORT}`);
});
