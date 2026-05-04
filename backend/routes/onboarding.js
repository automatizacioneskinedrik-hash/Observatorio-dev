import express from "express";
import { getOpenAIClient } from "../config/openai.js";
import { normalizeEmail, isValidEmail } from "../utils/validators.js";
import { normalizeCategory } from "../utils/helpers.js";
import { upsertUserByEmail } from "../services/userService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const respuestas = Array.isArray(req.body?.respuestas) ? req.body.respuestas : [];

    if (!isValidEmail(email)) return res.status(400).json({ error: "Email invalido" });
    if (respuestas.length !== 3 || respuestas.some((r) => String(r ?? "").trim().length < 15)) {
      return res.status(400).json({
        error: "Debes responder las 3 preguntas con suficiente detalle.",
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[api/configurar-onboarding] falta OPENAI_API_KEY");
      return res.status(500).json({ error: "Falta OPENAI_API_KEY" });
    }

    console.log("[api/configurar-onboarding] iniciando analisis de IA", {
      email,
      respuestas: respuestas.map((r) => String(r ?? "").trim().slice(0, 120)),
    });

    const prompt = `
Eres un clasificador de perfil profesional para onboarding.
Tu tarea: clasificar a la persona en una sola categoria de esta lista exacta:
- CEO
- Dueño
- Inversor
- Líder Directivo
- Coordinador
- Técnico Profesional

Usa el contenido de sus respuestas para inferir su rol real segun:
1) nivel de decision
2) relacion con el negocio
3) enfoque diario (estrategico/operativo/tecnico)

Responde SOLO en JSON valido con esta forma exacta:
{
  "categoria": "una categoria exacta de la lista",
  "analisis": "explicacion breve y personalizada en maximo 45 palabras"
}

No uses categorias fuera de la lista.
`;

    const content = `Pregunta 1:\n${String(respuestas[0]).trim()}\n\nPregunta 2:\n${String(
      respuestas[1]
    ).trim()}\n\nPregunta 3:\n${String(respuestas[2]).trim()}`;

    const client = getOpenAIClient(apiKey);
    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.trim() },
        { role: "user", content },
      ],
    });

    const raw = r.choices?.[0]?.message?.content ?? "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const categoria = normalizeCategory(parsed?.categoria) ?? "Coordinador";
    const analisis =
      typeof parsed?.analisis === "string" && parsed.analisis.trim()
        ? parsed.analisis.trim().slice(0, 320)
        : "Tu perfil refleja como decides, te vinculas al negocio y priorizas tu trabajo semanal.";

    await upsertUserByEmail({
      email,
      provider: "social",
      profileConfirmed: true,
      profileCategory: categoria,
      profileAnalysis: analisis,
    });

    return res.status(200).json({
      categoria,
      analisis,
      isProfileComplete: true,
    });
  } catch (err) {
    console.error("[api/configurar-onboarding] error:", err);
    return res.status(500).json({ error: "Error interno analizando onboarding" });
  }
});

export default router;
