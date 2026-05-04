import express from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID, BQ_TABLE_REF, OTP_TTL_MS, OTP_MAX_ATTEMPTS, VERIFIED_TTL_MS } from "../config/constants.js";
import { bigquery } from "../config/bigquery.js";
import { normalizeEmail, isValidEmail } from "../utils/validators.js";
import { generateOtpCode } from "../utils/helpers.js";
import { otpStore, verifiedEmails, cleanupAuthStores } from "../services/authService.js";
import { sendOtpEmail } from "../services/emailService.js";
import { upsertUserByEmail } from "../services/userService.js";

const router = express.Router();
const googleClient = new OAuth2Client();

// FASE 1 - Solicitud de codigo OTP 
router.post("/request-code", async (req, res) => {
  try {
    cleanupAuthStores();
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) return res.status(400).json({ error: "Email invalido" });

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
router.post("/verify-code", async (req, res) => {
  try {
    cleanupAuthStores();
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code ?? "").trim();

    if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: "Datos invalidos" });
    }

    const otpRecord = otpStore.get(email);
    if (!otpRecord) return res.status(401).json({ error: "Unauthorized" });

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
router.post("/register", async (req, res) => {
  try {
    cleanupAuthStores();
    const email = normalizeEmail(req.body?.email);
    const name = String(req.body?.name ?? "").trim();
    const password = req.body?.password;

    if (!isValidEmail(email)) return res.status(400).json({ error: "Email invalido" });
    if (!name) return res.status(400).json({ error: "Nombre requerido" });
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password invalida (minimo 8 caracteres)" });
    }

    const verification = verifiedEmails.get(email);
    if (!verification || verification.expires_at <= Date.now()) {
      return res.status(401).json({ error: "Email no verificado o verificacion expirada" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), email, name, provider: "local", created_at: new Date() };

    const upsert = await upsertUserByEmail({
      email, name, provider: "local", passwordHash: password_hash, profileConfirmed: false,
    });

    if (upsert.exists) return res.status(409).json({ error: "El correo ya existe" });

    verifiedEmails.delete(email);
    return res.status(201).json({ ...user, isProfileComplete: false, tipo_caracterizacion: null });
  } catch (err) {
    console.error("[auth/register] error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// Google auth
router.post("/google", async (req, res) => {
  try {
    const { id_token, google_id, correo, nombre } = req.body ?? {};
    let gId = "";
    let email = "";
    let name = "";

    if (typeof id_token === "string" && id_token.trim()) {
      if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "Falta GOOGLE_CLIENT_ID" });
      const ticket = await googleClient.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload?.email) return res.status(401).json({ error: "Token de Google invalido" });
      gId = payload.sub;
      email = payload.email;
      name = payload.name ?? "";
    } else {
      gId = String(google_id ?? "").trim();
      email = normalizeEmail(correo);
      name = String(nombre ?? "").trim();
      if (!gId || !isValidEmail(email)) return res.status(400).json({ error: "Datos invalidos" });
    }

    console.log("[auth/google] Token verificado:", { email });

    const [rows] = await bigquery.query({
      query: `SELECT perfil_confirmado, tipo_caracterizacion FROM ${BQ_TABLE_REF} WHERE google_id = @googleId`,
      params: { googleId: gId },
    });

    let isProfileComplete = false;
    let tipo_caracterizacion = null;

    if (rows.length === 0) {
      await bigquery.query({
        query: `INSERT INTO ${BQ_TABLE_REF} (google_id, correo, nombre, perfil_confirmado) VALUES (@googleId, @email, @name, FALSE)`,
        params: { googleId: gId, email, name },
      });
    } else {
      isProfileComplete = rows[0].perfil_confirmado === true;
      tipo_caracterizacion = rows[0].tipo_caracterizacion ?? null;
    }

    return res.status(200).json({ id: gId, email, name, isProfileComplete, tipo_caracterizacion });
  } catch (err) {
    console.error("[auth/google] error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// Social auth (fallback)
router.post("/social", (req, res) => {
  const { provider, user, metadata } = req.body ?? {};
  const email = normalizeEmail(user?.email);
  const name = String(user?.name ?? "").trim();
  const googleId = typeof metadata?.googleId === "string" ? metadata.googleId.trim() : undefined;

  if (!isValidEmail(email)) return res.status(400).json({ error: "Email invalido" });

  upsertUserByEmail({
    email, name, provider: provider || "social", googleId: provider === "google" ? googleId : undefined, profileConfirmed: false,
  })
    .then(() => res.status(201).json({ ok: true, data: { provider, user: { ...user, email, name }, metadata, authenticatedAt: new Date().toISOString() } }))
    .catch((err) => {
      console.error("[auth/social] error:", err);
      return res.status(500).json({ error: "Error de base de datos" });
    });
});

export default router;
