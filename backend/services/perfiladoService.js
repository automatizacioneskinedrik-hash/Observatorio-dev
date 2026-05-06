import { bigquery } from "../config/bigquery.js";
import { getOpenAIClient } from "../config/openai.js";
import { upsertUserByEmail } from "./userService.js";

const DATASET = "observatorio_aec";
const TABLE = "respuestas_perfilado";

export async function guardarRespuestasPerfilado({ google_id, preguntas, respuestas, dimensiones }) {
  const fecha_registro = new Date().toISOString();

  const rows = preguntas.map((pregunta, i) => ({
    google_id,
    pregunta,
    respuesta: respuestas[i] ?? "",
    dimension: dimensiones[i] ?? "",
    fecha_registro,
  }));

  await bigquery
    .dataset(DATASET)
    .table(TABLE)
    .insert(rows);

  console.log(`[perfiladoService] ${rows.length} respuestas guardadas para ${google_id}`);
}

export async function extraerYGuardarPais({ google_id, transcripcion }) {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Extrae el país mencionado en el texto. Responde SOLO en JSON con esta forma exacta:
{
  "pais": "nombre del país en español, o null si no se menciona ninguno"
}`,
        },
        { role: "user", content: transcripcion },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const pais = typeof parsed?.pais === "string" ? parsed.pais.trim() : null;

    if (pais) {
      const [rows] = await bigquery.query({
        query: `SELECT correo FROM \`observatorio-dev.observatorio_aec.usuarios\` WHERE google_id = @google_id LIMIT 1`,
        params: { google_id },
      });

      if (rows.length > 0) {
        await upsertUserByEmail({ email: rows[0].correo, pais });
        console.log(`[perfiladoService] País guardado: ${pais} para ${google_id}`);
      }
    }
  } catch (err) {
    console.error("[perfiladoService] Error extrayendo país:", err);
  }
}