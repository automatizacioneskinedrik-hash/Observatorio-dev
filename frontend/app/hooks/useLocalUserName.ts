"use client";

import { useMemo } from "react";

type LocalUserRecord = {
  name?: string | null;
};

const extractName = (raw: string): string | null => {
  try {
    const parsed = JSON.parse(raw) as LocalUserRecord;
    const candidate = typeof parsed?.name === "string" ? parsed.name.trim() : "";
    return candidate || null;
  } catch {
    return null;
  }
};

export function useLocalUserName() {
  const userName = useMemo(() => {
    if (typeof window === "undefined") return null;
    const rawLocalUser = window.localStorage.getItem("kv_local_user");
    return rawLocalUser ? extractName(rawLocalUser) : null;
  }, []);

  return { userName, loading: false } as const;
}
