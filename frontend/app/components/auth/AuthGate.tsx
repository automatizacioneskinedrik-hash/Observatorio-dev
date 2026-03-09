"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useSocialAuth } from "../../hooks/useSocialAuth";
import type { User } from "../../types/user";

type Props = {
  onAuthenticated: (user: User) => void;
};

type EmailFlowStep = "email" | "code" | "register";

export function AuthGate({ onAuthenticated }: Props) {
  const { providerReady, authLoading, authError, signInWithGoogle } =
    useSocialAuth(onAuthenticated);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<EmailFlowStep>("email");
  const [emailFlowLoading, setEmailFlowLoading] = useState(false);
  const [emailFlowError, setEmailFlowError] = useState<string | null>(null);
  const [emailFlowMessage, setEmailFlowMessage] = useState<string | null>(null);

  const isValidEmail = useMemo(() => {
    const value = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }, [email]);
  const isValidCode = /^\d{6}$/.test(code.trim());
  const isValidRegisterForm =
    name.trim().length > 0 && password.trim().length >= 8;

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

  const secondaryButtonStyle: CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--kv-border)",
    background: "transparent",
    color: "var(--kv-text)",
    cursor: "pointer",
    fontWeight: 500,
  };

  const handleRequestCode = async () => {
    if (!isValidEmail) return;
    if (!apiBase) {
      setEmailFlowError("Falta NEXT_PUBLIC_API_BASE_URL");
      return;
    }

    setEmailFlowError(null);
    setEmailFlowMessage(null);
    setEmailFlowLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "No se pudo enviar el codigo");
      }

      setStep("code");
      setEmailFlowMessage("Te enviamos un codigo de 6 digitos a tu correo.");
    } catch (error) {
      setEmailFlowError(
        error instanceof Error ? error.message : "Error enviando codigo"
      );
    } finally {
      setEmailFlowLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isValidCode) return;
    if (!apiBase) {
      setEmailFlowError("Falta NEXT_PUBLIC_API_BASE_URL");
      return;
    }

    setEmailFlowError(null);
    setEmailFlowMessage(null);
    setEmailFlowLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Codigo invalido");
      }

      setStep("register");
      setEmailFlowMessage("Codigo verificado. Completa tu registro.");
    } catch (error) {
      setEmailFlowError(
        error instanceof Error ? error.message : "Error verificando codigo"
      );
    } finally {
      setEmailFlowLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isValidRegisterForm) return;
    if (!apiBase) {
      setEmailFlowError("Falta NEXT_PUBLIC_API_BASE_URL");
      return;
    }

    setEmailFlowError(null);
    setEmailFlowMessage(null);
    setEmailFlowLoading(true);
    try {
      const response = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "No se pudo completar el registro");
      }

      const nextUser: User = {
        name: data?.name ?? name.trim(),
        email: data?.email ?? email.trim(),
        subscription: "Free",
        isProfileComplete: data?.isProfileComplete === true,
        profileCategory:
          typeof data?.tipo_caracterizacion === "string"
            ? data.tipo_caracterizacion
            : null,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("kv_user_email", nextUser.email);
        localStorage.setItem(
          "kv_profile_complete",
          nextUser.isProfileComplete === true ? "true" : "false"
        );
        localStorage.setItem("kv_profile_category", nextUser.profileCategory ?? "");
        localStorage.setItem("kv_local_user", JSON.stringify(nextUser));
        sessionStorage.setItem("kv_auth_session", "active");
      }

      onAuthenticated(nextUser);
    } catch (error) {
      setEmailFlowError(
        error instanceof Error ? error.message : "Error creando cuenta"
      );
    } finally {
      setEmailFlowLoading(false);
    }
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

        {step === "email" && (
          <>
            <input
              placeholder="Ingresa tu correo"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />

            <button
              style={
                isValidEmail && !emailFlowLoading
                  ? {
                      ...primaryStyle,
                      cursor: "pointer",
                      opacity: 1,
                    }
                  : primaryStyle
              }
              disabled={!isValidEmail || emailFlowLoading}
              onClick={() => {
                void handleRequestCode();
              }}
            >
              {emailFlowLoading ? "Enviando..." : "Continuar"}
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <input
              placeholder="Ingresa el codigo de 6 digitos"
              style={inputStyle}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
            />
            <button
              style={
                isValidCode && !emailFlowLoading
                  ? {
                      ...primaryStyle,
                      cursor: "pointer",
                      opacity: 1,
                    }
                  : primaryStyle
              }
              disabled={!isValidCode || emailFlowLoading}
              onClick={() => {
                void handleVerifyCode();
              }}
            >
              {emailFlowLoading ? "Verificando..." : "Verificar codigo"}
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => {
                setStep("email");
                setCode("");
                setEmailFlowError(null);
                setEmailFlowMessage(null);
              }}
            >
              Cambiar correo
            </button>
          </>
        )}

        {step === "register" && (
          <>
            <input value={email} style={{ ...inputStyle, opacity: 0.7 }} disabled />
            <input
              placeholder="Nombre completo"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Crea una contraseña (minimo 8)"
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              style={
                isValidRegisterForm && !emailFlowLoading
                  ? {
                      ...primaryStyle,
                      cursor: "pointer",
                      opacity: 1,
                    }
                  : primaryStyle
              }
              disabled={!isValidRegisterForm || emailFlowLoading}
              onClick={() => {
                void handleRegister();
              }}
            >
              {emailFlowLoading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </>
        )}

        {authError && (
          <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center" }}>
            {authError}
          </div>
        )}
        {emailFlowError && (
          <div style={{ fontSize: 12, color: "#ef4444", textAlign: "center" }}>
            {emailFlowError}
          </div>
        )}
        {emailFlowMessage && (
          <div style={{ fontSize: 12, color: "var(--kv-text)", textAlign: "center", opacity: 0.85 }}>
            {emailFlowMessage}
          </div>
        )}

        <div style={{ fontSize: 12, textAlign: "center", opacity: 0.75 }}>
          Al continuar, aceptas nuestros terminos y politica de privacidad.
        </div>
      </div>
    </div>
  );
}
