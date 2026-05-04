"use client";

import type { StatusTone } from "./types";

type StatusBannerProps = {
  tone: StatusTone;
  text: string;
};

const getToneStyles = (tone: StatusTone) =>
  tone === "success"
    ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
    : tone === "progress"
      ? "border border-amber-200 bg-amber-50 text-amber-900"
      : "border border-rose-200 bg-rose-50 text-rose-700";

export function StatusBanner({ tone, text }: StatusBannerProps) {
  if (!text) return null;

  return (
    <div className={`rounded-[22px] px-4 py-3 text-sm font-semibold shadow-sm transition-all ${getToneStyles(tone)}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex size-2.5 shrink-0 rounded-full ${
            tone === "success" ? "bg-emerald-500" : tone === "progress" ? "bg-amber-500" : "bg-rose-500"
          }`}
        />
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">
            {tone === "success" ? "Listo" : tone === "progress" ? "Procesando" : "Validación"}
          </div>
          <div className="mt-1">{text}</div>
        </div>
      </div>
    </div>
  );
}
