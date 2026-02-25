import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { OAuth2Client } from "google-auth-library";
import { BigQuery } from "@google-cloud/bigquery";

// Inicialización de servicios
const app = express();
const googleClient = new OAuth2Client();
const bigquery = new BigQuery();

// Configuración de Entorno
const PORT = Number(process.env.PORT ?? 8080);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "https://observatorio-970552335718.europe-west1.run.app,https://observatorio-970552335718.europe-southwest1.run.app,http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Middlewares
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

// --- RUTAS DE SALUD ---
app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "backend",
    message: "API activa. Usa GET /health o POST /chat",
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// --- AUTENTICACIÓN GOOGLE Y PERFILADO ---
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

    // Verificación del Token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return res.status(401).json({ error: "Token de Google inválido" });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name ?? "";

    console.log("[auth/google] Token verificado:", { email });

    try {
      // 1. Verificar si el usuario ya existe en BigQuery
      const [rows] = await bigquery.query({
        query: `SELECT perfil_confirmado, tipo_caracterizacion FROM \`observatorio-dev.observatorio_aec.usuarios\` WHERE google_id = @googleId`,
        params: { googleId }
      });

      let isProfileComplete = false;
      let tipo_caracterizacion = null;

      if (rows.length === 0) {
        // 2. Si es nuevo: Crear registro inicial
        console.log("[auth/google] Creando nuevo usuario en BigQuery");
        await bigquery.query({
          query: `INSERT INTO \`observatorio-dev.observatorio_aec.usuarios\` (google_id, email, nombre, perfil_confirmado, fecha_registro) 
                  VALUES (@googleId, @email, @name, FALSE, CURRENT_TIMESTAMP)`,
          params: { googleId, email, name }
        });
        isProfileComplete = false;
      } else {
        // 3. Si existe: Obtener estado actual
        isProfileComplete = rows[0].perfil_confirmado === true;
        tipo_caracterizacion = rows[0].tipo_caracterizacion ?? null;
      }

      // Respuesta final al Frontend
      return res.status(200).json({
        id: googleId,
        email: email,
        name: name,
        isProfileComplete: isProfileComplete,
        tipo_caracterizacion: tipo_caracterizacion
      });

    } catch (dbErr) {
      console.error("Error en BigQuery:", dbErr);
      return res.status(500).json({ error: "Error de base de datos" });
    }

  } catch (err) {
    console.warn("[auth/google] Error de autenticación:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
});

// --- REGISTRO SOCIAL (LOGS) ---
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

// --- CHAT CON OPENAI ---
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message requerido" });

    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Falta OPENAI_API_KEY" });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const r = await client.chat.completions.create({ // Corregido: .chat.completions.create
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres el observatorio AEC. Responde breve, claro y en español. Preséntate como un observatorio conversacional.",
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