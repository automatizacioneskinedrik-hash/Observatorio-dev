"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Chat from "./components/Chat";
import { Sidebar } from "./components/Sidebar";
import { AuthGate } from "./components/auth/AuthGate";
import { MENU } from "./constants/menu";
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

  const handleAuthSuccess = useCallback((nextUser: User) => {
    setUser(nextUser);
  }, []);

  const { logout, authLoading } = useSocialAuth(handleAuthSuccess);
  
  const sidebarMenu = MENU.filter((item) =>
    ["observatorio", "personas", "invitaciones"].includes(item.id as Mode)
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
        menu={sidebarMenu as any}
        activeId={activeMode}
        onSelect={onPickMode}
        conversations={conversations}
        activeConvId={activeConvId}
        onNewConversation={onNewConversation}
        onSelectConversation={setActiveConvId}
        onRenameConversation={onRenameConversation}
        onUserClick={() => setAuthOpen(true)}
      />

      {/* Main Experience Layout (Bubble Concept) */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-[0_45px_120px_rgba(0,0,0,0.06)] z-10 transition-all duration-700 m-4 rounded-[42px] border border-white/40">
        {/* Header */}
        <header className="h-20 border-b border-slate-50 flex items-center justify-between px-12 shrink-0 bg-white/40 backdrop-blur-md">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] opacity-40">
            <span className="hover:text-emerald-700 transition-colors cursor-pointer text-slate-400">AEC Observatory</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="opacity-100" style={{ color: "var(--kv-brand-accent)" }}>Artificial Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="group flex items-center gap-3 px-5 py-2.5 rounded-full border border-emerald-900/10 transition-all hover:bg-emerald-900/5 cursor-pointer" style={{ backgroundColor: "var(--kv-accent-bg)" }}>
              <span className="flex size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: "var(--kv-brand-accent)" }}>Kernel Optimizando</span>
            </div>
            <div className="flex items-center gap-2">
               <button className="material-symbols-outlined p-3 transition-all text-xl hover:bg-neutral-light rounded-2xl cursor-pointer" style={{ color: "var(--kv-subtext)" }}>share</button>
               <button className="material-symbols-outlined p-3 transition-all text-xl hover:bg-neutral-light rounded-2xl cursor-pointer" style={{ color: "var(--kv-subtext)" }}>bookmark</button>
            </div>
          </div>
        </header>

        {/* Chat Stream Section */}
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