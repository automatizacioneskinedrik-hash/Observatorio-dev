"use client";
import type { Conversation } from "../types/conversation";

export function ConversationsSidebar({
    conversations,
    activeId,
    onNew,
    onSelect,
    onRename,
}: {
    conversations: Conversation[];
    activeId: string | null;
    onNew: () => void;
    onSelect: (id: string) => void;
    onRename: (id: string, title: string) => void;
}) {
    const formatUpdatedAt = (value: number) =>
        new Intl.DateTimeFormat("es-VE", {
            day: "2-digit",
            month: "short",
        }).format(new Date(value));

    return (
        <div
            style={{
                width: "clamp(270px, 24vw, 340px)",
                height: "100%",
                background: "var(--kv-panel)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                overflow: "hidden",
            }}
        >
            <button
                onClick={onNew}
                style={{
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid var(--kv-accent-border)",
                    background: "var(--kv-accent-bg)",
                    color: "var(--kv-brand-accent)",
                    cursor: "pointer",
                    fontWeight: 800,
                    boxShadow: "0 10px 26px rgba(16, 185, 129, 0.12)",
                }}
            >
                + Nueva conversación
            </button>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    overflowY: "auto",
                    minHeight: 0,
                    flex: 1,
                    paddingRight: 4,
                }}
            >
                {conversations.length === 0 ? (
                    <div
                        style={{
                            marginTop: 12,
                            padding: "18px 16px",
                            borderRadius: 20,
                            border: "1px dashed var(--kv-border)",
                            color: "var(--kv-subtext)",
                            background: "rgba(255,255,255,0.7)",
                            fontSize: 13,
                            lineHeight: 1.5,
                        }}
                    >
                        Aún no hay conversaciones guardadas.
                        <div style={{ marginTop: 8, fontWeight: 700, color: "var(--kv-text)" }}>
                            Crea una nueva conversación para empezar.
                        </div>
                    </div>
                ) : (
                    conversations
                        .slice()
                        .sort((a, b) => b.updatedAt - a.updatedAt)
                        .map((c) => {
                            const active = c.id === activeId;

                            return (
                                <div
                                    key={c.id}
                                    onClick={() => onSelect(c.id)}
                                    onDoubleClick={() => {
                                        const next = prompt("Renombrar conversación", c.title);
                                        if (next && next.trim()) onRename(c.id, next.trim());
                                    }}
                                    style={{
                                        padding: "14px 14px",
                                        borderRadius: 18,
                                        border: active
                                            ? "1px solid var(--kv-accent-border)"
                                            : "1px solid var(--kv-border)",
                                        background: active ? "var(--kv-accent-bg)" : "rgba(255,255,255,0.9)",
                                        boxShadow: active
                                            ? "0 14px 30px rgba(16, 185, 129, 0.12)"
                                            : "0 10px 24px rgba(15, 23, 42, 0.04)",
                                        cursor: "pointer",
                                        transition: "all 180ms ease",
                                    }}
                                    title="Doble click para renombrar"
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "start",
                                            justifyContent: "space-between",
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 800,
                                                    color: "var(--kv-text)",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {c.title}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 10,
                                                    letterSpacing: "0.16em",
                                                    textTransform: "uppercase",
                                                    color: "var(--kv-subtext)",
                                                    opacity: 0.7,
                                                }}
                                            >
                                                {formatUpdatedAt(c.updatedAt)} · {c.messages.length} mensajes
                                            </div>
                                        </div>

                                        {active && (
                                            <span
                                                style={{
                                                    flexShrink: 0,
                                                    borderRadius: 999,
                                                    background: "white",
                                                    color: "var(--kv-brand-accent)",
                                                    padding: "5px 9px",
                                                    fontSize: 9,
                                                    fontWeight: 900,
                                                    letterSpacing: "0.18em",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                Activa
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
}
