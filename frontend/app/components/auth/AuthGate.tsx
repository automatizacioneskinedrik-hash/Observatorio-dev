"use client";

import type { CSSProperties } from "react";
import type { User } from "../../types/user";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";

type Props = {
  onAuthenticated: (user: User) => void;
};

export function AuthGate({ onAuthenticated }: Props) {
  const { googleReady, authLoading, authError, signInWithGoogle } =
    useGoogleAuth(onAuthenticated);

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
    fontWeight: 600,
  };

  const disabledSocialStyle: CSSProperties = {
    ...socialButtonStyle,
    opacity: 0.55,
    cursor: "not-allowed",
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
        <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center" }}>
          Regístrate o inicia sesión
        </div>

        <button
          style={socialButtonStyle}
          onClick={signInWithGoogle}
          disabled={!googleReady || authLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.2 14.6 2.2 12 2.2a9.8 9.8 0 1 0 0 19.6c5.7 0 9.5-4 9.5-9.6 0-.6-.1-1.1-.2-1.6H12z"
            />
          </svg>
          Continuar con Google
        </button>

        <button style={disabledSocialStyle} disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16.2 12.9c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.5-1.7-3-1.7-1.3-.1-2.4.8-3 .8-.6 0-1.5-.8-2.5-.8-1.3 0-2.5.8-3.1 1.9-1.3 2.2-.3 5.4.9 7.1.6.8 1.2 1.7 2.1 1.6.8 0 1.2-.5 2.3-.5s1.4.5 2.3.5c.9 0 1.5-.8 2.1-1.6.7-1 1-2 1-2-.1 0-2-.8-2-3.1zm-2-6.2c.5-.6.9-1.4.8-2.2-.8 0-1.7.5-2.2 1.1-.5.6-.9 1.5-.8 2.3.9.1 1.7-.4 2.2-1.2z"
            />
          </svg>
          Continuar con Apple
        </button>

        <button style={disabledSocialStyle} disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#F25022" d="M2 2h9v9H2z" />
            <path fill="#7FBA00" d="M13 2h9v9h-9z" />
            <path fill="#00A4EF" d="M2 13h9v9H2z" />
            <path fill="#FFB900" d="M13 13h9v9h-9z" />
          </svg>
          Continuar con Microsoft
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
          <div style={{ flex: 1, height: 1, background: "var(--kv-border)" }} />
          <span>o</span>
          <div style={{ flex: 1, height: 1, background: "var(--kv-border)" }} />
        </div>

        <input placeholder="Ingresa tu correo" style={inputStyle} />

        <button style={primaryStyle} disabled>
          Continuar
        </button>

        {authError && (
          <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center" }}>
            {authError}
          </div>
        )}

        <div style={{ fontSize: 12, textAlign: "center", opacity: 0.75 }}>
          Al continuar, aceptas nuestros términos y política de privacidad.
        </div>
      </div>
    </div>
  );
}
