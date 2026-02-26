"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../types/user";

type GoogleUserInfo = {
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  sub?: string;
};

type MicrosoftMe = {
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
};

type SocialProvider = "google" | "apple" | "microsoft";

type SocialAuthPayload = {
  provider: SocialProvider;
  user: {
    name: string;
    email: string;
    subscription: User["subscription"];
  };
  metadata?: Record<string, unknown>;
};

type UseSocialAuthResult = {
  providerReady: Record<SocialProvider, boolean>;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => void;
  signInWithApple: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
};

type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (tokenResponse: GoogleTokenResponse) => void;
};

type GoogleTokenClient = {
  requestAccessToken: (params?: { prompt?: string }) => void;
};

type GoogleOauth2Api = {
  initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
};

type AppleInitConfig = {
  clientId: string;
  scope: string;
  redirectURI: string;
  usePopup: boolean;
};

type AppleSignInAuth = {
  id_token?: string;
};

type AppleSignInResult = {
  authorization?: AppleSignInAuth;
};

type AppleApi = {
  auth: {
    init: (config: AppleInitConfig) => void;
    signIn: () => Promise<AppleSignInResult>;
  };
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOauth2Api;
      };
    };
    AppleID?: AppleApi;
  }
}

function logAuthEvent(
  provider: SocialProvider,
  event: string,
  payload?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  if (payload) {
    console.info(`[auth][${provider}][${event}] ${timestamp}`, payload);
    return;
  }
  console.info(`[auth][${provider}][${event}] ${timestamp}`);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function randomString(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i += 1) out += chars[bytes[i] % chars.length];
  return out;
}

async function runPopupOAuth(url: string): Promise<Record<string, string>> {
  const popup = window.open(url, "oauth_popup", "width=520,height=700");
  if (!popup) {
    throw new Error("El navegador bloqueo la ventana de autenticacion");
  }

  return await new Promise<Record<string, string>>((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer);
        reject(new Error("Autenticacion cancelada"));
        return;
      }

      try {
        const href = popup.location.href;
        if (!href || !href.startsWith(window.location.origin)) return;

        const hash = popup.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);
        const result: Record<string, string> = {};
        params.forEach((value, key) => {
          result[key] = value;
        });
        window.clearInterval(timer);
        popup.close();
        resolve(result);
      } catch {
        // Cross-origin while provider page is open.
      }

      if (Date.now() - started > 120000) {
        window.clearInterval(timer);
        popup.close();
        reject(new Error("Tiempo de autenticacion agotado"));
      }
    }, 250);
  });
}

