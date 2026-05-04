"use client";

import type { ReactNode } from "react";
import { ArrowRight, Search, ShieldCheck, Users } from "lucide-react";
import type { AdminCandidate, AdminRecord, AdminResultFilter } from "./types";

type AdminsTabProps = {
  adminSearch: string;
  selectedAdminEmail: string;
  adminCandidatesCount: number;
  adminCandidatesLoading: boolean;
  adminCandidatesError: string;
  adminResultFilter: AdminResultFilter;
  filteredAdminCandidates: AdminCandidate[];
  gmailCandidatesCount: number;
  matchedCandidatesCount: number;
  adminSearchTerm: string;
  adminRecords: AdminRecord[];
  isAssigningAdmin: boolean;
  statusBanner: ReactNode;
  onSearchChange: (value: string) => void;
  onResultFilterChange: (value: AdminResultFilter) => void;
  onSelectCandidate: (candidate: AdminCandidate) => void;
  onAssignAdmin: () => void;
  highlightMatch: (value: string, query: string) => ReactNode;
};

export function AdminsTab({
  adminSearch,
  selectedAdminEmail,
  adminCandidatesCount,
  adminCandidatesLoading,
  adminCandidatesError,
  adminResultFilter,
  filteredAdminCandidates,
  gmailCandidatesCount,
  matchedCandidatesCount,
  adminSearchTerm,
  adminRecords,
  isAssigningAdmin,
  statusBanner,
  onSearchChange,
  onResultFilterChange,
  onSelectCandidate,
  onAssignAdmin,
  highlightMatch,
}: AdminsTabProps) {
  return (
    <section className="space-y-4" id="panel-content-admins">
      <div className="rounded-[24px] border border-[#DDEADF] bg-[#FBFCFB] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-on-surface">Buscador de usuarios</h3>
              <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                Busca por correo o nombre y selecciona solo cuentas Gmail para asignarlas como admin.
              </p>
            </div>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
            Fuente: tabla `usuarios` de BigQuery
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E7EEE9] bg-white px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              Resultados
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">
              {adminCandidatesLoading ? "Buscando..." : `${adminCandidatesCount} usuarios`}
            </div>
          </div>
          <div className="rounded-2xl border border-[#E7EEE9] bg-white px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              Selección
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">
              {selectedAdminEmail || "Sin elegir"}
            </div>
          </div>
          <div className="rounded-2xl border border-[#E7EEE9] bg-white px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              Regla
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">Solo Gmail</div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                Buscar usuario
              </span>
              <div className="flex items-center gap-3 rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
                <Search size={16} className="shrink-0 text-emerald-700" />
                <input
                  value={adminSearch}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar por correo o nombre"
                  className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                  type="text"
                />
              </div>
              <p className="text-xs text-on-surface-variant">
                El buscador consulta la tabla `usuarios` en BigQuery. Las coincidencias se resaltan en nombre, correo y perfil.
              </p>
            </label>

            <div className="rounded-[24px] border border-[#E7EEE9] bg-white p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Resultados
                  </div>
                  <div className="mt-1 text-xs text-on-surface-variant">
                    {adminCandidatesLoading
                      ? "Buscando coincidencias..."
                      : `${filteredAdminCandidates.length} visibles de ${adminCandidatesCount} encontrados`}
                  </div>
                </div>

                {!adminCandidatesLoading && adminCandidatesCount > 0 ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    {filteredAdminCandidates.length} visibles
                  </span>
                ) : null}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onResultFilterChange("all")}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                    adminResultFilter === "all"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => onResultFilterChange("gmail")}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                    adminResultFilter === "gmail"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"
                  }`}
                >
                  Solo Gmail ({gmailCandidatesCount})
                </button>
                <button
                  type="button"
                  onClick={() => onResultFilterChange("matched")}
                  disabled={!adminSearchTerm}
                  className={`cursor-pointer rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                    adminResultFilter === "matched"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40"
                  } ${!adminSearchTerm ? "cursor-not-allowed opacity-60 hover:bg-white hover:border-slate-200" : ""}`}
                >
                  Coincidencias ({matchedCandidatesCount})
                </button>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {adminCandidatesError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                    {adminCandidatesError}
                  </div>
                ) : adminCandidatesLoading ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-on-surface-variant">
                    Cargando usuarios desde BigQuery...
                  </div>
                ) : filteredAdminCandidates.length > 0 ? (
                  filteredAdminCandidates.map((candidate) => {
                    const active = selectedAdminEmail === candidate.email;
                    const allowed = candidate.isGmail;
                    const profileLabel = candidate.profileCategory || "Sin perfil";
                    const roleLabel =
                      candidate.tipoPerfil === "admin"
                        ? "Admin"
                        : candidate.tipoPerfil === "user"
                          ? "User"
                          : candidate.tipoPerfil || "Sin rol";

                    return (
                      <button
                        key={candidate.email}
                        type="button"
                        onClick={() => onSelectCandidate(candidate)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                          active
                            ? "border-emerald-300 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/60"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-on-surface">
                                {highlightMatch(candidate.name, adminSearchTerm)}
                              </div>
                              <div className="mt-1 truncate text-xs text-on-surface-variant">
                                {highlightMatch(candidate.email, adminSearchTerm)}
                              </div>
                            </div>

                            <div
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                allowed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {allowed ? "Gmail" : "No Gmail"}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#F4F7F5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                              Perfil: {highlightMatch(profileLabel, adminSearchTerm)}
                            </span>
                            <span className="rounded-full bg-[#F4F7F5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                              {candidate.profileConfirmed ? "Perfil confirmado" : "Perfil pendiente"}
                            </span>
                            <span className="rounded-full bg-[#F4F7F5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                              {candidate.provider}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                                candidate.tipoPerfil === "admin"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-slate-400" />
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-on-surface-variant">
                    No encontramos usuarios con ese filtro en BigQuery. Prueba con otro correo o nombre, o cambia los filtros rápidos.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-on-surface-variant">
                Solo Gmail puede recibir permisos de administrador.
              </div>
              <button
                className="cursor-pointer rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                onClick={onAssignAdmin}
                disabled={isAssigningAdmin}
                type="button"
              >
                {isAssigningAdmin ? "Asignando..." : "Asignar admin"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {statusBanner}
            <div className="rounded-[24px] border border-emerald-100 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                <ShieldCheck size={14} />
                Administradores en sesión
              </div>
              {adminRecords.length > 0 ? (
                <div className="space-y-2">
                  {adminRecords.map((record) => (
                    <div
                      key={`${record.email}-${record.createdAt}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-on-surface">{record.email}</div>
                        <div className="text-xs text-on-surface-variant">Administrador</div>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                        Gmail
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-on-surface-variant">
                  Todavía no agregaste administradores a esta sesión.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
