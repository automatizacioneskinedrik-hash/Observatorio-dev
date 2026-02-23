import { ChatMessage } from "../types/chat";
import { ChatInput } from "./ChatInput";
import TypingDots from "./TypingDots";

type Props = {
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  send: () => void;
  loading: boolean;

  // ✅ nuevo: editar (opcional)
  onEditUserMessage?: (messageId: string, newText: string) => void;
};

export default function Chat({
  messages,
  bottomRef,
  input,
  setInput,
  send,
  loading,
  onEditUserMessage,
}: Props) {
  return (
    <>
      {/* Lista de mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "6px 10px",
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === "user";

          return (
            <div
              key={m.id} // ✅ IMPORTANTÍSIMO: no uses index
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                padding: "6px 0",
              }}
            >
              {isUser ? (
                // ✅ BURBUJA (usuario)
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 14px",
                    borderRadius: 18,
                    lineHeight: 1.35,
                    background: "var(--kv-chat-user-bg)",
                    border: "1px solid var(--kv-chat-user-border)",
                    color: "var(--kv-text)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.65 }}>Tú</div>

                    {/* ✅ Botón editar (solo si te pasan onEditUserMessage) */}
                    {onEditUserMessage && (
                      <button
                        type="button"
                        onClick={() => {
                          const next = prompt("Editar tu mensaje", m.text);
                          if (next && next.trim()) onEditUserMessage(m.id, next.trim());
                        }}
                        style={{
                          all: "unset",
                          cursor: "pointer",
                          fontSize: 12,
                          opacity: 0.75,
                          color: "var(--kv-text)",
                        }}
                        title="Editar"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  <div style={{ opacity: 0.95 }}>{m.text}</div>
                </div>
              ) : (
                // ✅ TEXTO PLANO (assistant) tipo ChatGPT
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "2px 2px",
                    lineHeight: 1.55,
                    opacity: 0.95,
                    color: "var(--kv-text)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div>{m.text}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* 🔥 Indicador de escribiendo */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", padding: "6px 0" }}>
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 18,
                background: "var(--kv-panel)",
                border: "1px solid var(--kv-border)",
              }}
            >
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput input={input} setInput={setInput} send={send} loading={loading} />
    </>
  );
}
