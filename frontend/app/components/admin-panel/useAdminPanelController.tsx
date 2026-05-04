"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type {
  AdminCandidate,
  AdminRecord,
  AdminResultFilter,
  AdminUserRow,
  InteractionRule,
  InteractionScope,
  PanelTabId,
  StatusTone,
} from "./types";

type UseAdminPanelControllerParams = {
  open: boolean;
  apiBase: string;
  googleId?: string | null;
};

type UseAdminPanelControllerResult = {
  selectedFile: File | null;
  uploadStatus: string;
  uploadStatusTone: StatusTone;
  uploadError: string;
  isUploading: boolean;
  adminSearch: string;
  adminCandidates: AdminCandidate[];
  selectedAdminEmail: string;
  adminCandidatesLoading: boolean;
  adminCandidatesError: string;
  adminStatus: string;
  adminStatusTone: StatusTone;
  adminRecords: AdminRecord[];
  isAssigningAdmin: boolean;
  adminResultFilter: AdminResultFilter;
  interactionLimitsEnabled: boolean;
  interactionScope: InteractionScope;
  interactionTarget: string;
  maxMessagesPerDay: number;
  cooldownMinutes: number;
  temporaryBlockHours: number;
  autoReply: string;
  enforcementLevel: "observacion" | "moderado" | "estricto";
  interactionRules: InteractionRule[];
  activePanelTab: PanelTabId;
  showAdvancedLimits: boolean;
  adminSearchTerm: string;
  filteredAdminCandidates: AdminCandidate[];
  gmailCandidatesCount: number;
  matchedCandidatesCount: number;
  highlightMatch: (value: string, query: string) => ReactNode;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  setActivePanelTab: (tab: PanelTabId) => void;
  onSearchChange: (value: string) => void;
  onResultFilterChange: (value: AdminResultFilter) => void;
  onSelectCandidate: (candidate: AdminCandidate) => void;
  handleAssignAdmin: () => Promise<void>;
  handleUpload: () => Promise<void>;
  onToggleInteractionLimits: () => void;
  onInteractionScopeChange: (scope: InteractionScope) => void;
  onInteractionTargetChange: (value: string) => void;
  onMaxMessagesPerDayChange: (value: number) => void;
  onCooldownMinutesChange: (value: number) => void;
  onTemporaryBlockHoursChange: (value: number) => void;
  onAutoReplyChange: (value: string) => void;
  onEnforcementLevelChange: (value: "observacion" | "moderado" | "estricto") => void;
  onToggleAdvancedLimits: () => void;
  handleAddInteractionRule: () => Promise<void>;
  getScopeLabel: (scope: InteractionScope) => string;
};

const UPLOAD_TIMEOUT_MS = 120000;

