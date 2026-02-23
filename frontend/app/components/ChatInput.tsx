export function ChatInput({
  input,
  setInput,
  send,
  loading,
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  send: () => void;
  loading: boolean;
}) {
  const canSend = input.trim().length > 0 && !loading;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "760px",
        margin: "0 auto",
        borderRadius: 999,
        border: "1px solid var(--kv-border)",
        background: "var(--kv-input)",
        color: "var(--kv-text)",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && canSend && send()}
        placeholder={loading ? "AEC está respondiendo..." : "¿Qué quieres observar el día de hoy?"}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--kv-text)",
          fontSize: 16,
          padding: "12px 6px",
          opacity: loading ? 0.8 : 1,
        }}
      />

      <button
        onClick={send}
        disabled={!canSend}
        style={{
          width: 44,
          height: 44,
          background: "var(--kv-accent)",
          border: "1px solid var(--kv-accent-border)",
          color: "#ffffff",
          boxShadow: "0 10px 26px rgba(0,0,0,0.14)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canSend ? "pointer" : "not-allowed",
          opacity: canSend ? 1 : 0.6,
          transition: "all 200ms ease",
        }}
        title={loading ? "Esperando respuesta..." : "Enviar"}
      >

        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M13 7l5 5-5 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
