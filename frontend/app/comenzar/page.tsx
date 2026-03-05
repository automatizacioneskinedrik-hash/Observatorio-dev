"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const preguntas = [
  {
    id: 1,
    titulo: "Pregunta 1",
    cuestion:
      "Cuando tomas decisiones en tu trabajo, que tipo de decisiones suelen depender directamente de ti?",
    placeholder: "Escribe aqui tu respuesta con detalle...",
  },
  {
    id: 2,
    titulo: "Pregunta 2",
    cuestion:
      "Cual es tu relacion principal con la empresa o proyecto en el que trabajas actualmente?",
    placeholder: "Cuentanos tu relacion actual con el negocio...",
  },
  {
    id: 3,
    titulo: "Pregunta 3",
    cuestion: "En que inviertes la mayor parte de tu tiempo profesional durante la semana?",
    placeholder: "Describe en que se concentra la mayor parte de tu semana...",
  },
] as const;

export default function ComenzarPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>(["", "", ""]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const respuestaActual = respuestas[paso]?.trim() ?? "";
  const puedeContinuar = respuestaActual.length >= 15 && !enviando;

  const goHome = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.assign("/");
      return;
    }
    router.replace("/");
  }, [router]);

  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("kv_user_email") ?? "" : "";
    const profileComplete =
      typeof window !== "undefined" && localStorage.getItem("kv_profile_complete") === "true";
    const activeSession =
      typeof window !== "undefined" && sessionStorage.getItem("kv_auth_session") === "active";

    let hasLocalSession = false;
    if (typeof window !== "undefined") {
      const rawLocalUser = localStorage.getItem("kv_local_user");
      if (rawLocalUser) {
        try {
          const parsed = JSON.parse(rawLocalUser) as { email?: string };
          hasLocalSession = Boolean(parsed?.email) && parsed.email === email;
        } catch {
          localStorage.removeItem("kv_local_user");
        }
      }
    }

    const ok = email.trim().length > 0 && hasLocalSession && activeSession;
    setHasSession(ok && !profileComplete);
    setSessionChecked(true);
    if (!ok || profileComplete) {
      goHome();
    }
  }, [goHome]);

  const actualizarRespuesta = (value: string) => {
    setRespuestas((prev) => {
      const next = [...prev];
      next[paso] = value;
      return next;
    });
  };

  const persistAndContinue = (category: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kv_profile_complete", "true");
      localStorage.setItem("kv_profile_category", category);
      const saved = localStorage.getItem("kv_local_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          localStorage.setItem(
            "kv_local_user",
            JSON.stringify({
              ...parsed,
              isProfileComplete: true,
              profileCategory: category,
            })
          );
        } catch {
          localStorage.removeItem("kv_local_user");
        }
      }
    }
    goHome();
  };

  const enviarRespuestas = async () => {
    setError(null);
    setEnviando(true);

    try {
      const email =
        typeof window !== "undefined" ? localStorage.getItem("kv_user_email") ?? "" : "";
      if (!email) throw new Error("No encontramos tu sesion. Inicia sesion nuevamente.");

      const endpoint = apiBase
        ? `${apiBase}/api/configurar-onboarding`
        : "/api/configurar-onboarding";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, respuestas }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("No pudimos finalizar este paso. Intenta nuevamente.");
      persistAndContinue(String(data?.categoria ?? ""));
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message.includes("No encontramos tu sesion")) {
        setError("Tu sesion no esta activa. Vuelve a iniciar sesion.");
        goHome();
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "kv_onboarding_pending",
          JSON.stringify({
            respuestas,
            createdAt: Date.now(),
          })
        );
      }

      persistAndContinue("");
      return;
    } finally {
      setEnviando(false);
    }
  };

  const siguiente = () => {
    setError(null);
    if (paso < preguntas.length - 1) {
      setPaso((prev) => prev + 1);
      return;
    }
    void enviarRespuestas();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-3xl">
        {!sessionChecked || !hasSession ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl"
          >
            <p className="text-slate-700">Redirigiendo...</p>
          </motion.section>
        ) : (
        <AnimatePresence mode="wait">
          {enviando ? (
            <motion.section
              key="sending"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl"
            >
              <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              <p className="text-2xl font-semibold text-slate-800">Estamos preparando tu cuenta</p>
              <p className="mt-2 text-slate-500">Esto tomara solo unos segundos...</p>
            </motion.section>
          ) : (
            <motion.section
              key={`question-${paso}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
            >
              <header className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Paso {paso + 1} de {preguntas.length}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Antes de continuar</h1>
                <p className="mt-2 text-slate-600">
                  Responde brevemente estas preguntas para adaptar mejor tu experiencia.
                </p>
              </header>

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  {preguntas[paso].titulo}
                </p>
                <p className="mt-2 text-lg text-slate-800">{preguntas[paso].cuestion}</p>
                <textarea
                  className="mt-4 h-40 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none ring-emerald-500 transition focus:ring-2"
                  value={respuestas[paso]}
                  onChange={(e) => actualizarRespuesta(e.target.value)}
                  placeholder={preguntas[paso].placeholder}
                />
              </article>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaso((prev) => Math.max(0, prev - 1))}
                  disabled={paso === 0 || enviando}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={siguiente}
                  disabled={!puedeContinuar}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {paso === preguntas.length - 1 ? "Continuar al chat" : "Siguiente"}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        )}
      </div>
    </div>
  );
}
