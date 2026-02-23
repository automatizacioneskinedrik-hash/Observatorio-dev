<<<<<<< HEAD
import "dotenv/config";
=======
﻿import "dotenv/config";
>>>>>>> 2fc272d7544d0eae9c19b424ade8c7224aabf6e1
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

const PORT = Number(process.env.PORT ?? 8080);
<<<<<<< HEAD
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "https://observatorio-970552335718.europe-west1.run.app,https://observatorio-970552335718.europe-southwest1.run.app,http://localhost:3000")
=======
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:5000")
>>>>>>> 2fc272d7544d0eae9c19b424ade8c7224aabf6e1
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

<<<<<<< HEAD
app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "backend",
    message: "API activa. Usa GET /health o POST /chat",
  });
});

=======
>>>>>>> 2fc272d7544d0eae9c19b424ade8c7224aabf6e1
app.get("/health", (_req, res) => res.json({ ok: true }));

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
