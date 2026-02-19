import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// ✅ Docker/Cloud: usa env vars (con fallback local)
const PORT = Number(process.env.PORT ?? 5000);
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Permite requests sin origin (Postman/curl)
    if (!origin) return cb(null, true);
    return CORS_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error("CORS bloqueado"));
  },
}));

app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "message requerido" });
    }

    const r = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "Eres el observatorio AEC. Responde breve, claro y en español, siempre presentate diciendo que eres el observatorio AEC, un observatorio conversacional.",
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

app.listen(PORT, () => {
  console.log(`✅ Backend listo en http://localhost:${PORT}`);
});
