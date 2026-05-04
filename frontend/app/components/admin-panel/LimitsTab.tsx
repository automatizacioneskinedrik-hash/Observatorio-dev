"use client";

import { ChevronDown, ChevronUp, Search, Sparkles } from "lucide-react";
import type { InteractionRule, InteractionScope } from "./types";

const SAFETY_LEVELS: { value: "observacion" | "moderado" | "estricto"; label: string; description: string }[] =
  [
    {
      value: "observacion",
      label: "Observación",
      description: "Solo marca señales, sin bloquear.",
    },
    {
      value: "moderado",
      label: "Moderado",
      description: "Marca y sugiere revisión humana.",
    },
    {
      value: "estricto",
      label: "Estricto",
      description: "Interviene antes de mostrar contenido delicado.",
    },
  ];

type LimitsTabProps = {
  interactionLimitsEnabled: boolean;
  interactionScope: InteractionScope;
  interactionTarget: string;
  maxMessagesPerDay: number;
  cooldownMinutes: number;
  temporaryBlockHours: number;
  autoReply: string;
  enforcementLevel: "observacion" | "moderado" | "estricto";
  showAdvancedLimits: boolean;
  interactionRules: InteractionRule[];
  getScopeLabel: (scope: InteractionScope) => string;
  onToggleInteractionLimits: () => void;
  onInteractionScopeChange: (scope: InteractionScope) => void;
  onInteractionTargetChange: (value: string) => void;
  onMaxMessagesPerDayChange: (value: number) => void;
  onCooldownMinutesChange: (value: number) => void;
  onTemporaryBlockHoursChange: (value: number) => void;
  onAutoReplyChange: (value: string) => void;
  onEnforcementLevelChange: (value: "observacion" | "moderado" | "estricto") => void;
  onToggleAdvancedLimits: () => void;
  onAddInteractionRule: () => void;
};

