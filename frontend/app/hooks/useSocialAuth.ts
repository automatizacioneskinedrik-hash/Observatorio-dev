"use client";

import { useState, useEffect, useCallback } from "react";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";
import type { User } from "../types/user";

export function useSocialAuth(onSuccess: (user: User) => void) {
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

  const persistProfileState = useCallback((nextUser: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("kv_user_email", nextUser.email || "");
    localStorage.setItem(
      "kv_profile_complete",
      nextUser.isProfileComplete === true ? "true" : "false"
    );
    localStorage.setItem("kv_profile_category", nextUser.profileCategory ?? "");
    localStorage.setItem("kv_local_user", JSON.stringify(nextUser));
    sessionStorage.setItem("kv_auth_session", "active");
  }, []);

  const readLocalProfileState = useCallback(
    (email: string): Pick<User, "isProfileComplete" | "profileCategory"> => {
      if (typeof window === "undefined") {
        return { isProfileComplete: false, profileCategory: null };
      }

      const localEmail = localStorage.getItem("kv_user_email") ?? "";
      if (localEmail && localEmail !== email) {
        return { isProfileComplete: false, profileCategory: null };
      }

      const localComplete = localStorage.getItem("kv_profile_complete") === "true";
      const localCategory = localStorage.getItem("kv_profile_category") || null;
      return {
        isProfileComplete: localComplete,
        profileCategory: localCategory,
      };
    },
    []
  );

  const resolveProfileFromBackend = useCallback(
    async (fbUser: FirebaseUser): Promise<Pick<User, "isProfileComplete" | "profileCategory">> => {
      if (!fbUser.email) {
        return { isProfileComplete: false, profileCategory: null };
      }
      if (!apiBase) {
        return readLocalProfileState(fbUser.email);
      }

      try {
        const response = await fetch(`${apiBase}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            google_id: fbUser.uid,
            correo: fbUser.email,
            nombre: fbUser.displayName || "Usuario",
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error ?? "No se pudo validar el perfil");
        }

        return {
          isProfileComplete: data?.isProfileComplete === true,
          profileCategory:
            typeof data?.tipo_caracterizacion === "string"
              ? data.tipo_caracterizacion
              : null,
        };
      } catch {
        return readLocalProfileState(fbUser.email);
      }
    },
    [apiBase, readLocalProfileState]
  );

  const notifyAuthenticated = useCallback(
    async (fbUser: FirebaseUser) => {
      const profile = await resolveProfileFromBackend(fbUser);
      const userData: User = {
        name: fbUser.displayName || "Usuario",
        email: fbUser.email || "",
        subscription: "Free",
        isProfileComplete: profile.isProfileComplete,
        profileCategory: profile.profileCategory,
      };

      persistProfileState(userData);
      onSuccess(userData);
      return userData;
    },
    [onSuccess, persistProfileState, resolveProfileFromBackend]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setAuthLoading(false);
        return;
      }

      void (async () => {
        try {
          await notifyAuthenticated(currentUser);
        } finally {
          setAuthLoading(false);
        }
      })();
    });

    return () => unsubscribe();
  }, [notifyAuthenticated]);

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const userRef = doc(db, "usuarios", fbUser.uid);
      await setDoc(
        userRef,
        {
          name: fbUser.displayName || "Usuario Google",
          email: fbUser.email || "",
          subscription: "Free",
          lastLogin: new Date().toISOString(),
          photoURL: fbUser.photoURL,
        },
        { merge: true }
      );

      await notifyAuthenticated(fbUser);
    } catch {
      setAuthError("No se pudo iniciar sesion con Google");
    } finally {
      setAuthLoading(false);
    }
  }, [notifyAuthenticated]);

  const logout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== "undefined") {
        localStorage.removeItem("kv_user_email");
        localStorage.removeItem("kv_profile_complete");
        localStorage.removeItem("kv_profile_category");
        localStorage.removeItem("kv_local_user");
        sessionStorage.removeItem("kv_auth_session");
      }
      window.location.reload();
    } catch {
      setAuthError("No se pudo cerrar sesion correctamente");
    }
  };

  return {
    authLoading,
    authError,
    signInWithGoogle,
    logout,
    user,
    signInWithApple: async () => console.warn("Apple no configurado en Firebase"),
    signInWithMicrosoft: async () => console.warn("Microsoft no configurado en Firebase"),
    providerReady: { google: true, apple: false, microsoft: false },
  };
}
