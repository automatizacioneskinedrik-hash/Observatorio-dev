console.log("✅ Script ingest_drive_reuniones.cjs cargado");

/**
 * Ingesta Drive -> BigQuery (tabla: reuniones)
 *
 * Lee todos los archivos dentro de la carpeta DRIVE_TRANSCRIPTS_FOLDER_ID
 * y hace UPSERT en:
 *   observatorio_aec.reuniones
 *
 * 1 archivo = 1 reunión
 */

require("dotenv").config();

const { google } = require("googleapis");
const { BigQuery } = require("@google-cloud/bigquery");

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const DATASET = process.env.BQ_DATASET || "observatorio_aec";
const FOLDER_ID = process.env.DRIVE_TRANSCRIPTS_FOLDER_ID;

if (!PROJECT_ID) throw new Error("Falta env var: GCP_PROJECT_ID");
if (!FOLDER_ID) throw new Error("Falta env var: DRIVE_TRANSCRIPTS_FOLDER_ID");

const bq = new BigQuery({ projectId: PROJECT_ID });

/**
 * Cliente Drive usando ADC:
 * Local:
 *   gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/drive.readonly"
 *
 * Cloud Run:
 *   usa la service account del servicio
 */
async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Lee contenido del archivo como texto
 */
async function readDriveFileAsText(drive, file) {
  const isGoogleDoc =
    file.mimeType === "application/vnd.google-apps.document";

  if (isGoogleDoc) {
    const res = await drive.files.export(
      {
        fileId: file.id,
        mimeType: "text/plain",
        supportsAllDrives: true,
      },
      { responseType: "text" }
    );

    return res.data || "";
  }

  const res = await drive.files.get(
    {
      fileId: file.id,
      alt: "media",
      supportsAllDrives: true,
    },
    { responseType: "text" }
  );

  return res.data || "";
}

/**
 * Lista todos los archivos dentro de la carpeta
 */
async function listFilesInFolder(drive) {
  const files = [];
  let pageToken = undefined;

  do {
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed=false`,
      fields:
        "nextPageToken, files(id,name,mimeType,modifiedTime,owners(emailAddress))",
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: "allDrives",
    });

    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

/**
 * UPSERT en observatorio_aec.reuniones
 */
async function upsertReunion(params) {
  const query = `
MERGE \`${PROJECT_ID}.${DATASET}.reuniones\` T
USING (
  SELECT
    @id AS id,
    @correo AS correo,
    SAFE_CAST(@hora_reunion AS TIMESTAMP) AS hora_reunion,
    @transcripcion AS transcripcion
) S
ON T.id = S.id
WHEN MATCHED THEN UPDATE SET
  correo = S.correo,
  hora_reunion = S.hora_reunion,
  transcripcion = S.transcripcion
WHEN NOT MATCHED THEN
  INSERT (id, correo, hora_reunion, resumen, transcripcion, conclusion)
  VALUES (S.id, S.correo, S.hora_reunion, NULL, S.transcripcion, NULL);
`;

  await bq.query({ query, params });
}

async function main() {
  const drive = await getDriveClient();

  console.log("📂 FolderId:", FOLDER_ID);
  console.log("🔎 Listando archivos...");

  const files = await listFilesInFolder(drive);
  console.log(`✅ Encontrados ${files.length} archivos`);

  let ok = 0;
  let fail = 0;

  for (const f of files) {
    const driveFileId = f.id;
    const name = f.name || "Sin nombre";
    const modifiedTime = f.modifiedTime || null;

    const ownerEmail =
      f.owners && f.owners[0] && f.owners[0].emailAddress
        ? f.owners[0].emailAddress
        : null;

    const reunionId = `drv_${driveFileId}`;

    try {
      const transcriptText = await readDriveFileAsText(drive, f);

      await upsertReunion({
        id: reunionId,
        correo: ownerEmail,
        hora_reunion: modifiedTime,
        transcripcion: transcriptText,
      });

      ok += 1;
      console.log(
        `✅ OK (${ok}) -> ${name} | ${reunionId} | chars=${transcriptText.length}`
      );
    } catch (e) {
      fail += 1;
      console.error(`❌ FAIL -> ${name} (${driveFileId})`);
      console.error(e?.message || e);
    }
  }

  console.log("----");
  console.log(`✅ Completado. OK=${ok} FAIL=${fail}`);

  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("❌ Error fatal:", e?.message || e);
  process.exit(1);
});
