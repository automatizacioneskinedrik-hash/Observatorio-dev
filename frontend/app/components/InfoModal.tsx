"use client";

import type { ReactNode } from "react";

export function InfoModal({
    title,
    onClose,
    onAccept,
    acceptText = "Aceptar",
    cancelText = "Cancelar",
    children,
}: {
    title: string;
    onClose: () => void;
    onAccept: () => void;
    acceptText?: string;
    cancelText?: string;
    children: ReactNode;
}) {
    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: 16,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 520,
                    maxWidth: "100%",
                    background: "var(--kv-panel)",
                    border: "1px solid var(--kv-border)",
                    borderRadius: 16,
                    padding: 22,
                    color: "var(--kv-text)",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 14,
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 650 }}>{title}</h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        title="Cerrar"
                        style={{
                            all: "unset",
                            cursor: "pointer",
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid var(--kv-border)",
                            background: "var(--kv-panel-strong)",
                            color: "var(--kv-text)",
                            opacity: 0.85,
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ color: "var(--kv-text)" }}>{children}</div>

                {/* Actions */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        marginTop: 18,
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "1px solid var(--kv-border)",
                            background: "transparent",
                            color: "var(--kv-text)",
                            cursor: "pointer",
                        }}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onAccept}
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            border: "1px solid #00A884",
                            background: "rgba(0,168,132,0.18)",
                            color: "var(--kv-text)",
                            cursor: "pointer",
                            boxShadow: "0 0 0 3px rgba(0,168,132,0.15)",

                        }}
                    >
                        {acceptText}
                    </button>
                </div>
            </div>
        </div>
    );
}
