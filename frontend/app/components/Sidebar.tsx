"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction, CSSProperties } from "react";
import type { Conversation } from "../types/conversation";
import type { User } from "../types/user";

type Mode = "observatorio" | "personas" | "invitaciones";

type Props = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  user: User | null;
  onUserClick?: () => void;
  menu: ReadonlyArray<{
    id: Mode;
    label: string;
    icon: React.ReactNode;
  }>;
  onSelect?: (id: Mode) => void;
  activeId: Mode | null;
  conversations: Conversation[];
  activeConvId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
};

function MicrophoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const itemBase: CSSProperties = {
  padding: "10px 10px",
  borderRadius: 10,
  cursor: "pointer",
  userSelect: "none",
  fontSize: 14,
  fontWeight: 520,
  color: "var(--kv-text)",
  border: "1px solid transparent",
  background: "transparent",
  transition: "all 160ms ease",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

export function Sidebar({
  user,
  menuOpen,
  setMenuOpen,
  menu,
  onSelect,
  activeId,
  conversations,
  activeConvId,
  onNewConversation,
  onSelectConversation,
  onRenameConversation,
  onUserClick,
}: Props) {

  if (!menuOpen) {
    return (
      <aside 
        className="w-[84px] h-screen flex flex-col items-center py-8 gap-10 transition-all duration-300 z-50 overflow-hidden bg-transparent"
      >
        <button 
          onClick={() => setMenuOpen(true)}
          className="material-symbols-outlined text-[32px] cursor-pointer hover:scale-110 active:scale-95 transition-all"
          style={{ color: "var(--kv-brand-accent)" }}
        >
          database
        </button>
        <button 
          onClick={onNewConversation}
          className="size-12 flex items-center justify-center rounded-xl shadow-lg cursor-pointer hover:opacity-90 active:scale-90 transition-all border border-white/10"
          style={{ backgroundColor: "var(--kv-brand-accent)", color: "white" }}
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>
        <div className="mt-auto">
          <button 
            onClick={onUserClick}
            className="size-12 rounded-full border-2 p-0.5 overflow-hidden shadow-sm cursor-pointer hover:ring-2 transition-all"
            style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "var(--kv-accent-bg)" }}>
                 <span className="material-symbols-outlined text-xl font-bold" style={{ color: "var(--kv-brand-accent)" }}>person</span>
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
        <div className="flex items-center gap-4">
          <div 
            className="size-10 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "var(--kv-accent-bg)" }}
          >
             <span className="material-symbols-outlined text-3xl font-bold" style={{ color: "var(--kv-brand-accent)" }}>database</span>
          </div>
          <h1 className="text-[19px] font-black tracking-tight leading-none uppercase" style={{ color: "var(--kv-text)" }}>AECO IA</h1>
        </div>
        <p 
          className="text-[10px] font-black uppercase tracking-[0.3em] mt-3.5 ml-1 opacity-60"
          style={{ color: "var(--kv-subtext)" }}
        >
          ENTERPRISE AI V2.0
        </p>
      </div>

      {/* Context Card */}
      <div className="px-6 mt-6 mb-8">
        <div 
          className="rounded-[28px] p-6 shadow-sm border border-black/[0.03] relative overflow-hidden group"
          style={{ backgroundColor: "var(--kv-panel)" }}
        >
          <h2 
            className="text-[11px] font-black uppercase tracking-[0.2em] mb-5 opacity-50"
            style={{ color: "var(--kv-subtext)" }}
          >
            CONTEXTO DEL ANALISTA
          </h2>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-4 group/item cursor-default">
              <div 
                className="size-10 rounded-2xl flex items-center justify-center border shadow-sm transition-colors"
                style={{ backgroundColor: "var(--kv-bg)", borderColor: "var(--kv-accent-bg)" }}
              >
                <span className="material-symbols-outlined text-[20px] font-bold" style={{ color: "var(--kv-subtext)" }}>person_search</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest leading-none mb-1 opacity-40" style={{ color: "var(--kv-subtext)" }}>Perfil detectado</p>
                <p className="text-[14.5px] font-black leading-tight truncate" style={{ color: "var(--kv-text)" }}>{user?.role || "Arquitecto Senior"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group/item cursor-default">
              <div 
                className="size-10 rounded-2xl flex items-center justify-center border shadow-sm transition-colors"
                style={{ backgroundColor: "var(--kv-bg)", borderColor: "var(--kv-accent-bg)" }}
              >
                <span className="material-symbols-outlined text-[20px] font-bold" style={{ color: "var(--kv-subtext)" }}>public</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest leading-none mb-1 opacity-40" style={{ color: "var(--kv-subtext)" }}>Nivel sectorial</p>
                <p className="text-[14.5px] font-black leading-tight truncate" style={{ color: "var(--kv-text)" }}>Global / Normativo</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group/item cursor-default">
              <div 
                className="size-10 rounded-2xl flex items-center justify-center border shadow-sm transition-colors"
                style={{ backgroundColor: "var(--kv-bg)", borderColor: "var(--kv-accent-bg)" }}
              >
                <span className="material-symbols-outlined text-[20px] font-bold" style={{ color: "var(--kv-subtext)" }}>category</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest leading-none mb-1 opacity-40" style={{ color: "var(--kv-subtext)" }}>Categoría AEC</p>
                <p className="text-[14.5px] font-black leading-tight truncate" style={{ color: "var(--kv-text)" }}>Innovación Digital</p>
              </div>
            </div>
          </div>
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
          {/* Active Link (Card style) */}
          <div 
            className="rounded-2xl shadow-sm border flex items-center gap-4 px-4 py-3.5 cursor-pointer group hover:shadow-md transition-all"
            style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
          >
            <span className="material-symbols-outlined text-[22px] font-bold" style={{ color: "var(--kv-brand-accent)" }}>chat_bubble</span>
            <span className="text-[14.5px] font-black tracking-tight" style={{ color: "var(--kv-brand-accent)" }}>Chat Actual</span>
          </div>

          <div 
            className="flex items-center gap-4 px-4 py-3.5 transition-all cursor-pointer group rounded-2xl hover:bg-white/50"
            style={{ color: "var(--kv-subtext)" }}
          >
            <span className="material-symbols-outlined text-[22px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">history</span>
            <span className="text-[14.5px] font-bold tracking-tight">Historial</span>
          </div>

          <div 
            className="flex items-center gap-4 px-4 py-3.5 transition-all cursor-pointer group rounded-2xl hover:bg-white/50"
            style={{ color: "var(--kv-subtext)" }}
          >
            <span className="material-symbols-outlined text-[22px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">bar_chart</span>
            <span className="text-[14.5px] font-bold tracking-tight">Analítica AEC</span>
          </div>

          <div 
            className="flex items-center gap-4 px-4 py-3.5 transition-all cursor-pointer group rounded-2xl hover:bg-white/50"
            style={{ color: "var(--kv-subtext)" }}
          >
            <span className="material-symbols-outlined text-[22px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">description</span>
            <span className="text-[14.5px] font-bold tracking-tight">Biblioteca Técnica</span>
          </div>
        </div>
      </nav>

      {/* Acceso rápido a audio entrevista */}
      {menuOpen && (
        <Link
          href="/evaluacion"
          style={{
            ...itemBase,
            margin: "auto 24px 0 24px",
            background: "rgba(0,168,132,0.1)",
            border: "1px solid rgba(0,168,132,0.22)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,168,132,0.16)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,168,132,0.1)";
          }}
        >
          <span style={{ display: "flex", alignItems: "center" }}>
            <MicrophoneIcon size={16} />
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            Audio entrevista
          </span>
        </Link>
      )}

      {/* Footer Details */}
      <div className="p-7 space-y-7 relative">
        <button 
          onClick={onNewConversation}
          className="w-full p-5 rounded-[22px] font-black text-[15.5px] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 cursor-pointer group"
          style={{ backgroundColor: "var(--kv-brand-accent)", color: "white" }}
        >
          <span className="material-symbols-outlined text-[20px] font-bold">add</span>
          Nuevo Chat
        </button>

        <div className="flex items-center justify-between group px-2">
          <div 
            onClick={onUserClick}
            className="flex items-center gap-4 cursor-pointer hover:opacity-100 transition-all flex-1 min-w-0 group/profile"
          >
            <div 
              className="size-13 rounded-full p-0.5 overflow-hidden ring-4 ring-white shadow-xl border shrink-0 transition-transform group-hover/profile:scale-105"
              style={{ backgroundColor: "var(--kv-panel)", borderColor: "var(--kv-accent-bg)" }}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold" style={{ backgroundColor: "var(--kv-accent-bg)", color: "var(--kv-brand-accent)" }}>
                  {user?.name?.slice(0, 2).toUpperCase() || "EC"}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="text-[16px] font-black truncate tracking-tighter leading-none mb-1.5" style={{ color: "var(--kv-text)" }}>{user?.name || "Invitado"}</h4>
              <p 
                className="text-[10px] font-black uppercase tracking-[0.15em] opacity-60 truncate"
                style={{ color: "var(--kv-subtext)" }}
              >
                 {user?.subscription || "Plan Enterprise"}
              </p>
            </div>
          </div>
          <button 
            onClick={onUserClick}
            className="material-symbols-outlined transition-all p-3 hover:bg-white rounded-2xl cursor-pointer hover:shadow-sm"
            style={{ color: "var(--kv-subtext)" }}
          >
            settings
          </button>
        </div>
      </div>
    </aside>
  );
}
