"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
    const html = document.documentElement;
    if (theme === "light") html.classList.add("light");
    else html.classList.remove("light");
    localStorage.setItem("theme", theme);
}

function getTheme(): Theme {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark";
}

/* 🌞 Minimal Sun */
function SunIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M4.93 19.07l1.41-1.41" />
            <path d="M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

/* 🌙 Minimal Moon */
function MoonIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </svg>
    );
}

export function ThemeToggleFab() {
    const [theme, setThemeState] = useState<Theme>("dark");

    useEffect(() => {
        const t = getTheme();
        setThemeState(t);
        applyTheme(t);
    }, []);

    const toggle = () => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setThemeState(next);
        applyTheme(next);
    };

    return (
        <button
            onClick={toggle}
            aria-label="Cambiar tema"
            title={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
            style={{
                position: "fixed",
                right: 24,
                bottom: 24,
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "1px solid var(--kv-border)",
                background: "transparent",
                color: "var(--kv-text)", // 👈 blanco o negro automático
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 9999,
                transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--kv-accent-bg)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
            }}
        >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
