"use client";

import Link from "next/link";
import Image from "next/image";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "../types/user";
import {
  BarChart3,
  Edit3,
  FileText,
  Globe2,
  History,
  Layers,
  MessageCircle,
  Mic2,
  Plus,
  Search,
  User as UserIcon,
} from "lucide-react";

type Props = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  user: User | null;
  onUserClick?: () => void;
  onNewConversation: () => void;
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
}: Props) {
  const initials = getUserInitials(user?.name);

  if (!menuOpen) {
    return (
      <aside 
        className="w-[84px] h-screen flex flex-col items-center py-8 gap-10 transition-all duration-300 z-50 overflow-hidden bg-transparent"
      >
        <button
          onClick={() => setMenuOpen(true)}
          className="cursor-pointer hover:scale-110 active:scale-95 transition-all"
          style={{ color: "var(--kv-brand-accent)" }}
          aria-label="Abrir menú"
        >
          <span className="text-[14px] font-black uppercase tracking-[0.3em]">IA</span>
        </button>
            <button
              aria-label="Nueva conversación"
              onClick={onNewConversation}
              className="size-12 flex items-center justify-center rounded-xl shadow-lg cursor-pointer hover:opacity-90 active:scale-90 transition-all border border-white/10"
              style={{ backgroundColor: "var(--kv-brand-accent)", color: "white" }}
            >
              <Plus size={20} />
            </button>
        <div className="mt-auto">
          <button 
            onClick={onUserClick}
            className="size-12 rounded-full border-2 p-0.5 overflow-hidden shadow-sm cursor-pointer hover:ring-2 transition-all"
            style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
          >
            {user?.photoURL ? (
              <Image src={user.photoURL} alt={user.name || "User"} width={48} height={48} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "var(--kv-accent-bg)" }}>
                  <UserIcon size={20} className="text-[var(--kv-brand-accent)]" />
                </div>
              )}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="w-[310px] h-screen flex flex-col shrink-0 transition-all duration-300 relative z-20 overflow-hidden bg-transparent"
    >
      {/* Header */}
      <div className="p-8 pb-3">
        <div className="flex items-end gap-2">
          <h1 className="text-[22px] font-black tracking-tight leading-none uppercase" style={{ color: "var(--kv-text)" }}>
            AECO
          </h1>
          <span className="text-[22px] font-black uppercase text-emerald-600 tracking-tight leading-none">
            IA
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 overflow-y-auto scrollbar-hide">
        <h2 
          className="text-[11px] font-black uppercase tracking-[0.2em] px-3 mb-5 opacity-40"
          style={{ color: "var(--kv-subtext)" }}
        >
          NAVEGACIÓN
        </h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 transition-all cursor-pointer group rounded-2xl border border-emerald-800 bg-emerald-700 text-white shadow-sm active:scale-95 hover:shadow-lg"
          >
            <Edit3 size={18} />
            <span className="text-[14.5px] font-black tracking-tight">Nuevo Chat</span>
          </button>

          {/* Active Link (Card style) */}
          <div 
            className="rounded-2xl shadow-sm border flex items-center gap-4 px-4 py-3.5 cursor-pointer group hover:shadow-md transition-all"
            style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
          >
            <MessageCircle size={22} className="text-[var(--kv-brand-accent)]" />
            <span className="text-[14.5px] font-black tracking-tight" style={{ color: "var(--kv-brand-accent)" }}>Chat Actual</span>
          </div>

          <div 
            className="flex items-center gap-4 px-4 py-3.5 transition-all cursor-pointer group rounded-2xl hover:bg-white/50"
            style={{ color: "var(--kv-subtext)" }}
          >
            <History size={22} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="text-[14.5px] font-bold tracking-tight">Historial</span>
          </div>

          <div 
            className="flex items-center gap-4 px-4 py-3.5 transition-all cursor-pointer group rounded-2xl hover:bg-white/50"
            style={{ color: "var(--kv-subtext)" }}
          >
            <BarChart3 size={22} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="text-[14.5px] font-bold tracking-tight">Analítica AEC</span>
          </div>

        </div>
      </nav>

      {/* Acceso rápido a audio entrevista */}
      {menuOpen && (
        <div className="px-6 pt-6">
          <Link href="/evaluacion" className="block">
            <div
              className="flex items-center justify-center gap-3 rounded-[28px] border border-emerald-200 bg-white/80 p-3 text-[12px] font-black tracking-[0.2em] uppercase text-emerald-900 shadow-sm transition-all hover:shadow-lg"
            >
              <Mic2 size={18} className="text-emerald-600" />
              Audio entrevista
            </div>
          </Link>
        </div>
      )}

      {/* Footer Details */}
          <div className="p-6 space-y-5 relative">
          <div className="px-0 w-full">
            <button
              type="button"
              onClick={onUserClick}
              className="w-full flex items-center gap-4 cursor-pointer transition-all justify-start group/profile rounded-[32px] bg-white border border-slate-200 shadow-sm hover:shadow-lg focus-visible:outline focus-visible:outline-emerald-500 px-4 py-3"
            >
              <div
                className="size-13 rounded-full p-0.5 overflow-hidden shadow-xl border ring-4 ring-white shrink-0 transition-transform group-hover/profile:scale-105"
                style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
              >
                {user?.photoURL ? (
                  <Image src={user.photoURL} alt={user.name || "User"} width={52} height={52} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold" style={{ backgroundColor: "var(--kv-accent-bg)", color: "var(--kv-brand-accent)" }}>
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <h4 className="text-[14px] font-semibold truncate tracking-tight leading-none mb-0.5" style={{ color: "var(--kv-text)" }}>
                  {user?.name || "Invitado"}
                </h4>
                <p
                  className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 truncate"
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
