"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// --- Constantes fuera del componente ---
const waveformHeights = [16, 22, 18, 28, 20, 26, 12, 18, 24, 16, 22];
const speechThreshold = 0.006;
const silenceDelayMs = 2000;

const questionsData = [
  { id: 1, text: "Pregunta 1...", video: "/assets/avatar/pregunta_1.mp4" },
  { id: 2, text: "Pregunta 2...", video: "/assets/avatar/pregunta_2.mp4" },
  { id: 3, text: "Pregunta 3...", video: "/assets/avatar/pregunta_3.mp4" },
  { id: 4, text: "Pregunta 4...", video: "/assets/avatar/pregunta_4.mp4" },
  { id: 5, text: "Pregunta 5...", video: "/assets/avatar/pregunta_5.mp4" },
  { id: 6, text: "Pregunta 6...", video: "/assets/avatar/pregunta_6.mp4" },
  { id: 7, text: "Pregunta 7...", video: "/assets/avatar/pregunta_7.mp4" },
  { id: 8, text: "Cierre...", video: "/assets/avatar/Cierre8.mp4" },
];

const AudioBars = ({ heights }: { heights: number[] }) => (
  <div className="flex items-end justify-center gap-2">
    {heights.map((height, index) => (
      <span
        key={index}
        className="inline-block w-1.5 rounded-full bg-gradient-to-b from-emerald-600 to-emerald-300"
        style={{ height: `${height + 10}px`, transition: "height 0.18s ease" }}
      />
    ))}
  </div>
);

