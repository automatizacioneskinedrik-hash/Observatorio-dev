import type { ReactNode, Dispatch, SetStateAction, CSSProperties } from "react";
import type { Conversation } from "../types/conversation";

type Mode = "observatorio" | "personas" | "invitaciones";

type Props = {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;

  user: { name: string; subscription: string } | null;
  onUserClick?: () => void;

  menu: ReadonlyArray<{
    id: Mode;
    label: string;
    icon: ReactNode;
  }>;

  onSelect?: (id: Mode) => void;
  activeId: Mode | null;

  conversations: Conversation[];
  activeConvId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
};

function PencilIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const sorted = conversations.slice().sort((a, b) => b.updatedAt - a.updatedAt);

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

  const applyHover = (el: HTMLDivElement, active: boolean) => {
    if (active) return;
    el.style.background = "rgba(0,168,132,0.08)"; // 👈 más sutil
  };


  const removeHover = (el: HTMLDivElement, active: boolean) => {
    if (active) return;
    el.style.background = "transparent";
    el.style.border = "1px solid transparent";
  };

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: menuOpen ? "260px" : "84px",
        transition: "width 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        padding: "22px",
        borderRight: "1px solid var(--kv-border)",
        background: "var(--kv-panel)",
        color: "var(--kv-text)",
        backdropFilter: "blur(10px)",
        gap: "6px",
        willChange: "width",
      }}
    >
      {/* Encabezado / expandir */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          all: "unset",
          cursor: "pointer",
          color: "var(--kv-text)",
          letterSpacing: "0.6px",
          fontWeight: 650,
          display: "inline-block",
          fontSize: "18px",
        }}
        aria-expanded={menuOpen}
        title="Mostrar/ocultar menú"
      >
        {menuOpen ? (
          <>
            <span style={{ color: "#FFFFFF", textShadow: "0 0 1px #065F46, 0 0 2px #065F46" }}>
              AECCO
            </span>{" "}
            <span style={{ color: "#065F46", fontWeight: 650 }}>IA</span>
          </>
        ) : (
          "AI"
        )}
      </button>

      {/* Nuevo chat + botones */}
      {menuOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Nuevo chat */}
          <div
            role="button"
            tabIndex={0}
            onClick={onNewConversation}
            onKeyDown={(e) => e.key === "Enter" && onNewConversation()}
            style={{ ...itemBase }}
            onMouseEnter={(e) => applyHover(e.currentTarget, false)}
            onMouseLeave={(e) => removeHover(e.currentTarget, false)}
          >
            <span style={{ display: "flex", alignItems: "center" }}>
              <PencilIcon size={16} />
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Nuevo chat
            </span>
          </div>

          {/* Observatorio / Personas / Invitaciones */}
          {menu.map((item) => {
            const active = activeId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                style={{
                  ...itemBase,
                  fontWeight: active ? 650 : 520,
                }}
                onMouseEnter={(e) => applyHover(e.currentTarget, active)}
                onMouseLeave={(e) => removeHover(e.currentTarget, active)}
              >
                <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chats (centro, con scroll) */}
      {menuOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 0, marginTop: 6 }}>
          <div style={{ fontSize: 12, color: "#57f2c7", letterSpacing: "0.4px" }}>Chats</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", minHeight: 0 }}>
            {sorted.map((c) => {
              const active = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  onDoubleClick={() => {
                    const next = prompt("Renombrar conversación", c.title);
                    if (next && next.trim()) onRenameConversation(c.id, next.trim());
                  }}
                  style={{
                    ...itemBase,
                    fontSize: 13,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start", // 🔥 importante

                    paddingLeft: 12, // opcional para que respire
                    textAlign: "left",

                    background: active ? "rgba(0,168,132,0.10)" : "transparent",
                    fontWeight: 520,
                  }}
                  onMouseEnter={(e) => applyHover(e.currentTarget, active)}
                  onMouseLeave={(e) => removeHover(e.currentTarget, active)}
                >
                  <span
                    style={{
                      display: "block",
                      width: "100%", // 🔥 clave para evitar centrado visual
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    {c.title.charAt(0).toUpperCase() + c.title.slice(1)}
                  </span>
                </div>

              );
            })}
          </div>
        </div>
      )}
      

      {/* Usuario abajo (sin engranaje) */}
      {menuOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={onUserClick}
          onKeyDown={(e) => e.key === "Enter" && onUserClick?.()}
          style={{
            marginTop: "auto",
            paddingTop: 14,
            borderTop: "1px solid var(--kv-border)",
          }}
        >
          <div
            style={{ ...itemBase }}
            onMouseEnter={(e) => applyHover(e.currentTarget as HTMLDivElement, false)}
            onMouseLeave={(e) => removeHover(e.currentTarget as HTMLDivElement, false)}
            title={user ? "Ver cuenta / suscripción" : "Iniciar sesión / registrarse"}
          >
            <span style={{ width: 16, display: "inline-block" }} />
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              {user ? (
                <>
                  <div style={{ fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.subscription}
                  </div>
                </>
              ) : (
                <div style={{ opacity: 0.7, fontSize: 14 }}>No registrado</div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
