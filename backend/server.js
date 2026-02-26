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
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT ?? "observatorio-dev",
});
const USERS_TABLE = "`observatorio-dev.observatorio_aec.usuarios`";

const PORT = Number(process.env.PORT ?? 8080);
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
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
  return String(rawEmail ?? "").trim();
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

async function upsertUserRow({ correo, nombre, google_id = null }) {
  const mergeQuery = `
    MERGE ${USERS_TABLE} T
    USING (
      SELECT @correo AS correo, @nombre AS nombre, @google_id AS google_id
    ) S
    ON T.correo = S.correo OR (S.google_id IS NOT NULL AND T.google_id = S.google_id)
    WHEN MATCHED THEN
      UPDATE SET
        correo = COALESCE(S.correo, T.correo),
        nombre = COALESCE(S.nombre, T.nombre),
        google_id = COALESCE(T.google_id, S.google_id)
    WHEN NOT MATCHED THEN
      INSERT (google_id, correo, nombre, perfil_confirmado)
      VALUES (S.google_id, S.correo, S.nombre, FALSE)
  `;

  await bigquery.query({
    query: mergeQuery,
    params: { correo, nombre, google_id },
  });
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

// FASE 3 - Registro local
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
      password_hash,
      provider: "local",
      created_at: new Date(),
    };

    await upsertUserRow({
      correo: email,
      nombre: name,
      google_id: null,
    });

    verifiedEmails.delete(email);

    return res.status(201).json(user);
  } catch (err) {
    console.error("[auth/register] error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Google auth endpoint (token validation).
app.post("/auth/google", async (req, res) => {
  const { nombre, correo, google_id } = req.body;
  const correoNormalizado = normalizeEmail(correo);
  const nombreLimpio = String(nombre ?? "").trim();
  const googleIdLimpio = String(google_id ?? "").trim();

  if (!isValidEmail(correoNormalizado)) {
    return res.status(400).json({ error: "Correo invalido" });
  }
  if (!googleIdLimpio) {
    return res.status(400).json({ error: "google_id requerido" });
  }

  try {
    await upsertUserRow({
      correo: correoNormalizado,
      nombre: nombreLimpio || null,
      google_id: googleIdLimpio,
    });
    
    const [rows] = await bigquery.query({
      query: `
        SELECT google_id, correo, nombre, perfil_confirmado
        FROM ${USERS_TABLE}
        WHERE correo = @correo OR google_id = @google_id
        LIMIT 1
      `,
      params: { correo: correoNormalizado, google_id: googleIdLimpio },
    });
    const row = rows?.[0] ?? {};
    const isProfileComplete = Boolean(row.perfil_confirmado);
    const userId = row.google_id || googleIdLimpio;
    const email = row.correo || correoNormalizado;
    const name = row.nombre || nombreLimpio || "Usuario Google";

    // Devolvemos la info al frontend
    return res.json({
      id: userId,
      email,
      name,
      isProfileComplete,
      persistedInBigQuery: true,
    });
  } catch (error) {
    console.error("[auth/google] Error en BigQuery:", error);
    return res.status(200).json({
      id: googleIdLimpio,
      email: correoNormalizado,
      name: nombreLimpio || "Usuario Google",
      isProfileComplete: false,
      persistedInBigQuery: false,
      warning:
        "Login exitoso, pero no se pudo guardar en BigQuery. Revisa credenciales/proyecto.",
    });
  }
});

app.post("/auth/social", (req, res) => {
  const { provider, user, metadata } = req.body ?? {};
  const authEvent = {
    provider,
    user,
    metadata,
    authenticatedAt: new Date().toISOString(),
  };
  console.log("[auth/social]", JSON.stringify(authEvent));
  return res.status(201).json({ ok: true, data: authEvent });
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
            "Eres el observatorio AEC. Responde breve, claro y en espanol. Presentate como un observatorio conversacional.",
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
