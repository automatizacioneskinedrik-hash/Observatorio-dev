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
            m.role === "user"
              ? "linear-gradient(180deg, rgba(0,64,164,0.35), rgba(0,64,164,0.18))"
              : "rgba(255,255,255,0.06)",
          border:
            m.role === "user"
              ? "1px solid rgba(0, 64, 164, 0.45)"
              : "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
          {m.role === "user" ? "Tú" : "AECCO IA"}
        </div>
        <div style={{ opacity: 0.95 }}>
          {m.text === "__typing__" ? <TypingDots /> : m.text}
        </div>
      </div>
    </div>
  );
}
