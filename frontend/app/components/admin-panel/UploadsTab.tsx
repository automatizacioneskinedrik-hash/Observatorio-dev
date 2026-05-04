"use client";

import type { ChangeEvent } from "react";
import type { StatusTone } from "./types";

type UploadsTabProps = {
  selectedFile: File | null;
  isUploading: boolean;
  uploadError: string;
  uploadStatus: string;
  uploadStatusTone: StatusTone;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
};

export function UploadsTab({
  selectedFile,
  isUploading,
  uploadError,
  uploadStatus,
  uploadStatusTone,
  onFileChange,
  onUpload,
}: UploadsTabProps) {
  return (
    <section className="space-y-4" id="panel-content-uploads">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_280px]">
        <label className="group block cursor-pointer rounded-[24px] border-2 border-dashed border-[#BEE1D0] bg-gradient-to-br from-white to-[#F4FBF7] p-8 text-center shadow-[0_10px_24px_rgba(0,0,0,0.03)] transition-all hover:border-emerald-300 hover:shadow-[0_12px_26px_rgba(0,0,0,0.05)]">
          <div className="flex min-h-[220px] flex-col items-center justify-center">
            <div className="rounded-full bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary shadow-[0_4px_10px_rgba(15,61,46,0.04)]">
              Sube transcripciones listas para analizar
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-on-surface-variant">
              Arrastra un archivo o haz clic para seleccionar. La transcripción completa se guardará
              en BigQuery y luego se procesará con IA.
            </p>
            <input
              accept=".txt,.vtt,.webvtt,text/plain,text/vtt"
              className="hidden"
              onChange={onFileChange}
              type="file"
            />
            <span className="mt-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-primary/15">
              Seleccionar archivo
            </span>
          </div>
        </label>

        <div className="rounded-[24px] border border-[#E7EEE9] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.03)]">
          <div className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
            Flujo
          </div>
          <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 px-4 py-3 text-emerald-900">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-700">
                1
              </span>
              <div>
                <div className="font-semibold text-on-surface">Selecciona el archivo</div>
                <div className="text-xs leading-5">Texto, VTT o subtítulos de la reunión.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700">
                2
              </span>
              <div>
                <div className="font-semibold text-on-surface">Revisa el estado</div>
                <div className="text-xs leading-5">Verás si el archivo subió, se analizó o falló.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700">
                3
              </span>
              <div>
                <div className="font-semibold text-on-surface">Se guarda el resumen</div>
                <div className="text-xs leading-5">Luego queda listo en la misma tabla de reuniones.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-6 text-sm text-on-surface-variant">
          {selectedFile ? (
            <span className="font-medium text-on-surface">
              Archivo seleccionado: {selectedFile.name}
            </span>
          ) : (
            <span>No has seleccionado ningun archivo todavia.</span>
          )}
        </div>

        <button
          className="cursor-pointer rounded-full border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedFile || isUploading}
          onClick={onUpload}
          type="button"
        >
          {isUploading ? "Subiendo..." : "Subir archivo"}
        </button>
      </div>

      {uploadError ? (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error-container">
          {uploadError}
        </div>
      ) : null}

      {uploadStatus ? (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-all ${
            uploadStatusTone === "success"
              ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
              : uploadStatusTone === "error"
                ? "border border-rose-200 bg-rose-50 text-rose-700"
                : "border border-emerald-200 bg-emerald-50/70 text-emerald-900"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex size-2.5 shrink-0 rounded-full ${
                uploadStatusTone === "success"
                  ? "bg-emerald-500"
                  : uploadStatusTone === "error"
                    ? "bg-rose-500"
                    : "bg-emerald-400"
              }`}
            />
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">
                {uploadStatusTone === "success"
                  ? "Recibido"
                  : uploadStatusTone === "error"
                    ? "Error"
                    : "En proceso"}
              </div>
              <div>{uploadStatus}</div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
