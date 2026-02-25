import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { OAuth2Client } from "google-auth-library";

const app = express();
const googleClient = new OAuth2Client();

const PORT = Number(process.env.PORT ?? 8080);
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "https://observatorio-970552335718.europe-west1.run.app,https://observatorio-970552335718.europe-southwest1.run.app,http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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

app.post("/auth/google", async (req, res) => {
  try {
    const { id_token } = req.body ?? {};
    console.log("[auth/google] request recibido", {
      hasToken: typeof id_token === "string",
      tokenLength: typeof id_token === "string" ? id_token.length : 0,
    });

    if (typeof id_token !== "string" || !id_token.trim()) {
      console.log("[auth/google] id_token faltante o invalido");
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
      console.warn("[auth/google] token verificado pero sin sub/email");
      return res.status(401).json({ error: "Token de Google invalido" });
    }

    console.log("[auth/google] token valido", {
      sub: payload.sub,
      email: payload.email,
      name: payload.name ?? "",
    });

    return res.status(200).json({
      id: payload.sub,
      email: payload.email,
      name: payload.name ?? "",
    });
    
  } catch (err) {
    console.warn("[auth/google] token invalido o error de verificacion", {
      message: err instanceof Error ? err.message : "unknown_error",
    });
    return res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/auth/social", (req, res) => {
  const { provider, user, metadata } = req.body ?? {};

  const allowedProviders = new Set(["google", "apple", "microsoft"]);
  if (!allowedProviders.has(provider)) {
    return res.status(400).json({ error: "provider invalido" });
  }

  if (!user?.email || typeof user.email !== "string") {
    return res.status(400).json({ error: "email requerido" });
  }

  const authEvent = {
    provider,
    user: {
      name: typeof user.name === "string" ? user.name : "",
      email: user.email,
      subscription:
        typeof user.subscription === "string" ? user.subscription : "Free",
    },
    metadata: metadata && typeof metadata === "object" ? metadata : null,
    authenticatedAt: new Date().toISOString(),
  };

  console.log("[auth/social]", JSON.stringify(authEvent));

  return res.status(201).json({
    ok: true,
    message: "Autenticacion registrada",
    data: authEvent,
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

    const r = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Eres el observatorio AEC. Responde breve, claro y en espanol, siempre presentate diciendo que eres el observatorio AEC, un observatorio conversacional.",
        },
        { role: "user", content: message.trim() },
      ],
    });

    return res.json({ reply: r.output_text });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "Error llamando a OpenAI" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listo en http://0.0.0.0:${PORT}`);
});
