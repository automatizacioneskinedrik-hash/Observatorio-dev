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
    return (
        <div
            style={{
                width: 280,
                borderRight: "1px solid var(--kv-border)",
                background: "var(--kv-panel)",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
            }}
        >
            <button
                onClick={onNew}
                style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid var(--kv-accent-border)",
                    background: "var(--kv-accent-bg)",
                    color: "var(--kv-text)",
                    cursor: "pointer",
                }}
            >
                + Nueva conversación
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
                {conversations
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
                                    padding: "10px 10px",
                                    borderRadius: 12,
                                    border: active
                                        ? "1px solid var(--kv-accent-border)"
                                        : "1px solid var(--kv-border)",
                                    background: active ? "var(--kv-accent-bg)" : "transparent",
                                    cursor: "pointer",
                                }}
                                title="Doble click para renombrar"
                            >
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: "var(--kv-text)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {c.title}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