const isGmailAddress = (value: string) => /@(?:gmail\.com|googlemail\.com)$/i.test(value.trim());

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function useAdminPanelController({
  open,
  apiBase = "",
  googleId,
}: UseAdminPanelControllerParams): UseAdminPanelControllerResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadStatusTone, setUploadStatusTone] = useState<StatusTone>("idle");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [adminSearch, setAdminSearch] = useState("");
  const [adminCandidates, setAdminCandidates] = useState<AdminCandidate[]>([]);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState("");
  const [adminCandidatesLoading, setAdminCandidatesLoading] = useState(false);
  const [adminCandidatesError, setAdminCandidatesError] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminStatusTone, setAdminStatusTone] = useState<StatusTone>("idle");
  const [adminRecords, setAdminRecords] = useState<AdminRecord[]>([]);
  const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
  const [adminResultFilter, setAdminResultFilter] = useState<AdminResultFilter>("all");

  const [interactionLimitsEnabled, setInteractionLimitsEnabled] = useState(true);
  const [interactionScope, setInteractionScope] = useState<InteractionScope>("usuario");
  const [interactionTarget, setInteractionTarget] = useState("");
  const [maxMessagesPerDay, setMaxMessagesPerDay] = useState(30);
  const [cooldownMinutes, setCooldownMinutes] = useState(10);
  const [temporaryBlockHours, setTemporaryBlockHours] = useState(2);
  const [autoReply, setAutoReply] = useState("Has alcanzado el limite de interacciones permitido para tu cuenta.");
  const [enforcementLevel, setEnforcementLevel] = useState<"observacion" | "moderado" | "estricto">("moderado");
  const [interactionRules, setInteractionRules] = useState<InteractionRule[]>([]);
  const [activePanelTab, setActivePanelTab] = useState<PanelTabId>("uploads");
  const [showAdvancedLimits, setShowAdvancedLimits] = useState(false);

  const uploadStatusTimerRef = useRef<number | null>(null);
  const progressTimersRef = useRef<number[]>([]);
  const searchDebounceRef = useRef<number | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const clearUploadStatusTimer = () => {
    if (uploadStatusTimerRef.current) {
      window.clearTimeout(uploadStatusTimerRef.current);
      uploadStatusTimerRef.current = null;
    }
  };

  const clearProgressTimers = () => {
    progressTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    progressTimersRef.current = [];
  };

  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setUploadStatus("");
      setUploadStatusTone("idle");
      setUploadError("");
      setIsUploading(false);
      setAdminSearch("");
      setAdminCandidates([]);
      setSelectedAdminEmail("");
      setAdminCandidatesLoading(false);
      setAdminCandidatesError("");
      setAdminStatus("");
      setAdminStatusTone("idle");
      setAdminRecords([]);
      setAdminResultFilter("all");
      setInteractionLimitsEnabled(true);
      setInteractionScope("usuario");
      setInteractionTarget("");
      setMaxMessagesPerDay(30);
      setCooldownMinutes(10);
      setTemporaryBlockHours(2);
      setAutoReply("Has alcanzado el limite de interacciones permitido para tu cuenta.");
      setEnforcementLevel("moderado");
      setInteractionRules([]);
      setActivePanelTab("uploads");
      setShowAdvancedLimits(false);
      clearUploadStatusTimer();
      clearProgressTimers();
    }

    return () => {
      clearUploadStatusTimer();
      clearProgressTimers();
    };
  }, [open]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError("");
    setUploadStatus("");
    setUploadStatusTone("idle");
    clearUploadStatusTimer();
  };

  const adminSearchTerm = adminSearch.trim();
  const adminSearchTermLower = adminSearchTerm.toLowerCase();

  const highlightMatch = (value: string, query: string) => {
    const needle = query.trim();
    if (!needle) return value;

    const parts = value.split(new RegExp(`(${escapeRegExp(needle)})`, "ig"));
    if (parts.length === 1) return value;

    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark key={`${value}-${index}`} className="rounded bg-amber-100 px-1 py-0.5 text-amber-950">
          {part}
        </mark>
      ) : (
        <span key={`${value}-${index}`}>{part}</span>
      )
    );
  };

  const filteredAdminCandidates = useMemo(
    () =>
      adminCandidates.filter((candidate) => {
        const matchesFilter =
          adminResultFilter === "all"
            ? true
            : adminResultFilter === "gmail"
              ? candidate.isGmail
              : [
                  candidate.name,
                  candidate.email,
                  candidate.profileCategory,
                  candidate.provider,
                  candidate.source,
                ]
                  .join(" ")
                  .toLowerCase()
                  .includes(adminSearchTermLower);

        return matchesFilter;
      }),
    [adminCandidates, adminResultFilter, adminSearchTermLower]
  );

  const gmailCandidatesCount = useMemo(
    () => adminCandidates.filter((candidate) => candidate.isGmail).length,
    [adminCandidates]
  );
  const matchedCandidatesCount = useMemo(
    () =>
      adminCandidates.filter((candidate) =>
        [
          candidate.name,
          candidate.email,
          candidate.profileCategory,
          candidate.provider,
          candidate.source,
        ]
          .join(" ")
          .toLowerCase()
          .includes(adminSearchTermLower)
      ).length,
    [adminCandidates, adminSearchTermLower]
  );

  useEffect(() => {
    if (!open) return;

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    const query = adminSearch.trim();
    searchDebounceRef.current = window.setTimeout(() => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      const bases = [
        apiBase?.replace(/\/$/, ""),
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, ""),
        "http://localhost:5000",
        "http://localhost:8080",
      ].filter((value): value is string => Boolean(value));
      const requestPath = `/admin/usuarios${query ? `?q=${encodeURIComponent(query)}&limit=25` : "?limit=25"}`;

      setAdminCandidatesLoading(true);
      setAdminCandidatesError("");

      (async () => {
        for (const base of bases) {
          const target = new URL(`${base}${requestPath}`);
          try {
            const response = await fetch(target.toString(), {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) continue;

            const users: AdminUserRow[] = Array.isArray(payload?.users) ? payload.users : [];
            const nextCandidates = users
              .map((user: AdminUserRow) => ({
                email: String(user.email ?? "").trim().toLowerCase(),
                name: typeof user.name === "string" && user.name.trim() ? user.name.trim() : "Usuario",
                source: "BigQuery usuarios",
                isGmail: Boolean(user.isGmail),
                lastSeen: Date.now(),
                profileConfirmed: Boolean(user.profileConfirmed),
                profileCategory:
                  typeof user.profileCategory === "string" && user.profileCategory.trim()
                    ? user.profileCategory.trim()
                    : "Sin perfil",
                tipoPerfil:
                  typeof user.tipoPerfil === "string" && user.tipoPerfil.trim()
                    ? user.tipoPerfil.trim().toLowerCase()
                    : "user",
                provider:
                  typeof user.provider === "string" && user.provider.trim()
                    ? user.provider.trim()
                    : "Google",
              }))
              .filter((user: AdminCandidate) => Boolean(user.email));

            setAdminCandidates(nextCandidates);
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
          }
        }

        setAdminCandidates([]);
        setAdminCandidatesError("No se pudo conectar al backend de usuarios.");
      })()
        .catch((error) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setAdminCandidates([]);
          setAdminCandidatesError(error instanceof Error ? error.message : "No se pudieron cargar los usuarios.");
        })
        .finally(() => {
          setAdminCandidatesLoading(false);
        });
    }, 250);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      searchAbortRef.current?.abort();
    };
  }, [open, adminSearch, apiBase]);

  const handleAssignAdmin = async () => {
    const nextEmail = selectedAdminEmail.trim().toLowerCase() || adminSearch.trim().toLowerCase();

    if (!nextEmail) {
      setAdminStatus("Busca y selecciona un usuario Gmail para asignarlo como administrador.");
      setAdminStatusTone("error");
      return;
    }

    if (!isGmailAddress(nextEmail)) {
      setAdminStatus("Solo se permiten cuentas Gmail para administradores.");
      setAdminStatusTone("error");
      return;
    }

    if (adminRecords.some((record) => record.email === nextEmail)) {
      setAdminStatus("Ese correo ya tiene un rol asignado en esta sesión.");
      setAdminStatusTone("error");
      return;
    }

    const bases = [
      apiBase?.replace(/\/$/, ""),
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, ""),
      "http://localhost:5000",
      "http://localhost:8080",
    ].filter((value): value is string => Boolean(value));

    setIsAssigningAdmin(true);
    setAdminStatus(`Asignando administrador para ${nextEmail}...`);
    setAdminStatusTone("progress");

    try {
      let lastError: Error | null = null;

      for (const base of bases) {
        const endpoint = `${base}/admin/usuarios/tipo-perfil`;

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: nextEmail,
              tipoPerfil: "admin",
            }),
          });

          const rawText = await response.text();
          let data: { ok?: boolean; error?: string } | null = null;

          if (rawText) {
            try {
              data = JSON.parse(rawText) as { ok?: boolean; error?: string };
            } catch {
              data = null;
            }
          }

          if (!response.ok) {
            const message = data?.error || rawText || `Respuesta ${response.status} del backend.`;
            lastError = new Error(message);
            continue;
          }

          if (!data?.ok) {
            lastError = new Error(data?.error || "Respuesta no válida del backend.");
            continue;
          }

          setAdminRecords((prev) => [{ email: nextEmail, createdAt: Date.now() }, ...prev]);
          setAdminCandidates((prev) =>
            prev.map((candidate) =>
              candidate.email === nextEmail ? { ...candidate, tipoPerfil: "admin" } : candidate
            )
          );
          setAdminStatus(`Administrador asignado a ${nextEmail}.`);
          setAdminStatusTone("success");
          setSelectedAdminEmail(nextEmail);
          setAdminSearch(nextEmail);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
          lastError = error instanceof Error ? error : new Error("No se pudo asignar el administrador.");
        }
      }

      throw lastError ?? new Error("No se pudo conectar con el backend para asignar admin.");
    } catch (error) {
      setAdminStatus(error instanceof Error ? error.message : "No se pudo asignar el administrador.");
      setAdminStatusTone("error");
    } finally {
      setIsAssigningAdmin(false);
    }
  };

  const getScopeLabel = (scope: InteractionScope) => {
    if (scope === "usuario") return "Usuario específico";
    if (scope === "plan") return "Por plan";
    if (scope === "perfil") return "Por perfil";
    return "Global";
  };

  const handleAddInteractionRule = async () => {
    const target = interactionTarget.trim();

    if (interactionScope !== "usuario") {
      setAdminStatus("Por ahora la persistencia real solo está disponible para Usuario específico.");
      setAdminStatusTone("error");
      return;
    }

    if (!target) {
      setAdminStatus("Define un objetivo para la regla de límites.");
      setAdminStatusTone("error");
      return;
    }

    if (!target.includes("@")) {
      setAdminStatus("Para el alcance usuario, escribe un correo válido.");
      setAdminStatusTone("error");
      return;
    }

    const bases = [
      apiBase?.replace(/\/$/, ""),
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, ""),
      "http://localhost:5000",
      "http://localhost:8080",
    ].filter((value): value is string => Boolean(value));

    setAdminStatus(`Guardando límite para ${target}...`);
    setAdminStatusTone("progress");

    let saved = false;
    let lastError: string | null = null;

    for (const base of bases) {
      const endpoint = `${base}/admin/usuarios/interacciones`;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: target,
            maxMessagesPerDay,
            cooldownMinutes,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          lastError = payload?.error ?? `Respuesta ${response.status} del backend.`;
          continue;
        }

        const nextRule: InteractionRule = {
          scope: "usuario",
          target,
          maxMessagesPerDay,
          cooldownMinutes,
          temporaryBlockHours,
          autoReply: autoReply.trim(),
          createdAt: Date.now(),
        };

        setInteractionRules((prev) => [nextRule, ...prev]);
        setAdminStatus(`Límite guardado para ${nextRule.target}.`);
        setAdminStatusTone("success");
        saved = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "No se pudo conectar con el backend.";
      }
    }

    if (!saved) {
      setAdminStatus(lastError ?? "No se pudo guardar la regla de límites.");
      setAdminStatusTone("error");
    }
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
    setUploadStatus("Subiendo archivo...");
    setUploadStatusTone("progress");
    clearUploadStatusTimer();
    clearProgressTimers();

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
      const content = await selectedFile.text();

      progressTimersRef.current.push(
        window.setTimeout(() => {
          setUploadStatus("Analizando transcripcion con ChatGPT...");
          setUploadStatusTone("progress");
        }, 3000)
      );
      progressTimersRef.current.push(
        window.setTimeout(() => {
          setUploadStatus("Guardando resumen y conclusion en BigQuery...");
          setUploadStatusTone("progress");
        }, 9000)
      );
      progressTimersRef.current.push(
        window.setTimeout(() => {
          setUploadStatus("Casi listo...");
          setUploadStatusTone("progress");
        }, 15000)
      );

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          filename: selectedFile.name,
          content,
          googleId: googleId ?? null,
        }),
      });

      window.clearTimeout(timeoutId);
      clearProgressTimers();

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo guardar el archivo.");
      }

      setUploadStatus(payload?.message || "Archivo recibido con exito.");
      setUploadStatusTone("success");
      clearUploadStatusTimer();
      uploadStatusTimerRef.current = window.setTimeout(() => {
        setUploadStatus("");
        setUploadStatusTone("idle");
        uploadStatusTimerRef.current = null;
      }, 4500);
    } catch (error) {
      clearProgressTimers();
      clearUploadStatusTimer();
      if (error instanceof DOMException && error.name === "AbortError") {
        setUploadError("La subida tardo demasiado y se cancelo.");
      } else {
        setUploadError(error instanceof Error ? error.message : "Ocurrio un error inesperado.");
      }
      setUploadStatusTone("error");
    } finally {
      clearProgressTimers();
      setIsUploading(false);
    }
  };

  const onSearchChange = (value: string) => {
    setAdminSearch(value);
    setSelectedAdminEmail("");
  };

  const onResultFilterChange = (value: AdminResultFilter) => {
    setAdminResultFilter(value);
  };

  const onSelectCandidate = (candidate: AdminCandidate) => {
    setAdminSearch(candidate.email);
    setSelectedAdminEmail(candidate.email);
    setAdminStatus("");
    setAdminStatusTone("idle");
  };

  const onToggleInteractionLimits = () => {
    setInteractionLimitsEnabled((prev) => !prev);
  };

  const onInteractionScopeChange = (scope: InteractionScope) => {
    setInteractionScope(scope);
    setInteractionTarget("");
  };

  return {
    selectedFile,
    uploadStatus,
    uploadStatusTone,
    uploadError,
    isUploading,
    adminSearch,
    adminCandidates,
    selectedAdminEmail,
    adminCandidatesLoading,
    adminCandidatesError,
    adminStatus,
    adminStatusTone,
    adminRecords,
    isAssigningAdmin,
    adminResultFilter,
    interactionLimitsEnabled,
    interactionScope,
    interactionTarget,
    maxMessagesPerDay,
    cooldownMinutes,
    temporaryBlockHours,
    autoReply,
    enforcementLevel,
    interactionRules,
    activePanelTab,
    showAdvancedLimits,
    adminSearchTerm,
    filteredAdminCandidates,
    gmailCandidatesCount,
    matchedCandidatesCount,
    highlightMatch,
    handleFileChange,
    setActivePanelTab,
    onSearchChange,
    onResultFilterChange,
    onSelectCandidate,
    handleAssignAdmin,
    handleUpload,
    onToggleInteractionLimits,
    onInteractionScopeChange,
    onInteractionTargetChange: setInteractionTarget,
    onMaxMessagesPerDayChange: setMaxMessagesPerDay,
    onCooldownMinutesChange: setCooldownMinutes,
    onTemporaryBlockHoursChange: setTemporaryBlockHours,
    onAutoReplyChange: setAutoReply,
    onEnforcementLevelChange: setEnforcementLevel,
    onToggleAdvancedLimits: () => setShowAdvancedLimits((prev) => !prev),
    handleAddInteractionRule,
    getScopeLabel,
  };
}
