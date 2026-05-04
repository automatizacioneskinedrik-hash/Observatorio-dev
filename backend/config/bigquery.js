import { BigQuery } from "@google-cloud/bigquery";
import { BQ_PROJECT_ID } from "./constants.js";

export const bigquery = new BigQuery(
  BQ_PROJECT_ID ? { projectId: BQ_PROJECT_ID } : {}
);

let adminBigQueryClient = null;

export function getAdminBigQueryClient() {
  if (adminBigQueryClient) return adminBigQueryClient;

  try {
    adminBigQueryClient = new BigQuery();
    return adminBigQueryClient;
  } catch (error) {
    console.error("No se pudo cargar @google-cloud/bigquery para el panel de administración:", error);
    return null;
  }
}
