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
                background: "rgba(15,23,42,0.65)",
                backdropFilter: "blur(10px)",
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
                    background: "linear-gradient(145deg,#ffffff,#f4faf8)",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 20,
                    padding: 26,
                    color: "var(--kv-text)",
                    boxShadow: "0 40px 100px rgba(15,23,42,0.35)",
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
                <div
                    style={{
                        color: "var(--kv-text)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        marginTop: 8,
                        padding: "12px 14px",
                        borderRadius: 12,
                        background: "rgba(16,185,129,0.08)",
                        border: "1px dashed rgba(16,185,129,0.35)",
                    }}
                >
                    {children}
                </div>

                {/* Actions */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 12,
                        marginTop: 26,
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 12,
                            border: "1px solid rgba(15,23,42,0.2)",
                            background: "transparent",
                            color: "var(--kv-text)",
                            cursor: "pointer",
                            fontWeight: 600,
                        }}
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onAccept}
                        style={{
                            padding: "10px 18px",
                            borderRadius: 12,
                            border: "1px solid #0f766e",
                            background: "linear-gradient(135deg, rgba(16,118,110,0.15), rgba(16,185,129,0.25))",
                            color: "var(--kv-text)",
                            cursor: "pointer",
                            boxShadow: "0 0 25px rgba(16,185,129,0.25)",
                            fontWeight: 700,
                        }}
                        >
                        {acceptText}
                    </button>
                </div>
            </div>
        </div>
    );
}
