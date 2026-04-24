"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";

type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
  apiBase?: string;
  googleId?: string | null;
};

export function AdminPanelModal({
  open,
  onClose,
  apiBase = "",
  googleId,
}: AdminPanelModalProps) {
  const UPLOAD_TIMEOUT_MS = 120000;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setUploadStatus("");
      setUploadError("");
      setIsUploading(false);
    }

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError("");
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Selecciona un archivo primero.");
      return;
    }

    const uploadEndpoint = apiBase
      ? `${apiBase.replace(/\/$/, "")}/admin/reuniones/import`
      : "/api/admin/reuniones/import";

    setIsUploading(true);
    setUploadError("");
    setUploadStatus("");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
      const content = await selectedFile.text();

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          filename: selectedFile.name,
          content,
          googleId: googleId ?? null,
        }),
      });

      window.clearTimeout(timeoutId);

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar el archivo.");
      }

      setUploadStatus(payload?.message || "Archivo recibido con exito.");
      closeTimerRef.current = window.setTimeout(() => {
        onClose();
      }, 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setUploadError("La subida tardo demasiado y se cancelo.");
      } else {
        setUploadError(error instanceof Error ? error.message : "Ocurrio un error inesperado.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 backdrop-blur-[6px]">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[16px] border border-[#DDEADF] bg-white/96 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between px-8 py-6">
          <div>
            <h2 className="font-headline text-xl font-semibold tracking-tight text-on-surface">
              Panel de Administración
            </h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-on-surface-variant">
              Cargar transcripciones
            </p>
          </div>

          <button
            aria-label="Cerrar panel"
            className="cursor-pointer text-on-surface-variant transition-colors hover:text-on-surface"
            onClick={onClose}
            type="button"
          >
            <span className="text-[22px] leading-none">×</span>
          </button>
        </div>

        <div className="max-h-[716px] overflow-y-auto px-8 pb-8 pt-2">
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">
                  Cargar Transcripciones
                </span>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>

              <label className="block cursor-pointer rounded-[18px] border-2 border-dashed border-[#CBE5D8] bg-[#FBFCFB] p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-full bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary shadow-[0_4px_10px_rgba(15,61,46,0.04)]">
                    Sube documentos, transcripciones o audios
                  </div>
                  <p className="mt-5 max-w-xl text-sm leading-6 text-on-surface-variant">
                    Arrastra un archivo o haz clic para seleccionar. La transcripción completa se guardará
                    en BigQuery.
                  </p>
                  <input
                    accept=".txt,.vtt,.webvtt,text/plain,text/vtt"
                    className="hidden"
                    onChange={handleFileChange}
                    type="file"
                  />
                  <span className="mt-6 inline-flex rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-semibold text-secondary transition-colors hover:bg-primary/15">
                    Seleccionar archivos
                  </span>
                </div>
              </label>

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
                  onClick={handleUpload}
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
                <div className="rounded-xl border border-secondary/30 bg-secondary/15 px-4 py-3 text-sm font-semibold text-secondary">
                  {uploadStatus}
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 bg-[#F8FBF9] px-8 py-6">
          <button
            className="cursor-pointer px-6 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="cursor-pointer rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#97cbb3]"
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
