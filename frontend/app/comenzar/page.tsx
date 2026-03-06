"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

const preguntas = [
  {
    id: 1,
    titulo: "Decision diaria",
    cuestion:
      "Cuando tomas decisiones en tu trabajo, que tipo de decisiones suelen depender directamente de ti?",
    placeholder: "Cuentanos ejemplos reales de decisiones que tomas en tu semana...",
  },
  {
    id: 2,
    titulo: "Rol actual",
    cuestion:
      "Cual es tu relacion principal con la empresa o proyecto en el que trabajas actualmente?",
    placeholder: "Describe tu relacion con el negocio, equipos y resultados...",
  },
  {
    id: 3,
    titulo: "Enfoque semanal",
    cuestion: "En que inviertes la mayor parte de tu tiempo profesional durante la semana?",
    placeholder: "Explica en que se va la mayor parte de tu tiempo profesional...",
  },
] as const;

const MIN_CHARS = 15;

export default function ComenzarPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<string[]>(["", "", ""]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [focusTextarea, setFocusTextarea] = useState(false);

  const respuestaActual = respuestas[paso] ?? "";
  const trimmedActual = respuestaActual.trim();
  const progress = ((paso + 1) / preguntas.length) * 100;
  const puedeContinuar = trimmedActual.length >= MIN_CHARS && !enviando;
  const faltantes = Math.max(0, MIN_CHARS - trimmedActual.length);

  const goHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const email =
        typeof window !== "undefined" ? localStorage.getItem("kv_user_email") ?? "" : "";
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

<<<<<<< HEAD
      const firebaseSessionOk = currentUser?.email === email;
=======
      
      const firebaseSessionOk = Boolean(currentUser?.email) && currentUser?.email === email;
>>>>>>> 9cf2f2a (fix: correccion de currentUser null en page.tsx)
      const ok = email.trim().length > 0 && hasLocalSession && activeSession && firebaseSessionOk;

      setHasSession(ok && !profileComplete);
      setSessionChecked(true);

      if (!ok || profileComplete) goHome();
    });

    return () => unsubscribe();
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

      const res = await fetch("/api/configurar-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, respuestas }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("No pudimos finalizar este paso. Intenta nuevamente.");
      persistAndContinue(String(data?.categoria ?? ""));
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        requestError.message.includes("No encontramos tu sesion")
      ) {
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

  const estadoTexto = useMemo(() => {
    if (faltantes === 0) return "Listo para continuar";
    return `Te faltan ${faltantes} caracteres`;
  }, [faltantes]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,#dff5ed_0%,#f4f7f9_42%,#edf2f7_100%)] px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-4xl">
        {!sessionChecked || !hasSession ? (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-emerald-100 bg-white/85 p-10 text-center shadow-xl backdrop-blur"
          >
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
            <p className="mt-4 text-slate-700">Comencemos</p>
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white/90 shadow-2xl backdrop-blur"
          >
            <div className="border-b border-slate-100 bg-white/70 px-6 pb-6 pt-5 md:px-8">
              <div className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
                <span>
                  Paso {paso + 1} de {preguntas.length}
                </span>
                <span>{Math.round(progress)}% Completado</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#10b981_55%,#34d399_100%)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
            </div>

            <div className="px-6 pb-7 pt-6 md:px-10 md:pb-10 md:pt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={paso}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.28 }}
                >
                  <h1 className="text-[36px] font-extrabold leading-[1.08] tracking-[-0.02em] text-slate-900">
                    {preguntas[paso].cuestion}
                  </h1>

                  <p className="mt-3 text-lg text-slate-600">
                    Responde con naturalidad. Entre mas contexto des, mejor sera la experiencia.
                  </p>

                  <div className="mt-7 rounded-3xl border border-slate-200/90 bg-[linear-gradient(160deg,#f8fafc_0%,#f1f5f9_100%)] p-4 md:p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-800">
                        {preguntas[paso].titulo}
                      </p>
                      <motion.p
                        animate={{ opacity: focusTextarea ? 1 : 0.72 }}
                        className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
                      >
                        {estadoTexto}
                      </motion.p>
                    </div>

                    <motion.textarea
                      key={`textarea-${paso}`}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 1 }}
                      className="h-52 w-full resize-none rounded-2xl border border-slate-300 bg-white px-5 py-4 text-[30px] leading-relaxed text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 md:text-[18px]"
                      value={respuestas[paso]}
                      onChange={(e) => actualizarRespuesta(e.target.value)}
                      onFocus={() => setFocusTextarea(true)}
                      onBlur={() => setFocusTextarea(false)}
                      placeholder={preguntas[paso].placeholder}
                    />

                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                      {error}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaso((prev) => Math.max(0, prev - 1))}
                  disabled={paso === 0 || enviando}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-base font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  Anterior
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={puedeContinuar ? { y: -2 } : {}}
                  whileTap={puedeContinuar ? { scale: 0.99 } : {}}
                  onClick={siguiente}
                  disabled={!puedeContinuar}
                  className="w-full flex-1 rounded-2xl bg-[linear-gradient(90deg,#0f766e_0%,#059669_60%,#10b981_100%)] py-3.5 text-base font-extrabold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {enviando
                    ? "Guardando..."
                    : paso === preguntas.length - 1
                      ? "Continuar al chat"
                      : "Siguiente"}
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
