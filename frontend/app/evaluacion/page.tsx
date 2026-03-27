"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLocalUserName } from "../hooks/useLocalUserName";

const waveformHeights = [16, 22, 18, 28, 20, 26, 12, 18, 24, 16, 22];
const waveformContainerHeight = 72;

const getInitials = (value?: string | null) => {
  if (!value) return "??";
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const progressVariants = {
  empty: { scaleX: 0.2 },
  current: { scaleX: 0.6 },
  filled: { scaleX: 1 },
};

const placeholderQuestions = [
  "Describe cómo lideraste un equipo frente a una crisis repentina.",
  "Explícanos una decisión estratégica que tomó tu equipo y en qué te basaste.",
  "¿Cómo te aseguras de que tu equipo mantenga la visión durante la incertidumbre?",
];

const recordingMaxSeconds = 120;
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

type Particle = {
  index: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  bottom: number;
};

const createParticles = (): Particle[] => {
  const count = 26;
  return Array.from({ length: count }, (_, index) => {
    const size = 6 + Math.random() * 8;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = 6 + Math.random() * 6;
    const bottom = -20 - Math.random() * 20;
    return { index, size, left, delay, duration, bottom };
  });
};

const AudioBars = ({ heights }: { heights: number[] }) => (
  <div className="flex items-end justify-center gap-2">
    {heights.map((height, index) => (
      <span
        key={index}
        className="inline-block w-1.5 rounded-full bg-gradient-to-b from-emerald-600 to-emerald-300"
        style={{
          height: `${height + 10}px`,
          transition: "height 0.18s ease",
        }}
      />
    ))}
  </div>
);

export default function EvaluacionPage() {
  const { userName } = useLocalUserName();
  const [mounted, setMounted] = useState(false);

  const [particleLayer, setParticleLayer] = useState<Particle[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMounted(true);
    setParticleLayer(createParticles());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const initials = useMemo(() => (mounted ? getInitials(userName) : "??"), [userName, mounted]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const totalQuestions = placeholderQuestions.length;
  const [allAnswered, setAllAnswered] = useState(false);
  const [justAnswered, setJustAnswered] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastRecordingUrlRef = useRef<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preppingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(() => [...waveformHeights]);
  const questionCounter = `Pregunta ${currentQuestionIndex + 1} de ${totalQuestions}`;
  const avatarLabel = mounted ? `Avatar de ${userName ?? "usuario"}` : "Avatar de usuario";
  const recordingElapsedText = formatTime(elapsedSeconds);
  const recordingRemainingText = formatTime(Math.max(recordingMaxSeconds - elapsedSeconds, 0));
  const recordingMaxText = formatTime(recordingMaxSeconds);
  const [preppingCountdown, setPreppingCountdown] = useState<number | null>(null);
  const recordingButtonLabel = allAnswered
    ? "Entrevista completada"
    : isRecording
      ? "Detener grabación"
      : preppingCountdown !== null
        ? `Preparando respuesta (${preppingCountdown}s)`
        : "Responder con audio";
  const answeredCount = allAnswered ? totalQuestions : currentQuestionIndex;
  const progressSegments = Array.from({ length: totalQuestions }, (_, index) => ({
    index,
    filled: index < answeredCount,
    current: !allAnswered && index === currentQuestionIndex,
  }));
  const markQuestionAnswered = useCallback(() => {
    setJustAnswered(true);
    if (currentQuestionIndex === totalQuestions - 1) {
      setAllAnswered(true);
      return;
    }
    setCurrentQuestionIndex((prev) => prev + 1);
  }, [currentQuestionIndex, totalQuestions]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedSeconds(0);
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
    mediaRecorderRef.current = null;
    resetTimer();
    setWaveHeights([...waveformHeights]);
  }, [resetTimer]);

  const startTimer = useCallback(() => {
    resetTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= recordingMaxSeconds) {
          stopRecording();
          return recordingMaxSeconds;
        }
        return next;
      });
    }, 1000);
  }, [resetTimer, stopRecording]);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (typeof MediaRecorder === "undefined") {
      setRecordingError("Tu navegador no permite grabar audio en este momento.");
      return;
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      setRecordingError("Tu navegador no permite grabaciones de audio.");
      return;
    }

    try {
      if (lastRecordingUrlRef.current) {
        URL.revokeObjectURL(lastRecordingUrlRef.current);
        lastRecordingUrlRef.current = null;
      }
      setRecordedAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        if (!audioChunksRef.current.length) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const savedUrl = URL.createObjectURL(blob);
        lastRecordingUrlRef.current = savedUrl;
        setRecordedAudioUrl(savedUrl);
        markQuestionAnswered();
        stream.getTracks().forEach((track) => track.stop());
      });

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingError(null);
      startTimer();
    } catch (error) {
      console.error(error);
      setRecordingError("No se pudo acceder al micrófono. Revisa los permisos.");
    }
  }, [markQuestionAnswered, startTimer]);

  const startPreparing = useCallback(() => {
    if (preppingTimerRef.current) {
      clearInterval(preppingTimerRef.current);
      preppingTimerRef.current = null;
    }
    setPreppingCountdown(3);
    preppingTimerRef.current = setInterval(() => {
      setPreppingCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (preppingTimerRef.current) {
            clearInterval(preppingTimerRef.current);
            preppingTimerRef.current = null;
          }
          void startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRecording]);

  const handleRecordingToggle = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    if (preppingCountdown !== null) {
      if (preppingTimerRef.current) {
        clearInterval(preppingTimerRef.current);
        preppingTimerRef.current = null;
      }
      setPreppingCountdown(null);
      return;
    }
    if (allAnswered) return;
    startPreparing();
  }, [allAnswered, isRecording, preppingCountdown, startPreparing, stopRecording]);

  const handleRecordingButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void handleRecordingToggle();
    }
  };

  useEffect(() => {
    if (!justAnswered) return;
    const timer = setTimeout(() => {
      setJustAnswered(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [justAnswered]);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map((_, index) => {
          const base = waveformHeights[index] ?? waveformHeights[0];
          const variation = Math.floor(Math.random() * 16) - 8;
          return Math.max(10, base + variation);
        })
      );
    }, 180);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (lastRecordingUrlRef.current) {
        URL.revokeObjectURL(lastRecordingUrlRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (preppingTimerRef.current) {
        clearInterval(preppingTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-white via-emerald-50/60 to-emerald-100 relative overflow-hidden ${isRecording ? "recording-shimmer" : ""}`}
    >
      <div className="shimmer-bg pointer-events-none" />
      <header className="flex w-full items-center justify-between gap-6 border-b border-slate-100 bg-white px-5 py-3 shadow-sm shadow-slate-900/5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg">
            <span className="text-[11px] font-semibold tracking-[0.3em]"></span>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">AECO IA</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 md:gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-semibold uppercase tracking-[0.45em] text-slate-400">Progreso de la entrevista</span>
            <div className="flex items-center gap-3">
              <div
                className="rounded-full bg-emerald-900/5 px-3 py-1 text-xs font-semibold text-emerald-900"
                aria-label={questionCounter}
                title={questionCounter}
              >
                {questionCounter}
              </div>
              <div className="flex gap-1">
                {progressSegments.map((segment) => (
                  <div
                    key={segment.index}
                    className="h-1.5 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 progress-chip"
                  >
                    <motion.span
                      className={`block h-full ${segment.filled ? "bg-emerald-500" : segment.current ? "bg-emerald-400" : "bg-slate-200"
                        } progress-glow`}
                      style={{ transformOrigin: "left" }}
                      variants={progressVariants}
                      initial="empty"
                      animate={segment.filled ? "filled" : segment.current ? "current" : "empty"}
                      transition={{ type: "spring", stiffness: 230, damping: 22 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {justAnswered && (
            <div
              className="rounded-full border border-emerald-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-700 response-badge"
              aria-label="Respuesta guardada"
              title="Respuesta guardada"
            >
              Respuesta guardada
            </div>
          )}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-tr from-emerald-700 to-emerald-500 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-inner"
            aria-label={avatarLabel}
            title={avatarLabel}
          >
            {initials}
          </div>
        </div>
      </header>

      <div className="mt-2 flex w-full max-w-[1140px] px-3">
        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          <div className="p-2 rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors group-hover:border-slate-300 group-hover:text-slate-900">
            <ArrowLeft size={16} />
          </div>
          <span>Volver al Chat</span>
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-4 px-3 py-4">
        <main className="space-y-3">
          <motion.section
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 0.15, duration: 0.65 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-emerald-700">Entrevista de Liderazgo</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">
              Entrevista de Liderazgo: Visión Estratégica
            </h1>
            <p className="mt-1 max-w-3xl mx-auto text-sm text-slate-600">
              Esta sesión está siendo grabada para el comité de selección. Asegúrate de estar en un ambiente tranquilo.
            </p>
          </motion.section>

          <section className="flex justify-center">
            <div className="w-full max-w-[860px] rounded-[34px] bg-gradient-to-br from-slate-900 to-slate-800 p-1 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.85)]">
              <div className="relative h-[230px] overflow-hidden rounded-[30px] border border-slate-900/60 bg-slate-950">
                <Image
                  src="https://via.placeholder.com/800x400"
                  alt="Entrevistador"
                  fill
                  className="object-cover opacity-60"
                  unoptimized
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  INTERVENTOR AI EN LÍNEA
                </div>
                <p className="absolute inset-x-0 bottom-5 mx-auto max-w-2xl px-6 text-center text-lg font-medium italic leading-relaxed text-white drop-shadow-xl">
                  “¿Cómo describiría su enfoque para liderar equipos en entornos de alta incertidumbre?”
                </p>
              </div>
            </div>
          </section>

          <motion.div
            className="mx-auto flex w-full max-w-[820px] relative"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            transition={{ delay: 0.35, duration: 0.7 }}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-b from-transparent via-emerald-100/40 to-emerald-300/30 blur-[30px] opacity-70" />
            <div className="pointer-events-none absolute inset-3 overflow-hidden">
              {particleLayer.map((particle) => (
                <span
                  key={particle.index}
                  className="absolute rounded-full"
                  style={{
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    background: "rgba(34,197,94,0.35)",
                    filter: "blur(3px) saturate(130%)",
                    mixBlendMode: "screen",
                    left: `${particle.left}%`,
                    bottom: `${particle.bottom}px`,
                    animation: `floatParticles ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
                    boxShadow: "0 0 12px rgba(34,197,94,0.4)",
                  }}
                />
              ))}
            </div>
            <section
              className="relative flex w-full flex-col gap-3 rounded-[32px] border border-lime-200/50 bg-white/90 px-4 py-6 backdrop-blur-sm"
              style={{
                boxShadow: "0 25px 40px rgba(16, 185, 129, 0.2), 0 0 50px rgba(16, 185, 129, 0.35)",
              }}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-400">
                <span>Entrada de audio</span>
                <span>00:00 / 02:00 máx.</span>
              </div>
              <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-3">
                <div className="w-full max-w-[280px]" style={{ height: `${waveformContainerHeight}px` }}>
                  <AudioBars heights={waveHeights} />
                </div>
              </div>
              <div className="flex w-full flex-col items-center gap-3 pt-2">
                <button
                  type="button"
                  aria-label={recordingButtonLabel}
                  onClick={handleRecordingToggle}
                  onKeyDown={handleRecordingButtonKeyDown}
                  disabled={allAnswered && !isRecording}
                  className={`relative flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isRecording
                      ? "recording-active shadow-[0_0_50px_rgba(52,211,153,0.8)]"
                      : "bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900 shadow-[0_0_40px_rgba(16,185,129,0.6)]"
                    }`}
                >
                  <span className="absolute inset-0 rounded-2xl recording-ring" aria-hidden />
                  <span className={`h-2 w-2 rounded-full ${isRecording ? "bg-rose-400 animate-pulse" : "bg-emerald-400"}`} />
                  {recordingButtonLabel}
                </button>
                {isRecording && (
                  <p role="status" aria-live="polite" className="text-[11px] text-slate-500">
                    Grabando desde {recordingElapsedText} · Restan {recordingRemainingText} (máx. {recordingMaxText})
                  </p>
                )}
                {recordingError && (
                  <p role="alert" aria-live="assertive" className="text-center text-[11px] text-rose-500">
                    {recordingError}
                  </p>
                )}
              </div>
              {recordedAudioUrl && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-2 flex flex-col items-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                    Última grabación guardada
                  </span>
                  <audio
                    src={recordedAudioUrl}
                    controls
                    aria-label="Reproductor de la respuesta guardada"
                    className="w-full max-w-[320px]"
                  />
                </div>
              )}
              {justAnswered && (
                <div role="status" aria-live="polite" className="mt-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  ✓ Respuesta guardada para esta pregunta
                </div>
              )}
            </section>
          </motion.div>
        </main>
      </div>
      <style jsx global>{`
        @keyframes floatParticles {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          25% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-180px) scale(1.1);
            opacity: 0;
          }
        }
        .progress-chip {
          transition: transform 220ms ease, opacity 220ms ease;
          will-change: transform, opacity;
        }
        .progress-glow {
          transition: box-shadow 220ms ease, transform 220ms ease;
          will-change: transform, opacity;
        }
        .response-badge {
          position: relative;
          overflow: hidden;
        }
        .response-badge::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
          opacity: 0;
          transform: scale(0.4);
          transition: opacity 260ms ease, transform 260ms ease;
        }
        .response-badge:hover::after {
          opacity: 1;
          transform: scale(1);
        }
        .recording-active {
          background: linear-gradient(90deg, #34d399 0%, #10b981 50%, #059669 100%);
        }
        .recording-ring {
          opacity: 0;
          position: absolute;
          inset: 0;
          border-radius: 999px;
          border: 2px solid rgba(16, 185, 129, 0.45);
          animation: ringPulse 1.8s ease-out infinite;
          pointer-events: none;
        }
        .recording-active .recording-ring {
          opacity: 1;
        }
        @keyframes ringPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          70% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
        .shimmer-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(255, 255, 255, 0) 15%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 85%);
          background-size: 200% 200%;
          transform: translateZ(0);
          animation: shimmer 15s linear infinite;
          opacity: 0.7;
        }
        @keyframes shimmer {
          0% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 0%;
          }
          100% {
            background-position: 0% 0%;
          }
        }
        .recording-shimmer {
          animation: pulse 7s ease-in-out infinite;
        }
        @keyframes pulse {
          0% {
            box-shadow: inset 0 0 0 rgba(16, 185, 129, 0);
          }
          50% {
            box-shadow: inset 0 0 120px rgba(16, 185, 129, 0.12);
          }
          100% {
            box-shadow: inset 0 0 0 rgba(16, 185, 129, 0);
          }
        }
      `}</style>
    </div>
  );
}
