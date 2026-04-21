"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Chat from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { ConversationsSidebar } from "./components/ConversationsSidebar";
import { AuthGate } from "./components/auth/AuthGate";
import { InfoModal } from "./components/InfoModal";
import { useChatConversations } from "./hooks/useChatConversations";
import type { User } from "./types/user";
import { useSocialAuth } from "./hooks/useSocialAuth";
import { Bookmark, ChevronRight, Share2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleAuthSuccess = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const { logout, authLoading } = useSocialAuth(handleAuthSuccess);
  
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const chatStorageKey = user?.email
    ? `kv_chat_conversations:${user.email.toLowerCase()}`
    : "kv_chat_conversations:guest";
  
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
  } = useChatConversations({ apiBase: API_BASE, storageKey: chatStorageKey });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!user) return;
    if (user.isProfileComplete === true) return;
    router.replace("/comenzar");
  }, [router, user]);

  if (authLoading && !user) return <div className="h-screen" style={{ backgroundColor: "var(--kv-bg)" }} />;
  if (!user) return <AuthGate onAuthenticated={handleAuthSuccess} />;
  if (user.isProfileComplete !== true) return null;

  return (
    <div 
      className="flex h-screen overflow-hidden font-sans text-slate-900 relative transition-colors duration-500"
      style={{ backgroundColor: "var(--kv-bg)" }}
    >
      <div className="shimmer-bg pointer-events-none opacity-20 absolute inset-0 z-0" />
      
      <Sidebar
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onNewConversation={() => {
          onNewConversation();
          setHistoryOpen(false);
        }}
        onHistoryClick={() => setHistoryOpen((prev) => !prev)}
        onCurrentChatClick={() => setHistoryOpen(false)}
        historyOpen={historyOpen}
        onUserClick={() => setAuthOpen(true)}
      />

      {authOpen && (
        <InfoModal
          title="Mi cuenta"
          onClose={() => setAuthOpen(false)}
          onAccept={() => {
            setAuthOpen(false);
            void logout();
          }}
          acceptText="Cerrar sesión"
          cancelText="Cancelar"
        >
          <p>
            <span className="font-semibold">Nombre:</span> {user.name || "Invitado"}
          </p>
          <p>
            <span className="font-semibold">Correo:</span> {user.email || "No disponible"}
          </p>
          <p>
            <span className="font-semibold">Suscripción:</span> {user.subscription || "Free"}
          </p>
        </InfoModal>
      )}

      {/* Main Experience Layout (Bubble Concept) */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-[0_45px_120px_rgba(0,0,0,0.06)] z-10 transition-all duration-700 m-4 rounded-[42px] border border-white/40">
        {/* Header */}
        <header className="h-20 border-b border-slate-50 flex items-center justify-between px-12 shrink-0 bg-white/40 backdrop-blur-md">
          <div
            className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] opacity-40"
            aria-hidden="true"
            style={{ minWidth: 220 }}
          >
            <ChevronRight className="h-3 w-3 text-slate-400 opacity-0" />
          </div>
          <div className="flex items-center gap-6">
            <div style={{ width: 0 }} />
            <div className="flex items-center gap-2">
               <button aria-label="Compartir" className="p-3 transition-all text-xl hover:bg-neutral-light rounded-2xl cursor-pointer" style={{ color: "var(--kv-subtext)" }}>
                 <Share2 size={20} />
               </button>
               <button aria-label="Marcador" className="p-3 transition-all text-xl hover:bg-neutral-light rounded-2xl cursor-pointer" style={{ color: "var(--kv-subtext)" }}>
                 <Bookmark size={20} />
               </button>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {historyOpen && (
            <div className="border-r border-slate-100 bg-slate-50/60">
              <ConversationsSidebar
                conversations={conversations}
                activeId={activeConvId}
                onNew={() => {
                  onNewConversation();
                  setHistoryOpen(false);
                }}
                onSelect={(id) => {
                  setActiveConvId(id);
                  setHistoryOpen(false);
                }}
                onRename={onRenameConversation}
              />
            </div>
          )}

          {/* Chat Stream Section */}
          <div className="min-w-0 flex-1">
            <Chat
              messages={messages}
              bottomRef={bottomRef}
              input={input}
              setInput={setInput}
              send={send}
              loading={loading}
              onEditUserMessage={onEditUserMessage}
              userPhoto={user.photoURL}
            />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .shimmer-bg {
          background: linear-gradient(120deg, rgba(16, 185, 129, 0) 15%, rgba(16, 185, 129, 0.05) 50%, rgba(16, 185, 129, 0) 85%);
          background-size: 200% 200%;
          animation: shimmer 12s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