export function useSocialAuth(onSuccess: (user: User) => void): UseSocialAuthResult {
  const [providerReady, setProviderReady] = useState<Record<SocialProvider, boolean>>({
    google: false,
    apple: false,
    microsoft: true,
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.oauth2) {
      setProviderReady((prev) => ({ ...prev, google: true }));
    } else {
      const googleScript = document.createElement("script");
      googleScript.src = "https://accounts.google.com/gsi/client";
      googleScript.async = true;
      googleScript.defer = true;
      googleScript.onload = () => setProviderReady((prev) => ({ ...prev, google: true }));
      googleScript.onerror = () => setAuthError("No se pudo cargar Google Sign-In");
      document.head.appendChild(googleScript);
    }

    if (window.AppleID?.auth) {
      setProviderReady((prev) => ({ ...prev, apple: true }));
    } else {
      const appleScript = document.createElement("script");
      appleScript.src =
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      appleScript.async = true;
      appleScript.defer = true;
      appleScript.onload = () => setProviderReady((prev) => ({ ...prev, apple: true }));
      appleScript.onerror = () => setAuthError("No se pudo cargar Sign in with Apple");
      document.head.appendChild(appleScript);
    }
  }, []);

  const sendAuthToBackend = useCallback(
    async (payload: SocialAuthPayload) => {
      if (!apiBase) {
        throw new Error("Falta NEXT_PUBLIC_API_BASE_URL");
      }

      const response = await fetch(`${apiBase}/auth/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo registrar autenticacion en backend");
      }
    },
    [apiBase]
  );

  const signInWithGoogle = useCallback(() => {
    logAuthEvent("google", "start");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      logAuthEvent("google", "config_error", { missingEnv: "NEXT_PUBLIC_GOOGLE_CLIENT_ID" });
      setAuthError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }
    if (!apiBase) {
      logAuthEvent("google", "config_error", { missingEnv: "NEXT_PUBLIC_API_BASE_URL" });
      setAuthError("Falta configurar NEXT_PUBLIC_API_BASE_URL");
      return;
    }

    const google = window.google;
    if (!google?.accounts?.oauth2) {
      logAuthEvent("google", "sdk_not_ready");
      setAuthError("Google Sign-In no esta disponible todavia");
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (tokenResponse: GoogleTokenResponse) => {
        logAuthEvent("google", "token_response", {
          hasAccessToken: Boolean(tokenResponse?.access_token),
          error: tokenResponse?.error ?? null,
        });

        if (tokenResponse?.error || !tokenResponse?.access_token) {
          setAuthLoading(false);
          setAuthError("No fue posible iniciar sesion con Google");
          return;
        }

        try {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          if (!userRes.ok) throw new Error("No se pudo obtener perfil de Google");
          const profile = (await userRes.json()) as GoogleUserInfo;
          if (!profile?.email || profile.email_verified === false) {
            throw new Error("Google no devolvio un correo verificado");
          }
          if (!profile?.sub) {
            throw new Error("Google no devolvio el identificador del usuario");
          }

          logAuthEvent("google", "profile", {
            email: profile.email,
            emailVerified: profile.email_verified ?? null,
            name: profile.given_name ?? profile.name ?? null,
          });

          const backendRes = await fetch(`${apiBase}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              correo: profile.email,
              nombre: profile.given_name ?? profile.name ?? "Usuario Google",
              google_id: profile.sub,
            }),
          });
          const backendData = await backendRes.json().catch(() => ({}));
          if (!backendRes.ok) {
            throw new Error(backendData?.error ?? "No se pudo procesar el login en backend");
          }

          const authenticatedUser: User = {
            name:
              typeof backendData?.name === "string" && backendData.name.trim()
                ? backendData.name
                : profile.given_name ?? profile.name ?? "Usuario Google",
            email:
              typeof backendData?.email === "string" && backendData.email.trim()
                ? backendData.email
                : profile.email,
            subscription: "Free",
          };

          onSuccess(authenticatedUser);
          logAuthEvent("google", "success", { email: profile.email });
        } catch (error) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : "Fallo la autenticacion con Google";
          logAuthEvent("google", "error", {
            message,
          });
          setAuthError(message);
        } finally {
          setAuthLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  }, [apiBase, onSuccess]);

  const microsoftRedirectUri = useMemo(() => {
    if (process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI) {
      return process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI;
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  }, []);

  const signInWithMicrosoft = useCallback(async () => {
    logAuthEvent("microsoft", "start");
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID ?? "common";
    if (!clientId) {
      logAuthEvent("microsoft", "config_error", { missingEnv: "NEXT_PUBLIC_MICROSOFT_CLIENT_ID" });
      setAuthError("Falta configurar NEXT_PUBLIC_MICROSOFT_CLIENT_ID");
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    try {
      const state = randomString(20);
      sessionStorage.setItem("ms_oauth_state", state);

      const authUrl = new URL(
        `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
      );
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("response_type", "token");
      authUrl.searchParams.set("redirect_uri", microsoftRedirectUri);
      authUrl.searchParams.set("response_mode", "fragment");
      authUrl.searchParams.set("scope", "openid profile email User.Read");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("prompt", "select_account");

      const params = await runPopupOAuth(authUrl.toString());
      if (!params.access_token) throw new Error("Microsoft no devolvio token");
      if (params.state !== sessionStorage.getItem("ms_oauth_state")) {
        throw new Error("State invalido en Microsoft OAuth");
      }

      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${params.access_token}` },
      });
      if (!meRes.ok) throw new Error("No se pudo obtener perfil de Microsoft");
      const me = (await meRes.json()) as MicrosoftMe;
      const email = me.mail ?? me.userPrincipalName;
      if (!email) throw new Error("Microsoft no devolvio correo");

      const authenticatedUser: User = {
        name: me.displayName ?? "Usuario Microsoft",
        email,
        subscription: "Free",
      };

      await sendAuthToBackend({
        provider: "microsoft",
        user: authenticatedUser,
      });

      onSuccess(authenticatedUser);
      logAuthEvent("microsoft", "success", { email });
    } catch (error) {
      logAuthEvent("microsoft", "error", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
      setAuthError("Fallo la autenticacion con Microsoft");
    } finally {
      setAuthLoading(false);
    }
  }, [microsoftRedirectUri, onSuccess, sendAuthToBackend]);

  const signInWithApple = useCallback(async () => {
    logAuthEvent("apple", "start");
    const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? window.location.origin;
    if (!clientId) {
      logAuthEvent("apple", "config_error", { missingEnv: "NEXT_PUBLIC_APPLE_CLIENT_ID" });
      setAuthError("Falta configurar NEXT_PUBLIC_APPLE_CLIENT_ID");
      return;
    }
    if (!window.AppleID?.auth) {
      logAuthEvent("apple", "sdk_not_ready");
      setAuthError("Apple Sign-In no esta disponible todavia");
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    try {
      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI: redirectUri,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization?.id_token;
      if (!idToken) throw new Error("Apple no devolvio id_token");

      const payload = parseJwtPayload(idToken);
      const email = typeof payload?.email === "string" ? payload.email : "";
      const name = typeof payload?.name === "string" ? payload.name : "Usuario Apple";
      if (!email) throw new Error("Apple no devolvio correo");

      const authenticatedUser: User = {
        name,
        email,
        subscription: "Free",
      };

      await sendAuthToBackend({
        provider: "apple",
        user: authenticatedUser,
      });

      onSuccess(authenticatedUser);
      logAuthEvent("apple", "success", { email });
    } catch (error) {
      logAuthEvent("apple", "error", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
      setAuthError("Fallo la autenticacion con Apple");
    } finally {
      setAuthLoading(false);
    }
  }, [onSuccess, sendAuthToBackend]);

  return {
    providerReady,
    authLoading,
    authError,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
  };
}
