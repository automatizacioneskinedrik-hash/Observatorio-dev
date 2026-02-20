"use client";
import { ThemeToggleFab } from "./components/ThemeToggleFab";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import Chat from "./components/Chat";
import { InfoModal } from "./components/InfoModal";
import type { ChatMessage } from "./types/chat";
import type { Conversation } from "./types/conversation";
import { MENU } from "./constants/menu";
import { ObservatorioPanel } from "./components/panels/ObservatorioPanel";
import { PersonasPanel } from "./components/panels/PersonasPanel";
import { InvitacionesPanel } from "./components/panels/InvitacionesPanel";
import { defaultTitleFromFirstUserMessage, uid } from "./lib/chatTemp";
type Mode = "observatorio" | "personas" | "invitaciones";
type User = {
  name: string;
  subscription: "Free" | "Pro" | "Enterprise";
} | null;

export default function Home() {
  const [user, setUser] = useState<User>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const openAuth = () => {
    setAuthTab(user ? "login" : "login");
    setAuthOpen(true);
  };

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) ?? null,
    [conversations, activeConvId]
  );

  const messages = activeConv ? activeConv.messages : draftMessages;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ✅ “Nueva conversación” estilo ChatGPT:
  // no crea en historial, solo abre borrador vacío.
  const onNewConversation = () => {
    setActiveConvId(null);
    setDraftMessages([]);
    setInput("");
  };

  const onRenameConversation = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  };

  const sendText = async (textRaw: string) => {
    const text = textRaw.trim();
    if (!text || loading) return;

    const now = Date.now();
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      text,
      createdAt: now,
    };

    const assistantMsgId = uid("m");
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      text: "",
      createdAt: now,
    };

    setInput("");
    setLoading(true);

    // 🔑 si estamos en borrador, AHÍ creamos la conversación y la metemos al historial
    let convId = activeConvId;

    if (!convId) {
      const newConv: Conversation = {
        id: uid("conv"),
        title: defaultTitleFromFirstUserMessage(text),
        createdAt: now,
        updatedAt: now,
        messages: [userMsg, assistantMsg],
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setDraftMessages([]);
      convId = newConv.id;
    } else {
      // conversación existente: solo append
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
              ...c,
              updatedAt: now,
              messages: [...c.messages, userMsg, assistantMsg],
            }
            : c
        )
      );
    }

    // Llamada al backend (sin streaming por ahora)
    try {
      const r = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await r.json();

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, text: data.reply ?? "" } : m
            ),
          };
        })
      );
    } catch {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) =>
              m.id === assistantMsgId
                ? { ...m, text: "Error conectando con el servidor" }
                : m
            ),
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    await sendText(input);
  };

  // ✅ Editar mensaje anterior (solo en conversaciones guardadas)
  const onEditUserMessage = (messageId: string, newText: string) => {
    const nextText = newText.trim();
    if (!nextText) return;

    // Si estás en borrador, solo reemplaza draft y reenvía
    if (!activeConvId) {
      setDraftMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: nextText } : m))
      );
      setInput(nextText);
      setTimeout(() => sendText(nextText), 0);
      return;
    }

    const convId = activeConvId;
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;

    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx < 0) return;

    // truncar todo después del mensaje editado
    const truncated = conv.messages
      .slice(0, idx + 1)
      .map((m) => (m.id === messageId ? { ...m, text: nextText } : m));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId ? { ...c, messages: truncated, updatedAt: Date.now() } : c
      )
    );

    setInput(nextText);
    setTimeout(() => sendText(nextText), 0);
  };

  const onPickMode = (id: Mode) => {
    if (activeMode === id) {
      setActiveMode(null);
      setPendingMode(null);
      return;
    }
    setPendingMode(id);
  };

  const modalTitle =
    pendingMode === "observatorio"
      ? "Observatorio"
      : pendingMode === "personas"
        ? "Personas"
        : "Invitaciones";

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--kv-border)",
    background: "transparent",
    color: "var(--kv-text)",
    outline: "none",
  };

  const primaryStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--kv-accent-border)",
    background: "var(--kv-accent-bg)",
    color: "var(--kv-text)",
    cursor: "pointer",
    fontWeight: 650,
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        color: "var(--kv-text)",
        fontFamily: "var(--font-neue-montreal), system-ui",
        backgroundColor: "var(--kv-bg)",
        backgroundImage: "var(--kv-glow)",
        transition: "background-color 500ms ease, color 500ms ease",
      }}
    >
      {/* Sidebar principal (aquí es donde vas a renderizar conversaciones debajo del menú) */}
      <Sidebar
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menu={MENU}
        activeId={activeMode}
        onSelect={onPickMode}
        // ✅ props para conversaciones en el sidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onNewConversation={onNewConversation}
        onSelectConversation={setActiveConvId}
        onRenameConversation={onRenameConversation}
        onUserClick={() => {
          openAuth();
        }}
      />

      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: messages.length === 0 ? "center" : "flex-start",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "900px",
            height: messages.length === 0 ? "auto" : "85vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: messages.length === 0 ? "center" : "flex-start",
            transition: "all 300ms ease",
          }}
        >
          <div
            style={{
              fontSize: messages.length === 0 ? "32px" : "18px",
              fontWeight: 400,
              letterSpacing: "0px",
              textAlign: "center", // ✅ vuelve a centrar
              marginBottom: messages.length === 0 ? "24px" : "12px",
              transition: "all 300ms ease",
            }}
          >
            Observatorio - AEC
          </div>


          <Chat
            messages={messages}
            bottomRef={bottomRef}
            input={input}
            setInput={setInput}
            send={send}
            loading={loading}
            onEditUserMessage={onEditUserMessage}
          />
        </div>
      </main>

      {pendingMode && (
        <InfoModal
          title={modalTitle}
          onClose={() => setPendingMode(null)}
          onAccept={() => {
            setActiveMode(pendingMode);
            setPendingMode(null);
          }}
          acceptText="Aceptar"
        >
          {pendingMode === "observatorio" && <ObservatorioPanel />}
          {pendingMode === "personas" && <PersonasPanel />}
          {pendingMode === "invitaciones" && <InvitacionesPanel />}
        </InfoModal>
      )}

      {authOpen && (
        <InfoModal
          title={user ? "Cuenta" : authTab === "login" ? "Iniciar sesión" : "Registro"}
          onClose={() => setAuthOpen(false)}
          onAccept={() => setAuthOpen(false)}
          acceptText="Cerrar"
        >
          {!user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setAuthTab("login")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--kv-border)",
                    background: authTab === "login" ? "var(--kv-accent-bg)" : "transparent",
                    color: "var(--kv-text)",
                    cursor: "pointer",
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => setAuthTab("register")}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--kv-border)",
                    background: authTab === "register" ? "var(--kv-accent-bg)" : "transparent",
                    color: "var(--kv-text)",
                    cursor: "pointer",
                  }}
                >
                  Registro
                </button>
              </div>

              {/* Form (placeholder por ahora) */}
              {authTab === "login" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input placeholder="Correo" style={inputStyle} />
                  <input placeholder="Contraseña" type="password" style={inputStyle} />
                  <button
                    style={primaryStyle}
                    onClick={() => {
                      // ✅ DEMO: simula login
                      setUser({ name: "Usuario AEC", subscription: "Free" });
                      setAuthOpen(false);
                    }}
                  >
                    Entrar
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input placeholder="Nombre" style={inputStyle} />
                  <input placeholder="Correo" style={inputStyle} />
                  <input placeholder="Contraseña" type="password" style={inputStyle} />
                  <button
                    style={primaryStyle}
                    onClick={() => {
                      // ✅ DEMO: simula registro+login
                      setUser({ name: "Usuario AEC", subscription: "Free" });
                      setAuthOpen(false);
                    }}
                  >
                    Crear cuenta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontWeight: 650 }}>{user.name}</div>
              <div style={{ opacity: 0.7 }}>{user.subscription}</div>

              <button
                style={primaryStyle}
                onClick={() => {
                  setUser(null);
                  setAuthOpen(false);
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </InfoModal>

      )}
      <>
        {/* todo tu layout */}
        <ThemeToggleFab />
      </>
    </div>
  );
}
