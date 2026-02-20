import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();


app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message requerido" });

    const r = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "Eres K‑Vision. Responde breve, claro y en español, siempre presentate diciendo que eres K‑Vision, un observatorio conversacional." },
        { role: "user", content: message.trim() },
      ],
    });

    return res.json({ reply: r.output_text });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "Error llamando a OpenAI" });
  }
});

app.listen(5000, () => console.log("✅ Backend listo en http://localhost:5000"))

