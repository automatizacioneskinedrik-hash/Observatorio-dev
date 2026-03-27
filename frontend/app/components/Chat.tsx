"use client";

import { ChatMessage } from "../types/chat";
import TypingDots from "./TypingDots";
import {
  Copy,
  Database,
  Microchip,
  RefreshCcw,
  Send,
  User,
} from "lucide-react";

type Props = {
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  onEditUserMessage?: (messageId: string, newText: string) => void;
  userPhoto?: string | null;
  input: string;
  setInput: (val: string) => void;
  send: () => void;
};

export default function Chat({
  messages,
  bottomRef,
  loading,
  onEditUserMessage,
  userPhoto,
  input,
  setInput,
  send,
}: Props) {
  // If no messages, render an empty div or initial view
  const showInitial = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto pt-10 pb-52 scrollbar-hide px-4">
          <div className="max-w-[880px] mx-auto space-y-12 relative">
            {showInitial && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-[50px] font-black tracking-[0.5em] text-slate-200/60 uppercase">
                  AECO IA
                </span>
              </div>
            )}
          {showInitial ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center opacity-0 animate-in fade-in duration-1000">
              <div className="size-20 rounded-3xl bg-neutral-light/50 flex items-center justify-center mb-6 border border-emerald-900/5">
                <Database size={44} className="text-emerald-900/10" />
              </div>
              <p className="text-[13px] font-bold text-neutral-medium uppercase tracking-[0.25em] opacity-40">Consultoría AEC de Nueva Generación</p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";

              if (isUser) {
                return (
                  <div key={m.id} className="flex gap-6 flex-row-reverse group animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="size-11 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm border-2 border-white ring-4 ring-emerald-500/5">
                      {userPhoto ? (
                        <img src={userPhoto} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="max-w-[85%] space-y-2 text-right">
                      <div className="bg-white border border-slate-100 rounded-[22px] rounded-tr-none px-6 py-4 text-slate-800 leading-relaxed text-left inline-block shadow-[0_12px_40px_-10px_rgba(0,0,0,0.06)]">
                        <p className="text-[15px] font-bold leading-normal tracking-tight">{m.text}</p>
                      </div>
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <button
                          onClick={() => {
                            const next = prompt("Editar tu mensaje", m.text);
                            if (next && next.trim()) onEditUserMessage?.(m.id, next.trim());
                          }}
                          className="text-[9px] text-slate-400 hover:text-emerald-700 font-black tracking-widest uppercase"
                        >
                          Editar
                        </button>
                        <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Sent"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Assistant Message
              return (
                <div key={m.id} className="flex gap-6 group animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="size-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/10 border border-emerald-900/5 ring-4 ring-emerald-500/5" style={{ backgroundColor: "var(--kv-panel)" }}>
                      <Microchip size={24} className="text-[var(--kv-brand-accent)]" />
                    </div>
                  <div className="flex-1 space-y-5">
                    <div className="bg-slate-50 border border-slate-100 rounded-[28px] rounded-tl-none p-8 text-slate-800 shadow-sm leading-loose">
                      <div className="markdown-content prose prose-slate max-w-none prose-sm prose-headings:text-emerald-900/70 prose-a:text-emerald-700 font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {m.text ? (
                          <>{m.text}</>
                        ) : (
                          <div className="flex items-center gap-3 text-[13px] font-black uppercase tracking-[0.25em] text-slate-400">
                            <span className="p-2 bg-emerald-500/10 rounded-full">
                              <TypingDots />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                      <button className="text-slate-400 hover:text-emerald-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <Copy size={14} />
                        COPIAR
                      </button>
                      <button className="text-slate-400 hover:text-emerald-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <RefreshCcw size={14} />
                        REGENERAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} className="h-10" />
        </div>
      </div>

      {/* Input Area (Integrated) */}
      <div
        className="absolute left-0 right-0 z-30 pointer-events-none px-4"
        style={showInitial ? { top: "50%", transform: "translateY(40%)" } : { bottom: 0 }}
      >
        <div className="max-w-[940px] mx-auto px-6 pointer-events-auto">
          <div 
            className="bg-white border rounded-[48px] p-6 shadow-[0_35px_100px_rgba(0,0,0,0.06)] transition-all relative group overflow-hidden" 
            style={{ borderColor: "var(--kv-accent-bg)" }}
          >
             {/* Core Input Field (NO BORDER UNTIL FOCUS) */}
             <div className="bg-emerald-50/10 rounded-[32px] mb-4 relative z-10 transition-all group-focus-within:ring-4 group-focus-within:ring-emerald-500/10 group-focus-within:bg-white border-0 outline-none overflow-hidden">
                <div className="flex items-stretch gap-3 px-2 py-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!loading && input.trim()) send();
                      }
                    }}
                    className="flex-1 bg-transparent border-0 focus:ring-0 outline-none placeholder:text-slate-400 px-4 resize-y max-h-[180px] text-[16px] font-bold tracking-tight leading-relaxed placeholder:font-medium scrollbar-thumb-slate-300 scrollbar-track-transparent"
                    style={{ color: "var(--kv-text)", border: 'none', outline: 'none', boxShadow: 'none', minHeight: '56px', overflowY: 'auto' }}
                    placeholder="¿Qué quieres observar el día de hoy?"
                  />
                  <button 
                    type="button"
                    onClick={() => { if (!loading && input.trim()) send(); }}
                    disabled={loading || !input.trim()}
                    aria-label="Enviar mensaje"
                    className={`size-14 rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-sm active:scale-90 cursor-pointer ${
                      !input.trim() 
                        ? "opacity-60" 
                        : "text-white shadow-xl scale-105"
                    }`}
                    style={{ 
                       backgroundColor: input.trim() ? "var(--kv-brand-accent)" : "var(--kv-accent-bg)",
                       color: input.trim() ? "white" : "var(--kv-brand-accent)",
                       minWidth: "56px",
                    }}
                  >
                    <Send size={24} />
                    <span className="sr-only">Enviar mensaje</span>
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
