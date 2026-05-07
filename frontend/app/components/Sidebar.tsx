"use client";

import Link from "next/link";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "../types/user";
import {
  BarChart3,
  Edit3,
  History,
  Layers,
  MessageCircle,
  Mic2,
  Plus,
  User as UserIcon,
} from "lucide-react";

type Props = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  user: User | null;
  onUserClick?: () => void;
  onNewConversation: () => void;
  onHistoryClick: () => void;
  onCurrentChatClick: () => void;
  historyOpen: boolean;
  onAdminPanelClick?: () => void;
  adminActive?: boolean;
  canAccessAdminPanel?: boolean;
};

const getUserInitials = (name?: string | null) => {
  if (!name) return "EC";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "EC";
  const letters = words.slice(0, 2).map((word) => word[0].toUpperCase());
  return letters.join("") || "EC";
};

export function Sidebar({
  user,
  menuOpen,
  setMenuOpen,
  onNewConversation,
  onUserClick,
  onHistoryClick,
  onCurrentChatClick,
  historyOpen,
  onAdminPanelClick,
  adminActive,
  canAccessAdminPanel = false,
}: Props) {
  const initials = getUserInitials(user?.name);

  if (!menuOpen) {
    return (
      <aside className="h-full w-[84px] overflow-hidden bg-transparent">
        <div className="flex h-full flex-col items-center gap-10 py-8">
          <button
            aria-label="Abrir menú"
            className="cursor-pointer transition-all hover:scale-110 active:scale-95"
            onClick={() => setMenuOpen(true)}
            style={{ color: "var(--kv-brand-accent)" }}
            type="button"
          >
            <span className="text-[14px] font-black uppercase tracking-[0.3em]">IA</span>
          </button>

          <button
            aria-label="Nueva conversación"
            className="flex size-12 cursor-pointer items-center justify-center rounded-xl border border-white/10 shadow-lg transition-all hover:opacity-90 active:scale-90"
            onClick={onNewConversation}
            style={{ backgroundColor: "var(--kv-brand-accent)", color: "white" }}
            type="button"
          >
            <Plus size={20} />
          </button>

          <div className="mt-auto">
            <button
              className="size-12 overflow-hidden rounded-full border-2 p-0.5 shadow-sm transition-all hover:ring-2 cursor-pointer"
              onClick={onUserClick}
              style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
              type="button"
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.name || "User"}
                  width={48}
                  height={48}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ backgroundColor: "var(--kv-accent-bg)" }}
                >
                  <UserIcon size={20} className="text-[var(--kv-brand-accent)]" />
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative z-20 flex h-full w-[310px] shrink-0 flex-col overflow-hidden bg-transparent transition-all duration-300">
      <div className="p-8 pb-3">
        <div className="flex items-end gap-2">
          <h1
            className="text-[22px] font-black uppercase leading-none tracking-tight"
            style={{ color: "var(--kv-text)" }}
          >
            AECO
          </h1>
          <span className="text-[22px] font-black uppercase leading-none tracking-tight text-emerald-600">
            IA
          </span>
        </div>
      </div>

      <nav className="scrollbar-hide flex-1 overflow-y-auto px-6">
        <h2
          className="mb-5 px-3 text-[11px] font-black uppercase tracking-[0.2em] opacity-40"
          style={{ color: "var(--kv-subtext)" }}
        >
          NAVEGACIÓN
        </h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onNewConversation}
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-emerald-800 bg-emerald-700 px-4 py-3.5 text-white shadow-sm transition-all hover:shadow-lg active:scale-95"
          >
            <Edit3 size={18} />
            <span className="text-[14.5px] font-black tracking-tight">Nuevo Chat</span>
          </button>

          <button
            type="button"
            onClick={onCurrentChatClick}
            className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-all hover:shadow-md"
            style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
          >
            <MessageCircle size={22} className="text-[var(--kv-brand-accent)]" />
            <span
              className="text-[14.5px] font-black tracking-tight"
              style={{ color: "var(--kv-brand-accent)" }}
            >
              Chat Actual
            </span>
          </button>

          <button
            type="button"
            onClick={onHistoryClick}
            className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 transition-all hover:bg-white/50"
            style={{
              color: historyOpen ? "var(--kv-brand-accent)" : "var(--kv-subtext)",
              backgroundColor: historyOpen ? "var(--kv-panel)" : "transparent",
            }}
          >
            <History size={22} className="opacity-40 transition-opacity group-hover:opacity-100" />
            <span className="text-[14.5px] font-bold tracking-tight">Historial</span>
          </button>

          <Link
            href="/analitica"
            className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 transition-all hover:bg-white/50"
            style={{ color: "var(--kv-subtext)" }}
          >
            <BarChart3 size={22} className="opacity-40 transition-opacity group-hover:opacity-100" />
            <span className="text-[14.5px] font-bold tracking-tight">Analítica AEC</span>
          </Link>

          {canAccessAdminPanel ? (
            <button
              type="button"
              onClick={onAdminPanelClick}
              className={`group flex w-full cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3.5 shadow-sm transition-all hover:shadow-md ${
                adminActive
                  ? "border-emerald-300 bg-emerald-100/80 text-emerald-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70"
              }`}
            >
              <Layers size={22} className="opacity-90 transition-opacity group-hover:opacity-100" />
              <span className="text-[14.5px] font-bold tracking-tight">Panel de administración</span>
            </button>
          ) : null}
        </div>
      </nav>

      {menuOpen && (
        <div className="px-6 pt-6">
          <Link href="/evaluacion" className="block">
            <div className="flex cursor-pointer items-center justify-center gap-3 rounded-[28px] border border-emerald-200 bg-white/80 p-3 text-[12px] font-black uppercase tracking-[0.2em] text-emerald-900 shadow-sm transition-all hover:shadow-lg">
              <Mic2 size={18} className="text-emerald-600" />
              Audio entrevista
            </div>
          </Link>
        </div>
      )}

      <div className="relative mt-auto p-6 space-y-5">
        <div className="w-full px-0">
          <button
            type="button"
            onClick={onUserClick}
            className="group/profile flex w-full cursor-pointer items-center justify-start gap-4 rounded-[32px] border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:shadow-lg focus-visible:outline focus-visible:outline-emerald-500"
          >
            <div
              className="size-13 shrink-0 overflow-hidden rounded-full border p-0.5 shadow-xl ring-4 ring-white transition-transform group-hover/profile:scale-105"
              style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.name || "User"}
                  width={52}
                  height={52}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-bold"
                  style={{ backgroundColor: "var(--kv-accent-bg)", color: "var(--kv-brand-accent)" }}
                >
                  {initials}
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-col text-left">
              <h4
                className="mb-0.5 truncate text-[14px] font-semibold leading-none tracking-tight"
                style={{ color: "var(--kv-text)" }}
              >
                {user?.name || "Invitado"}
              </h4>
              <p
                className="truncate text-[10px] font-black uppercase tracking-[0.15em] opacity-60"
                style={{ color: "var(--kv-subtext)" }}
              >
                {user?.subscription || "Plan Enterprise"}
              </p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
