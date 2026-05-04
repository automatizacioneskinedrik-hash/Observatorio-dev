"use client";

import type { LucideIcon } from "lucide-react";
import type { PanelTabId } from "./types";
import { ArrowRight } from "lucide-react";

export type PanelTab = {
  id: PanelTabId;
  label: string;
  description: string;
  count: string;
  icon: LucideIcon;
  hint: string;
};

type PanelTabsNavProps = {
  tabs: PanelTab[];
  activeTab: PanelTabId;
  onSelectTab: (tabId: PanelTabId) => void;
};

export function PanelTabsNav({ tabs, activeTab, onSelectTab }: PanelTabsNavProps) {
  return (
    <div className="rounded-[28px] border border-[#DDEADF] bg-white/85 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.03)] backdrop-blur-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
              Navegación del panel
            </div>
            <div className="mt-1 text-sm font-semibold text-on-surface">
              Toca una tarjeta para abrir esa sección.
            </div>
            <div className="mt-1 text-xs text-on-surface-variant">
              Las secciones son independientes entre sí.
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`group relative cursor-pointer overflow-hidden rounded-[24px] border p-4 text-left transition-all duration-200 ${
                  active
                    ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-[0_12px_24px_rgba(16,185,129,0.12)]"
                    : "border-[#E7EEE9] bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_10px_22px_rgba(0,0,0,0.04)]"
                }`}
                aria-label={tab.label}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-2xl p-3 transition-colors ${
                      active ? "bg-white text-emerald-700" : "bg-[#F4F7F5] text-on-surface-variant"
                    }`}
                  >
                    <tab.icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-on-surface">{tab.label}</div>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                        {tab.count}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-on-surface-variant">
                      {tab.description}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-secondary">
                      {active ? "Sección activa" : tab.hint}
                      <ArrowRight size={14} className={active ? "text-emerald-700" : "text-secondary"} />
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute inset-x-0 bottom-0 h-1 transition-opacity ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 opacity-100"
                      : "bg-transparent opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
