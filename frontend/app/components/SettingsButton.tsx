"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconSettings, IconUser, IconTheme } from "./icons";

export function SettingsButton() {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<"dark" | "light">("light");

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!wrapRef.current) return;
            if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    useEffect(() => {
        setTheme("light");
        localStorage.setItem("theme", "light");
        document.documentElement.classList.remove("dark");
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        const next = root.classList.contains("dark") ? "light" : "dark";
        root.classList.toggle("dark", next === "dark");
        localStorage.setItem("theme", next);
        setTheme(next);
    };

    return (
        <div
            ref={wrapRef}
            style={{ position: "fixed", left: 16, bottom: 16, zIndex: 9999 }}
        >
            <button
                type="button"
                title="Configuración"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "var(--kv-gear-bg)",
                    border: "1px solid var(--kv-gear-border)",
                    color: "var(--kv-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                    backdropFilter: "blur(10px)",
                    transition: "all 180ms ease",
                }}
            >
                <IconSettings size={18} />
            </button>

            {open && (
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        bottom: 56,
                        left: 0,
                        minWidth: 220,
                        padding: 10,
                        borderRadius: 16,
                        background: "var(--kv-popover-bg)",
                        border: "1px solid var(--kv-popover-border)",
                        boxShadow: "var(--kv-popover-shadow)",
                        backdropFilter: "blur(12px)",
                        color: "var(--kv-text)",
                    }}
                >
                    <MenuButton icon={<IconUser />} onClick={() => setOpen(false)}>
                        Login
                    </MenuButton>

                    <MenuButton
                        icon={<IconTheme mode={theme} />}
                        onClick={() => {
                            toggleTheme();
                            setOpen(false);
                        }}
                    >
                        Cambiar tema
                    </MenuButton>
                </div>
            )}
        </div>
    );
}

function MenuButton({
    children,
    icon,
    onClick,
}: {
    children: ReactNode;
    icon: ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid transparent",
                color: "var(--kv-text)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--kv-accent-bg)";
                e.currentTarget.style.border = "1px solid var(--kv-accent-border)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.border = "1px solid transparent";
            }}
        >
            {icon}
            <span>{children}</span>
        </button>
    );
}
