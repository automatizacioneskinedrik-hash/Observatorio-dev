import express from "express";
import { getOpenAIClient } from "../config/openai.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "message requerido" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Falta OPENAI_API_KEY" });

    const normalizedMessage = String(message).trim();
    const isGreeting = /^(hola|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey|hello)\b/i.test(normalizedMessage);

    const client = getOpenAIClient(apiKey);
    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: isGreeting
            ? 'Eres AECO IA. Si el usuario saluda, responde una sola vez con: "Hola, soy AECO IA, una IA conversacional." y luego continua con una respuesta breve, clara y en espanol.'
            : "Eres AECO IA. Responde breve, claro y en espanol. No te presents ni repitas que eres una IA conversacional.",
        },
        { role: "user", content: normalizedMessage },
      ],
    });

    return res.json({ reply: r.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI error:", err);
    return res.status(500).json({ error: "Error llamando a OpenAI" });
  }
});

export default router;
