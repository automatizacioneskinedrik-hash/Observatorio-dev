"use client";
import { useEffect } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
    const html = document.documentElement;
    if (theme === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    localStorage.setItem("theme", theme);
}

export function ThemeToggleFab() {
    useEffect(() => {
        applyTheme("light");
    }, []);

    return null;
}
