"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import type { User } from "../../types/user";

type Props = {
  onAuthenticated: (user: User) => void;
};

export function AuthGate({ onAuthenticated }: Props) {
  const { providerReady, authLoading, authError, signInWithGoogle } =
    useSocialAuth(onAuthenticated);
  const [email, setEmail] = useState("");

  const isValidEmail = useMemo(() => {
    const value = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, [email]);

  const inputStyle: CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--kv-border)",
    background: "transparent",
    color: "var(--kv-text)",
    outline: "none",
  };

  const primaryStyle: CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--kv-accent-border)",
    background: "var(--kv-accent-bg)",
    color: "var(--kv-text)",
    cursor: "not-allowed",
    fontWeight: 650,
    opacity: 0.55,
  };

  const socialButtonStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--kv-border)",
    background: "transparent",
    color: "var(--kv-text)",
    cursor: "pointer",
    fontWeight: 400,
    transition: "background-color 160ms ease, border-color 160ms ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--kv-text)",
        fontFamily: "var(--font-neue-montreal), system-ui",
        backgroundColor: "var(--kv-bg)",
        backgroundImage: "var(--kv-glow)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid var(--kv-border)",
          borderRadius: 16,
          padding: 20,
          background: "var(--kv-surface)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
          Registrate o inicia sesion
        </div>
        <div style={{ fontSize: 16, textAlign: "center", opacity: 0.8 }}>
          Incia sesion y tendras acceso completo a AEECCO IA
        </div>

        <button
          style={socialButtonStyle}
          onClick={signInWithGoogle}
          disabled={!providerReady.google || authLoading}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            e.currentTarget.style.borderColor = "var(--kv-accent-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "var(--kv-border)";
          }}
        >
          <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.61 20.08H42V20H24v8h11.3C33.65 32.66 29.19 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.95 3.05l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"
            />
            <path
              fill="#FF3D00"
              d="M6.31 14.69l6.57 4.82C14.66 15.1 18.96 12 24 12c3.06 0 5.84 1.15 7.95 3.05l5.66-5.66C34.05 6.05 29.27 4 24 4c-7.68 0-14.41 4.34-17.69 10.69z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.17 0 9.86-1.98 13.41-5.2l-6.19-5.24C29.15 35.09 26.7 36 24 36c-5.17 0-9.62-3.32-11.26-7.93l-6.52 5.02C9.46 39.56 16.19 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.61 20.08H42V20H24v8h11.3a12.04 12.04 0 0 1-4.08 5.56l.01-.01 6.19 5.24C37 39.15 44 34 44 24c0-1.34-.14-2.65-.39-3.92z"
            />
          </svg>
          Continuar con Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--kv-border)" }} />
          <span>o</span>
          <div style={{ flex: 1, height: 1, background: "var(--kv-border)" }} />
        </div>

        <input
          placeholder="Ingresa tu correo"
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <button
          style={
            isValidEmail
              ? {
                  ...primaryStyle,
                  cursor: "pointer",
                  opacity: 1,
                }
              : primaryStyle
          }
          disabled={!isValidEmail}
        >
          Continuar
        </button>

        {authError && (
          <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center" }}>
            {authError}
          </div>
        )}

        <div style={{ fontSize: 12, textAlign: "center", opacity: 0.75 }}>
          Al continuar, aceptas nuestros terminos y politica de privacidad.
        </div>
      </div>
    </div>
  );
}
