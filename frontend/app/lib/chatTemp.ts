export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function defaultTitleFromFirstUserMessage(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 36 ? t.slice(0, 36) + "…" : (t || "Nueva conversación");
}