export function LimitsTab({
  interactionLimitsEnabled,
  interactionScope,
  interactionTarget,
  maxMessagesPerDay,
  cooldownMinutes,
  temporaryBlockHours,
  autoReply,
  enforcementLevel,
  showAdvancedLimits,
  interactionRules,
  getScopeLabel,
  onToggleInteractionLimits,
  onInteractionScopeChange,
  onInteractionTargetChange,
  onMaxMessagesPerDayChange,
  onCooldownMinutesChange,
  onTemporaryBlockHoursChange,
  onAutoReplyChange,
  onEnforcementLevelChange,
  onToggleAdvancedLimits,
  onAddInteractionRule,
}: LimitsTabProps) {
  return (
    <section className="space-y-4" id="panel-content-limits">
      <div className="rounded-[24px] border border-[#DDEADF] bg-gradient-to-br from-[#FBFCFB] to-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-on-surface">
                Límites de interacción por usuario
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Define topes de mensajes, enfriamiento y bloqueo temporal por correo de usuario.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleInteractionLimits}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              interactionLimitsEnabled
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span
              className={`inline-flex size-2.5 rounded-full ${
                interactionLimitsEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            {interactionLimitsEnabled ? "Límites activos" : "Límites inactivos"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E7EEE9] bg-white px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              Alcance
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">
              {getScopeLabel(interactionScope)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#E7EEE9] bg-white px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              Límite
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">
              {maxMessagesPerDay} msg/día
            </div>
          </div>
          <div className="rounded-2xl border border-[#E7EEE9] bg-white px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-secondary">
              Bloqueo
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">
              {temporaryBlockHours} h
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {SAFETY_LEVELS.map((level) => {
            const active = enforcementLevel === level.value;

            return (
              <button
                key={level.value}
                type="button"
                onClick={() => onEnforcementLevelChange(level.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  active
                    ? "border-emerald-300 bg-emerald-50 shadow-sm"
                    : "border-[#E7EEE9] bg-white hover:border-emerald-200"
                }`}
              >
                <div className="text-sm font-semibold text-on-surface">{level.label}</div>
                <div className="mt-1 text-xs leading-5 text-on-surface-variant">
                  {level.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-[22px] border border-[#E7EEE9] bg-white px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-on-surface">Configuración avanzada</div>
            <div className="text-xs text-on-surface-variant">Ajustes por correo de usuario.</div>
          </div>
          <button
            type="button"
            onClick={onToggleAdvancedLimits}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            {showAdvancedLimits ? "Ocultar" : "Ver más"}
            {showAdvancedLimits ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showAdvancedLimits ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                  Alcance
                </span>
                <select
                  value={interactionScope}
                  onChange={(event) => {
                    const nextScope = event.target.value as InteractionScope;
                    onInteractionScopeChange(nextScope);
                  }}
                  className="w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                >
                  <option value="usuario">Usuario específico</option>
                  <option value="plan">Por plan</option>
                  <option value="perfil">Por perfil</option>
                  <option value="global">Global</option>
                </select>
              </label>

              {interactionScope === "usuario" ? (
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Correo del usuario
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3">
                    <Search size={16} className="shrink-0 text-emerald-700" />
                    <input
                      value={interactionTarget}
                      onChange={(event) => onInteractionTargetChange(event.target.value)}
                      placeholder="usuario@dominio.com"
                      className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                      type="email"
                    />
                  </div>
                </label>
              ) : interactionScope === "plan" ? (
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Plan afectado
                  </span>
                  <select
                    value={interactionTarget}
                    onChange={(event) => onInteractionTargetChange(event.target.value)}
                    className="w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                  >
                    <option value="">Selecciona un plan</option>
                    <option value="Free">Free</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </label>
              ) : interactionScope === "perfil" ? (
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Perfil afectado
                  </span>
                  <select
                    value={interactionTarget}
                    onChange={(event) => onInteractionTargetChange(event.target.value)}
                    className="w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                  >
                    <option value="">Selecciona un perfil</option>
                    <option value="CEO">CEO</option>
                    <option value="Dueño">Dueño</option>
                    <option value="Inversor">Inversor</option>
                    <option value="Líder Directivo">Líder Directivo</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Técnico Profesional">Técnico Profesional</option>
                  </select>
                </label>
              ) : (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm text-emerald-900">
                  Esta regla aplicará a todos los usuarios de la plataforma.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Mensajes por día
                  </span>
                  <input
                    value={maxMessagesPerDay}
                    onChange={(event) => onMaxMessagesPerDayChange(Number(event.target.value) || 0)}
                    min={1}
                    className="w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                    type="number"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Cooldown min
                  </span>
                  <input
                    value={cooldownMinutes}
                    onChange={(event) => onCooldownMinutesChange(Number(event.target.value) || 0)}
                    min={0}
                    className="w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                    type="number"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Bloqueo hrs
                  </span>
                  <input
                    value={temporaryBlockHours}
                    onChange={(event) => onTemporaryBlockHoursChange(Number(event.target.value) || 0)}
                    min={0}
                    className="w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none"
                    type="number"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                  Respuesta automática
                </span>
                <textarea
                  value={autoReply}
                  onChange={(event) => onAutoReplyChange(event.target.value)}
                  className="min-h-[96px] w-full rounded-2xl border border-[#CBE5D8] bg-white px-4 py-3 text-sm font-medium text-on-surface outline-none"
                  placeholder="Mensaje que verá el usuario al superar el límite"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#E7EEE9] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
                <div className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                  Resumen de regla
                </div>
                <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                      Alcance
                    </span>
                    <span className="text-right font-semibold text-on-surface">
                      {getScopeLabel(interactionScope)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                      Objetivo
                    </span>
                    <span className="text-right font-semibold text-on-surface">
                      {interactionTarget || "Sin definir"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                      Límite
                    </span>
                    <span className="text-right font-semibold text-on-surface">
                      {maxMessagesPerDay} mensajes / día
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                      Cooldown
                    </span>
                    <span className="text-right font-semibold text-on-surface">
                      {cooldownMinutes} min
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#FBFCFB] px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                      Bloqueo
                    </span>
                    <span className="text-right font-semibold text-on-surface">
                      {temporaryBlockHours} h
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
                <div className="text-sm text-on-surface-variant">
                  Por ahora la persistencia real está disponible solo para límites por correo.
                </div>
                <button
                  className="cursor-pointer rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                  onClick={onAddInteractionRule}
                  type="button"
                >
                  Agregar límite
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-5 text-sm text-emerald-900">
            La configuración avanzada está oculta. Pulsa <span className="font-semibold">Ver más</span> para ajustar límites detallados.
          </div>
        )}

        <div className="mt-5 rounded-[24px] border border-emerald-100 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
              Reglas activas
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
              {interactionRules.length} reglas
            </div>
          </div>
          {interactionRules.length > 0 ? (
            <div className="mt-3 space-y-2">
              {interactionRules.map((rule) => (
                <div
                  key={`${rule.createdAt}-${rule.target}`}
                  className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-on-surface">{rule.target}</div>
                    <div className="text-xs text-on-surface-variant">
                      {getScopeLabel(rule.scope)} · {rule.maxMessagesPerDay} msg/día · {rule.cooldownMinutes} min cooldown
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    Bloqueo {rule.temporaryBlockHours} h
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-on-surface-variant">
              Todavía no has agregado reglas. Usa la configuración de arriba para limitar
              interacciones por usuario.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
