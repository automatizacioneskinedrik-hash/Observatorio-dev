"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "../types/user";

type GoogleUserInfo = {
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};

type UseGoogleAuthResult = {
  googleReady: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => void;
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

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOauth2Api;
      };
    };
  }
}

export function useGoogleAuth(onSuccess: (user: User) => void): UseGoogleAuthResult {
  const [googleReady, setGoogleReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.oauth2) {
      setGoogleReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => setAuthError("No se pudo cargar Google Sign-In");
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const signInWithGoogle = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setAuthError("Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID");
      return;
    }

    const google = window.google;
    if (!google?.accounts?.oauth2) {
      setAuthError("Google Sign-In no está disponible todavía");
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (tokenResponse: GoogleTokenResponse) => {
        if (tokenResponse?.error || !tokenResponse?.access_token) {
          setAuthLoading(false);
          setAuthError("No fue posible iniciar sesión con Google");
          return;
        }

        try {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });

          if (!userRes.ok) {
            throw new Error("No se pudo obtener perfil de Google");
          }

          const profile = (await userRes.json()) as GoogleUserInfo;
          if (!profile?.email || profile.email_verified === false) {
            throw new Error("Google no devolvió un correo verificado");
          }

          onSuccess({
            name: profile.given_name ?? profile.name ?? "Usuario Google",
            email: profile.email,
            subscription: "Free",
          });
        } catch {
          setAuthError("Falló la autenticación con Google");
        } finally {
          setAuthLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  }, [onSuccess]);

  return { googleReady, authLoading, authError, signInWithGoogle };
}
