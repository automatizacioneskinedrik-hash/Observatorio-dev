"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "../types/user";

type GoogleUserInfo = {
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};

type MicrosoftMe = {
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
};

type SocialProvider = "google" | "apple" | "microsoft";

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
    throw new Error("El navegador bloqueó la ventana de autenticación");
  }

  return await new Promise<Record<string, string>>((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (popup.closed) {
        window.clearInterval(timer);
        reject(new Error("Autenticación cancelada"));
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
        // Cross-origin while provider page is open: ignore and keep polling.
      }

      if (Date.now() - started > 120000) {
        window.clearInterval(timer);
        popup.close();
        reject(new Error("Tiempo de autenticación agotado"));
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
      googleScript.onerror = () =>
        setAuthError("No se pudo cargar Google Sign-In");
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
      appleScript.onerror = () =>
        setAuthError("No se pudo cargar Sign in with Apple");
      document.head.appendChild(appleScript);
    }
  }, []);

  const signInWithGoogle = useCallback(() => {
    logAuthEvent("google", "start");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      logAuthEvent("google", "config_error", { missingEnv: "NEXT_PUBLIC_GOOGLE_CLIENT_ID" });
      setAuthError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    const google = window.google;
    if (!google?.accounts?.oauth2) {
      logAuthEvent("google", "sdk_not_ready");
      setAuthError("Google Sign-In no está disponible todavía");
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
          setAuthError("No fue posible iniciar sesión con Google");
          return;
        }

        try {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          if (!userRes.ok) throw new Error("No se pudo obtener perfil de Google");
          const profile = (await userRes.json()) as GoogleUserInfo;
          if (!profile?.email || profile.email_verified === false) {
            throw new Error("Google no devolvió un correo verificado");
          }
          logAuthEvent("google", "profile", {
            email: profile.email,
            emailVerified: profile.email_verified ?? null,
            name: profile.given_name ?? profile.name ?? null,
          });
          onSuccess({
            name: profile.given_name ?? profile.name ?? "Usuario Google",
            email: profile.email,
            subscription: "Free",
          });
          logAuthEvent("google", "success", { email: profile.email });
        } catch (error) {
          logAuthEvent("google", "error", {
            message: error instanceof Error ? error.message : "unknown_error",
          });
          setAuthError("Falló la autenticación con Google");
        } finally {
          setAuthLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  }, [onSuccess]);

  const microsoftRedirectUri = useMemo(
    () => process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI ?? window.location.origin,
    []
  );

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
      logAuthEvent("microsoft", "authorize_url_ready", {
        tenant,
        redirectUri: microsoftRedirectUri,
      });

      const params = await runPopupOAuth(authUrl.toString());
      if (!params.access_token) throw new Error("Microsoft no devolvió token");
      if (params.state !== sessionStorage.getItem("ms_oauth_state")) {
        throw new Error("State inválido en Microsoft OAuth");
      }
      logAuthEvent("microsoft", "token_response", {
        hasAccessToken: Boolean(params.access_token),
        scope: params.scope ?? null,
      });

      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${params.access_token}` },
      });
      if (!meRes.ok) throw new Error("No se pudo obtener perfil de Microsoft");
      const me = (await meRes.json()) as MicrosoftMe;
      const email = me.mail ?? me.userPrincipalName;
      if (!email) throw new Error("Microsoft no devolvió correo");
      logAuthEvent("microsoft", "profile", {
        email,
        displayName: me.displayName ?? null,
      });

      onSuccess({
        name: me.displayName ?? "Usuario Microsoft",
        email,
        subscription: "Free",
      });
      logAuthEvent("microsoft", "success", { email });
    } catch (error) {
      logAuthEvent("microsoft", "error", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
      setAuthError("Falló la autenticación con Microsoft");
    } finally {
      setAuthLoading(false);
    }
  }, [microsoftRedirectUri, onSuccess]);

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
      setAuthError("Apple Sign-In no está disponible todavía");
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
      if (!idToken) throw new Error("Apple no devolvió id_token");
      logAuthEvent("apple", "token_response", { hasIdToken: Boolean(idToken) });

      const payload = parseJwtPayload(idToken);
      const email = typeof payload?.email === "string" ? payload.email : "";
      const name = typeof payload?.name === "string" ? payload.name : "Usuario Apple";
      if (!email) throw new Error("Apple no devolvió correo");
      logAuthEvent("apple", "profile", { email, name });

      onSuccess({
        name,
        email,
        subscription: "Free",
      });
      logAuthEvent("apple", "success", { email });
    } catch (error) {
      logAuthEvent("apple", "error", {
        message: error instanceof Error ? error.message : "unknown_error",
      });
      setAuthError("Falló la autenticación con Apple");
    } finally {
      setAuthLoading(false);
    }
  }, [onSuccess]);

  return {
    providerReady,
    authLoading,
    authError,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
  };
}
