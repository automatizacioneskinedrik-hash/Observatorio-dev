import { ChatMessage } from "../types/chat";
import TypingDots from "./TypingDots";


export function MessageBubble({ m }: { m: ChatMessage }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: m.role === "user" ? "flex-end" : "flex-start",
        padding: "6px 0",
      }}
    >
      <div
        style={{
          maxWidth: "85%",
          padding: "12px 14px",
          borderRadius: 18,
          lineHeight: 1.35,
          background:
            m.role === "user" ? "var(--kv-chat-user-bg)" : "var(--kv-chat-bot-bg)",
          border:
            m.role === "user"
              ? "1px solid var(--kv-chat-user-border)"
              : "1px solid var(--kv-chat-bot-border)",
          boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
          color: "var(--kv-text)",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
          {m.role === "user" ? "Tú" : "AECO IA"}
        </div>
        <div style={{ opacity: 0.95 }}>
          {m.text === "__typing__" ? <TypingDots /> : m.text}
        </div>
      </div>
    </div>
  );
}
