import { getOpenAIClient } from "../config/openai.js";
import { isStreamingBufferError, waitForRetryDelay } from "../utils/helpers.js";

export function buildMeetingInsightsPrompt(transcriptChunk) {
  const systemPrompt = `
Eres un analista experto de transcripciones de reuniones para un observatorio AEC.
Tu tarea es leer la transcripcion y devolver una salida util para almacenamiento y consulta.

Debes generar exactamente estas claves:
{
  "resumen": "resumen breve, claro y ejecutivo",
  "conclusion": "conclusion final con decisiones, acuerdos o implicaciones"
}

Reglas:
- Responde solo JSON valido, sin markdown ni texto adicional.
- Escribe todo en español.
- Resume los puntos mas importantes, decisiones, riesgos y proximos pasos.
- El texto de cada campo debe ser concreto y no superar 1200 caracteres.
- Si la transcripcion es extensa, prioriza lo relevante para decision y seguimiento.
`.trim();

  const userPrompt = `
Analiza la siguiente transcripcion de reunion y extrae:
1) un resumen ejecutivo
2) una conclusion final

Transcripcion:
${transcriptChunk}
`.trim();

  return { systemPrompt, userPrompt };
}

export async function generateMeetingInsights(transcript) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[admin/reuniones/import] OPENAI_API_KEY no configurada; se omite el resumen.");
    return { resumen: "", conclusion: "", hasInsights: false };
  }

  const model = process.env.OPENAI_SUMMARY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const transcriptChunk = transcript.slice(0, 30000);
  const client = getOpenAIClient(apiKey);
  const prompt = buildMeetingInsightsPrompt(transcriptChunk);

  console.log("[admin/reuniones/import] generando insights con OpenAI", {
    model,
    transcript_length: transcript.length,
    chunk_length: transcriptChunk.length,
  });

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: prompt.userPrompt },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("[admin/reuniones/import] OpenAI devolvio JSON invalido");
      parsed = {};
    }

    const resumen = (parsed.resumen || "").trim().slice(0, 1200);
    const conclusion = (parsed.conclusion || "").trim().slice(0, 1200);

    return {
      resumen,
      conclusion,
      hasInsights: Boolean(resumen || conclusion),
    };
  } catch (error) {
    console.error("[admin/reuniones/import] error generando resumen y conclusion:", error);
    return { resumen: "", conclusion: "", hasInsights: false };
  }
}

export async function upsertMeetingTranscript({
  bigQuery,
  tableConfig,
  meetingId,
  meetingDate,
  transcript,
  googleId,
  insights,
}) {
  const params = {
    meetingId,
    meetingDate,
    transcript,
    googleId: typeof googleId === "string" && googleId.trim() ? googleId.trim() : "",
    resumen: insights?.resumen || "",
    conclusion: insights?.conclusion || "",
  };

  const query = `
INSERT INTO ${tableConfig.queryTableRef} (
  fecha_hora, resumen, transcripcion, conclusion, google_id, id_reunion
)
VALUES (
  @meetingDate, @resumen, @transcript, @conclusion, @googleId, @meetingId
);
`;
  await bigQuery.query({ query, params });
}

export async function updateMeetingInsights({ bigQuery, tableConfig, meetingId, insights }) {
  const query = `
UPDATE ${tableConfig.queryTableRef}
SET resumen = @resumen,
    conclusion = @conclusion
WHERE id_reunion = @meetingId
`;
  await bigQuery.query({
    query,
    params: {
      meetingId,
      resumen: insights.resumen,
      conclusion: insights.conclusion,
    },
  });
}

export async function updateMeetingInsightsWithRetry({ bigQuery, tableConfig, meetingId, insights }) {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await updateMeetingInsights({ bigQuery, tableConfig, meetingId, insights });
      return;
    } catch (error) {
      if (!isStreamingBufferError(error) || attempt === maxAttempts - 1) throw error;
      console.warn("[admin/reuniones/import] fila aun en streaming buffer; se reintentara", {
        id_reunion: meetingId,
        attempt: attempt + 1,
      });
      await waitForRetryDelay(attempt);
    }
  }
}

export function queueMeetingInsightsAnalysis({ bigQuery, tableConfig, meetingId, transcript }) {
  setImmediate(() => {
    void (async () => {
      try {
        const insights = await generateMeetingInsights(transcript);
        await updateMeetingInsightsWithRetry({ bigQuery, tableConfig, meetingId, insights });
      } catch (error) {
        console.error("[admin/reuniones/import] error en analisis diferido:", error);
      }
    })();
  });
}
