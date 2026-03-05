"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Chat from "./components/Chat";
import { InfoModal } from "./components/InfoModal";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggleFab } from "./components/ThemeToggleFab";
import { AuthGate } from "./components/auth/AuthGate";
import { MENU } from "./constants/menu";
import { InvitacionesPanel } from "./components/panels/InvitacionesPanel";
import { ObservatorioPanel } from "./components/panels/ObservatorioPanel";
import { PersonasPanel } from "./components/panels/PersonasPanel";
import { useChatConversations } from "./hooks/useChatConversations";
import type { User } from "./types/user";
import { useSocialAuth } from "./hooks/useSocialAuth";

type Mode = "observatorio" | "personas" | "invitaciones";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const { logout } = useSocialAuth((nextUser) => setUser(nextUser));
  const sidebarMenu = MENU.filter(
    (item): item is { id: Mode; label: string; icon: ReactNode } =>
      item.id === "observatorio" || item.id === "personas" || item.id === "invitaciones"
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const {
    conversations,
    activeConvId,
    messages,
    input,
    loading,
    setInput,
    setActiveConvId,
    onNewConversation,
    onRenameConversation,
    send,
    onEditUserMessage,
  } = useChatConversations({ apiBase: API_BASE });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!user) return;
    if (user.isProfileComplete === true) return;
    router.replace("/comenzar");
  }, [router, user]);

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

  if (!user) {
    return <AuthGate onAuthenticated={setUser} />;
  }

  if (user.isProfileComplete !== true) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--kv-text)",
          fontFamily: "var(--font-neue-montreal), system-ui",
          backgroundColor: "var(--kv-bg)",
          backgroundImage: "var(--kv-glow)",
        }}
      >
        Redirigiendo al perfilamiento...
      </div>
    );
  }

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
      <Sidebar
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menu={sidebarMenu}
        activeId={activeMode}
        onSelect={onPickMode}
        conversations={conversations}
        activeConvId={activeConvId}
        onNewConversation={onNewConversation}
        onSelectConversation={setActiveConvId}
        onRenameConversation={onRenameConversation}
        onUserClick={() => setAuthOpen(true)}
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
              textAlign: "center",
              marginBottom: messages.length === 0 ? "24px" : "12px",
              transition: "all 300ms ease",
            }}
          >
            <span style={{ color: "var(--kv-brand-main)", fontWeight: 700 }}>AECCO</span>{" "}
            <span style={{ color: "var(--kv-brand-accent)", fontWeight: 700 }}>IA</span>
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

      {authOpen && user && (
        <InfoModal
          title="Cuenta"
          onClose={() => setAuthOpen(false)}
          onAccept={logout} 
          acceptText="Cerrar sesión"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 650 }}>{user.name}</div>
            <div style={{ opacity: 0.8 }}>{user.email}</div>
            <div style={{ opacity: 0.7 }}>{user.subscription}</div>
            {/* El botón de logout ahora es el botón principal del modal */}
          </div>
        </InfoModal>
      )}

      <ThemeToggleFab />
    </div>
  );
}
