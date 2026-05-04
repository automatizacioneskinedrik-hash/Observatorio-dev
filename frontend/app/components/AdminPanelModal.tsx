"use client";

import { ArrowLeft, FileUp as UploadIcon, Sparkles as SparklesIcon, Users as UsersIcon } from "lucide-react";
import { AdminsTab } from "./admin-panel/AdminsTab";
import { LimitsTab } from "./admin-panel/LimitsTab";
import { PanelTabsNav } from "./admin-panel/PanelTabsNav";
import { StatusBanner } from "./admin-panel/StatusBanner";
import { UploadsTab } from "./admin-panel/UploadsTab";
import { useAdminPanelController } from "./admin-panel/useAdminPanelController";

export type AdminPanelModalProps = {
  open: boolean;
  onClose: () => void;
  apiBase?: string;
  googleId?: string | null;
  mode?: "modal" | "page";
};

export function AdminPanelModal({
  open,
  onClose,
  apiBase = "",
  googleId,
  mode = "modal",
}: AdminPanelModalProps) {
  const isPageMode = mode === "page";
  const admin = useAdminPanelController({ open, apiBase, googleId });

  const panelTabs = [
    {
      id: "uploads" as const,
      label: "Transcripciones",
      description: "Carga y análisis",
      count: admin.selectedFile ? "1 listo" : "0",
      icon: UploadIcon,
      hint: "Subir archivo",
    },
    {
      id: "admins" as const,
      label: "Administradores",
      description: "Usuarios Gmail",
      count: admin.adminRecords.length > 0 ? `${admin.adminRecords.length} activos` : "0",
      icon: UsersIcon,
      hint: "Asignar acceso",
    },
    {
      id: "limits" as const,
      label: "Límites IA",
      description: "Reglas de uso",
      count: admin.interactionRules.length > 0 ? `${admin.interactionRules.length} reglas` : "0",
      icon: SparklesIcon,
      hint: "Control de uso",
    },
  ];

  if (!open && !isPageMode) {
    return null;
  }

  return (
    <div
      className={
        isPageMode
          ? "flex h-full min-h-0 flex-col overflow-hidden rounded-[0px] bg-transparent"
          : "fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 backdrop-blur-[6px]"
      }
    >
      <div
        className={
          isPageMode
            ? "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[0px] border-0 bg-transparent shadow-none"
            : "flex w-full max-w-2xl flex-col overflow-hidden rounded-[16px] border border-[#DDEADF] bg-white/96 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
        }
      >
        <div className={`flex items-start justify-between ${isPageMode ? "px-6 py-5" : "px-8 py-6"}`}>
          <div>
            <h2 className="font-headline text-xl font-semibold tracking-tight text-on-surface">
              Panel de Administración
            </h2>
          </div>

          {isPageMode ? (
            <button
              aria-label="Volver al chat"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
              onClick={onClose}
              type="button"
            >
              <ArrowLeft size={16} />
              Volver al chat
            </button>
          ) : (
            <button
              aria-label="Cerrar panel"
              className="cursor-pointer text-on-surface-variant transition-colors hover:text-on-surface"
              onClick={onClose}
              type="button"
            >
              <span className="text-[22px] leading-none">×</span>
            </button>
          )}
        </div>

        <div className={isPageMode ? "min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2" : "max-h-[716px] overflow-y-auto px-8 pb-8 pt-2"}>
          <div className="space-y-10">
            <PanelTabsNav tabs={panelTabs} activeTab={admin.activePanelTab} onSelectTab={admin.setActivePanelTab} />

            {admin.activePanelTab === "uploads" ? (
              <UploadsTab
                selectedFile={admin.selectedFile}
                isUploading={admin.isUploading}
                uploadError={admin.uploadError}
                uploadStatus={admin.uploadStatus}
                uploadStatusTone={admin.uploadStatusTone}
                onFileChange={admin.handleFileChange}
                onUpload={admin.handleUpload}
              />
            ) : null}

            {admin.activePanelTab === "admins" ? (
              <AdminsTab
                adminSearch={admin.adminSearch}
                selectedAdminEmail={admin.selectedAdminEmail}
                adminCandidatesCount={admin.adminCandidates.length}
                adminCandidatesLoading={admin.adminCandidatesLoading}
                adminCandidatesError={admin.adminCandidatesError}
                adminResultFilter={admin.adminResultFilter}
                filteredAdminCandidates={admin.filteredAdminCandidates}
                gmailCandidatesCount={admin.gmailCandidatesCount}
                matchedCandidatesCount={admin.matchedCandidatesCount}
                adminSearchTerm={admin.adminSearchTerm}
                adminRecords={admin.adminRecords}
                isAssigningAdmin={admin.isAssigningAdmin}
                statusBanner={<StatusBanner tone={admin.adminStatusTone} text={admin.adminStatus} />}
                onSearchChange={admin.onSearchChange}
                onResultFilterChange={admin.onResultFilterChange}
                onSelectCandidate={admin.onSelectCandidate}
                onAssignAdmin={admin.handleAssignAdmin}
                highlightMatch={admin.highlightMatch}
              />
            ) : null}

            {admin.activePanelTab === "limits" ? (
              <LimitsTab
                interactionLimitsEnabled={admin.interactionLimitsEnabled}
                interactionScope={admin.interactionScope}
                interactionTarget={admin.interactionTarget}
                maxMessagesPerDay={admin.maxMessagesPerDay}
                cooldownMinutes={admin.cooldownMinutes}
                temporaryBlockHours={admin.temporaryBlockHours}
                autoReply={admin.autoReply}
                enforcementLevel={admin.enforcementLevel}
                showAdvancedLimits={admin.showAdvancedLimits}
                interactionRules={admin.interactionRules}
                getScopeLabel={admin.getScopeLabel}
                onToggleInteractionLimits={admin.onToggleInteractionLimits}
                onInteractionScopeChange={admin.onInteractionScopeChange}
                onInteractionTargetChange={admin.onInteractionTargetChange}
                onMaxMessagesPerDayChange={admin.onMaxMessagesPerDayChange}
                onCooldownMinutesChange={admin.onCooldownMinutesChange}
                onTemporaryBlockHoursChange={admin.onTemporaryBlockHoursChange}
                onAutoReplyChange={admin.onAutoReplyChange}
                onEnforcementLevelChange={admin.onEnforcementLevelChange}
                onToggleAdvancedLimits={admin.onToggleAdvancedLimits}
                onAddInteractionRule={admin.handleAddInteractionRule}
              />
            ) : null}
          </div>
        </div>

        {!isPageMode ? (
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
        ) : null}
      </div>
    </div>
  );
}
