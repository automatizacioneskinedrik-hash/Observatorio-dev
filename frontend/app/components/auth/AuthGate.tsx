"use client";

import { useMemo, useState } from "react";
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

  const inputClass =
    "w-full rounded-[18px] border border-slate-200/50 bg-white/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-200 transition-colors focus:border-emerald-400 focus:outline-none backdrop-blur-sm";
  const primaryButtonClass =
    "w-full rounded-[18px] bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(16,185,129,0.35)] transition duration-200 hover:bg-emerald-600";
  const secondaryButtonClass =
    "w-full rounded-[18px] border border-slate-200 bg-transparent px-4 py-3 text-sm font-semibold text-slate-600 transition duration-200 hover:border-slate-300";
  const disabledButtonClass = "opacity-60 cursor-not-allowed";
  const googleButtonClass =
    "w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 flex items-center justify-center gap-3";

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
      className="min-h-screen w-full bg-slate-950 text-slate-900"
      style={{
        fontFamily: "var(--font-neue-montreal), system-ui",
      }}
    >
      <div className="relative min-h-screen flex items-center justify-end overflow-hidden px-4 py-10 sm:px-8 lg:px-12">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-140"
            style={{
              backgroundImage:
                "url('images/fondo.png')",
              filter: "grayscale(10%) contrast(110%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-[520px] lg:max-w-[620px] min-h-[620px] overflow-hidden rounded-[40px] bg-white/20 shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-[42px] backdrop-saturate-150 text-slate-50">
          <div className="grid grid-cols-1">
            <div className="px-10 py-14 lg:px-14 lg:py-20 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-[0.5em] text-emerald-300">
                  Kinedrik
                </span>
                <h1 className="text-3xl font-bold text-slate-50">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-slate-200">
                  Inicia sesión y tendrás acceso completo a AECO IA
                </p>
              </div>
              <button
                type="button"
                className={`${googleButtonClass} ${!providerReady.google || authLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
                onClick={signInWithGoogle}
                disabled={!providerReady.google || authLoading}
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
                Continuar como Google
              </button>

              <div className="flex items-center opacity-80">
                <div className="flex-1 h-px bg-slate-300" aria-hidden />
                <span className="px-4 text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-200">
                  o
                </span>
                <div className="flex-1 h-px bg-slate-300" aria-hidden />
              </div>

              {step === "email" && (
                <div className="space-y-3">
                  <input
                    placeholder="Correo electrónico"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                  />
                  <button
                    className={`${primaryButtonClass} ${(!isValidEmail || emailFlowLoading) ? disabledButtonClass : "cursor-pointer"}`}
                    disabled={!isValidEmail || emailFlowLoading}
                    onClick={() => {
                      void handleRequestCode();
                    }}
                  >
                    {emailFlowLoading ? "Enviando..." : "Continuar"}
                  </button>
                </div>
              )}

              {step === "code" && (
                <div className="space-y-3">
                  <input
                    placeholder="Ingresa el código de 6 dígitos"
                    className={inputClass}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                  />
                  <button
                    className={`${primaryButtonClass} ${(!isValidCode || emailFlowLoading) ? disabledButtonClass : ""}`}
                    disabled={!isValidCode || emailFlowLoading}
                    onClick={() => {
                      void handleVerifyCode();
                    }}
                  >
                    {emailFlowLoading ? "Verificando..." : "Verificar código"}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setEmailFlowError(null);
                      setEmailFlowMessage(null);
                    }}
                  >
                    Cambiar correo
                  </button>
                </div>
              )}

              {step === "register" && (
                <div className="space-y-3">
                  <input
                    placeholder="Nombre completo"
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    placeholder="Crea una contraseña (mínimo 8)"
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className={`${primaryButtonClass} ${(!isValidRegisterForm || emailFlowLoading) ? disabledButtonClass : ""}`}
                    disabled={!isValidRegisterForm || emailFlowLoading}
                    onClick={() => {
                      void handleRegister();
                    }}
                  >
                    {emailFlowLoading ? "Creando cuenta..." : "Crear cuenta"}
                  </button>
                </div>
              )}

              {authError && (
                <div className="text-xs text-rose-500 text-center">{authError}</div>
              )}
              {emailFlowError && (
                <div className="text-xs text-rose-500 text-center">{emailFlowError}</div>
              )}
              {emailFlowMessage && (
                <div className="text-xs text-slate-500 text-center">{emailFlowMessage}</div>
              )}

              <div className="text-[11px] text-center uppercase tracking-[0.35em] text-slate-200">
                Al continuar, aceptas nuestros términos y política de privacidad
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
