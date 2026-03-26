"use client";

import { useMemo } from "react";
import { ChatMessage } from "../types/chat";
import TypingDots from "./TypingDots";

type Props = {
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  onEditUserMessage?: (messageId: string, newText: string) => void;
  userPhoto?: string;
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
        <div className="max-w-[880px] mx-auto space-y-12">
          {showInitial ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center opacity-0 animate-in fade-in duration-1000">
              <div className="size-20 rounded-3xl bg-neutral-light/50 flex items-center justify-center mb-6 border border-emerald-900/5">
                <span className="material-symbols-outlined text-emerald-900/10 text-4xl">database</span>
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
                        <span className="material-symbols-outlined text-slate-400 text-xl font-bold">person</span>
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
                    <span className="material-symbols-outlined text-[24px] font-bold" style={{ color: "var(--kv-brand-accent)" }}>smart_toy</span>
                  </div>
                  <div className="flex-1 space-y-5">
                    <div className="bg-slate-50 border border-slate-100 rounded-[28px] rounded-tl-none p-8 text-slate-800 shadow-sm leading-loose">
                      <div className="markdown-content prose prose-slate max-w-none prose-sm prose-headings:text-emerald-900/70 prose-a:text-emerald-700 font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {m.text || <div className="animate-pulse flex space-x-2"><div className="h-2 w-24 bg-slate-200 rounded"></div></div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                      <button className="text-slate-400 hover:text-emerald-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <span className="material-symbols-outlined text-base">content_copy</span> COPIAR
                      </button>
                      <button className="text-slate-400 hover:text-emerald-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <span className="material-symbols-outlined text-base">refresh</span> REGENERAR
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-6 animate-in fade-in duration-300">
              <div className="size-11 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 animate-pulse border border-slate-100">
                <span className="material-symbols-outlined text-emerald-900/20 text-[24px] font-bold">smart_toy</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-50 rounded-[22px] rounded-tl-none p-6 shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-10" />
        </div>
      </div>

      {/* Input Area (Integrated) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pb-10 pt-24 z-30 pointer-events-none px-4">
        <div className="max-w-[940px] mx-auto px-6 pointer-events-auto">
          <div 
            className="bg-white border rounded-[48px] p-6 shadow-[0_35px_100px_rgba(0,0,0,0.06)] transition-all relative group overflow-hidden" 
            style={{ borderColor: "var(--kv-accent-bg)" }}
          >
             {/* Core Input Field (NO BORDER UNTIL FOCUS) */}
             <div className="bg-emerald-50/10 rounded-[32px] mb-4 relative z-10 transition-all group-focus-within:ring-4 group-focus-within:ring-emerald-500/10 group-focus-within:bg-white border-0 outline-none overflow-hidden">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!loading && input.trim()) send();
                    }
                  }}
                  className="w-full bg-transparent border-0 focus:ring-0 outline-none placeholder:text-slate-400 py-6 px-8 resize-none h-18 scrollbar-hide text-[16px] font-bold tracking-tight leading-relaxed placeholder:font-medium shadow-none appearance-none overflow-hidden"
                  style={{ color: "var(--kv-text)", border: 'none', outline: 'none', boxShadow: 'none' }}
                  placeholder="¿Qué quieres observar el día de hoy?"
                />
             </div>

             <div className="flex items-center justify-between relative z-10 px-4 mt-1">
                <div className="flex items-center gap-1.5">
                   <button className="size-11 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95 cursor-pointer">
                      <span className="material-symbols-outlined text-[24px] font-light">attach_file</span>
                   </button>
                   <button className="size-11 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95 cursor-pointer">
                      <span className="material-symbols-outlined text-[24px] font-light">mic</span>
                   </button>
                   <button className="size-11 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95 cursor-pointer">
                      <span className="material-symbols-outlined text-[24px] font-light">image</span>
                   </button>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30" style={{ color: "var(--kv-text)" }}>
                     {input.length} / 2000
                  </span>
                  <button 
                    onClick={() => { if (!loading && input.trim()) send(); }}
                    disabled={loading || !input.trim()}
                    className={`size-14 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-sm active:scale-90 cursor-pointer ${
                      !input.trim() 
                        ? "opacity-60" 
                        : "text-white shadow-xl scale-105"
                    }`}
                    style={{ 
                       backgroundColor: input.trim() ? "var(--kv-brand-accent)" : "var(--kv-accent-bg)",
                       color: input.trim() ? "white" : "var(--kv-brand-accent)"
                    }}
                  >
                    <span className="material-symbols-outlined text-[28px] font-bold">send</span>
                  </button>
                </div>
             </div>
          </div>
          <p className="text-center text-[10px] font-extrabold mt-6 uppercase tracking-[0.3em] opacity-20">
             Intelligence Core v2.5.0 • K-Vision Design
          </p>
        </div>
      </div>
    </div>
  );
}