export default function EvaluacionPage() {
  const router = useRouter();

  // --- Estados de la Entrevista y Avatar ---
  const [currentStep, setCurrentStep] = useState(0);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);

  // --- Refs para Audio y Detección de Silencio ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasDetectedSpeechRef = useRef(false);

  // --- Estados de Grabación Originales ---
  const [isRecording, setIsRecording] = useState(false);
  const [, setRecordingError] = useState<string | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(() => [...waveformHeights]);
  const [hasDetectedSpeech, setHasDetectedSpeech] = useState(false);
  const [answerReady, setAnswerReady] = useState(false);
  const isLastStep = currentStep === questionsData.length - 1;

  // --- Funciones de Control de Flujo ---
  
  const cleanupMicrophone = useCallback((resetAnswer = true) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    hasDetectedSpeechRef.current = false;
    if (resetAnswer) {
      setHasDetectedSpeech(false);
      setAnswerReady(false);
    }
  }, []);

  const stopMicrophone = useCallback((resetAnswer = true) => {
    cleanupMicrophone(resetAnswer);
    setIsRecording(false);
  }, [cleanupMicrophone]);

  const handleNextStep = useCallback(() => {
    const video = avatarVideoRef.current;

    stopMicrophone();

    if (video) {
      video.pause();
      video.currentTime = 0;
    }

    if (currentStep < questionsData.length - 1) {
      setCurrentStep(prev => prev + 1);
      setIsAvatarTalking(true);
      setAnswerReady(false);
      setHasDetectedSpeech(false);
    } else {
      router.replace("/");
    }
  }, [currentStep, router, stopMicrophone]);

  const startSilenceDetection = useCallback(async () => {
    if (streamRef.current || isRecording || isAvatarTalking || answerReady) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true); // Para activar la UI de "grabando"
      hasDetectedSpeechRef.current = false;
      setHasDetectedSpeech(false);
      
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        throw new Error("AudioContext no esta disponible en este navegador.");
      }

      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const volume = Math.sqrt(sum / bufferLength);

        const baseHeight = Math.max(12, Math.min(64, volume * 900));

        // Actualizar barras visuales con el micro real
        setWaveHeights(prev =>
          prev.map((_, index) => {
            const spread = 0.55 + ((index % 5) * 0.15);
            const pulse = hasDetectedSpeechRef.current ? Math.sin(Date.now() / 90 + index) * 6 : 0;
            return Math.max(10, baseHeight * spread + pulse);
          })
        );

        if (volume >= speechThreshold) {
          hasDetectedSpeechRef.current = true;
          setHasDetectedSpeech(true);
        }

        if (hasDetectedSpeechRef.current && volume < speechThreshold) { // Umbral de silencio
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              stopMicrophone(false);
              setAnswerReady(true);
              silenceTimerRef.current = null;
            }, silenceDelayMs);
          }
        } else {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }

        if (streamRef.current) {
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();
    } catch {
      setRecordingError("No se pudo acceder al microfono.");
    }
  }, [answerReady, isAvatarTalking, isRecording, stopMicrophone]);

  const handleResponseToggle = useCallback(() => {
    if (isAvatarTalking) return;

    if (isRecording) {
      stopMicrophone(false);
      setAnswerReady(true);
      return;
    }

    if (answerReady) {
      setAnswerReady(false);
      setHasDetectedSpeech(false);
    }

    void startSilenceDetection();
  }, [answerReady, isAvatarTalking, isRecording, startSilenceDetection, stopMicrophone]);

  // --- Efectos ---
  useEffect(() => {
    // Primera pregunta
    const initTimer = setTimeout(() => {
      setIsAvatarTalking(true);
    }, 1500);
    return () => {
      clearTimeout(initTimer);
      cleanupMicrophone();
    };
  }, [cleanupMicrophone]);

  useEffect(() => {
    const video = avatarVideoRef.current;
    if (!video) return;

    if (isAvatarTalking) {
      video.pause();
      video.currentTime = 0;
      video.load();
      video.play().catch(() => {
        setIsAvatarTalking(false);
      });
    } else {
      video.pause();
    }
  }, [currentStep, isAvatarTalking]);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white via-emerald-50/60 to-emerald-100 relative overflow-hidden ${isRecording ? "recording-shimmer" : ""}`}>
      {/* Header y resto de UI... (Mantener igual) */}
      
      <main className="mx-auto max-w-[1140px] px-3 py-4 space-y-6">
        
        {/* SECCIÓN DEL AVATAR (Reemplaza la imagen estática) */}
        <section className="flex justify-center">
          <div className="w-full max-w-[900px] rounded-[34px] bg-slate-900 p-1 shadow-2xl relative overflow-hidden aspect-video min-h-[280px] md:min-h-[420px]">
            
            {/* Video de la Pregunta */}
            <video
              ref={avatarVideoRef}
              src={questionsData[currentStep]?.video}
              preload="auto"
              playsInline
              onEnded={() => {
                setIsAvatarTalking(false);
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isAvatarTalking ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[10px] text-white">
              <span className={`h-2 w-2 rounded-full ${isAvatarTalking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              {isAvatarTalking ? "AVATAR HABLANDO" : "TURNO DE RESPUESTA"}
            </div>
          </div>
        </section>

        {/* SECCIÓN DE AUDIO BARS */}
        <div className="mx-auto w-full max-w-[820px] bg-white/90 backdrop-blur-sm p-8 rounded-[32px] border border-emerald-100 shadow-xl">
           <div className="text-center mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pregunta {currentStep + 1} de {questionsData.length}</p>
              <h2 className="text-xl font-bold text-slate-800 mt-2">{questionsData[currentStep].text}</h2>
           </div>

           <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-[280px] h-20 flex items-center justify-center">
                <AudioBars heights={waveHeights} />
              </div>
              
              <div className="text-sm text-slate-500 font-medium">
                {isAvatarTalking
                  ? "El avatar esta hablando..."
                  : isRecording
                    ? "Microfono activo. Responde la pregunta."
                    : answerReady
                      ? "Respuesta lista. Puedes continuar."
                      : "Activa el microfono para responder."}
              </div>
              {isRecording && (
                <p className="text-xs font-medium text-emerald-700">
                  {hasDetectedSpeech ? "Respuesta detectada" : "Esperando tu voz"}
                </p>
              )}
              <div className="flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleResponseToggle}
                  disabled={isAvatarTalking}
                  className="rounded-lg bg-emerald-700 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isRecording ? "Detener respuesta" : "Responder"}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isAvatarTalking || (!answerReady && !isLastStep)}
                  className="rounded-lg bg-slate-900 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isLastStep ? "Volver al chat" : "Siguiente"}
                </button>
              </div>
              {isLastStep && answerReady && (
                <button
                  type="button"
                  onClick={() => router.replace("/")}
                  className="text-base font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                >
                  Vuelve a AECO
                </button>
              )}
           </div>
        </div>

      </main>

      {/* Tus estilos globales... */}
    </div>
  );
}
