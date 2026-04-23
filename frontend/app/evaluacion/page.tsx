"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const waveformHeights = [16, 22, 18, 28, 20, 26, 12, 18, 24, 16, 22];

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getSupportedAudioMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";

  const audio = typeof Audio !== "undefined" ? new Audio() : null;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return (
    candidates.find((type) => {
      if (!MediaRecorder.isTypeSupported(type)) return false;
      if (!audio) return true;
      return audio.canPlayType(type) !== "";
    }) ?? ""
  );
};

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

const RecordedAudioPlayer = ({ src }: { src: string }) => {
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const togglePlayback = useCallback(() => {
    const audio = playbackRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, []);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";
    playbackRef.current = audio;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handleLoadedMetadata = () => setDuration(audio.duration ?? 0);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      playbackRef.current = null;
    };
  }, [src]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={togglePlayback}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          togglePlayback();
        }
      }}
      className="flex w-full max-w-[320px] items-center gap-3 rounded-full border border-emerald-200 bg-white px-3 py-2 shadow-sm transition-colors hover:border-emerald-300"
      aria-label="Reproducir respuesta grabada"
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          togglePlayback();
        }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-700 text-white transition-colors hover:bg-emerald-800"
        aria-label={isPlaying ? "Detener respuesta grabada" : "Reproducir respuesta grabada"}
      >
        {isPlaying ? (
          <span className="flex gap-1">
            <span className="h-3.5 w-1 rounded-sm bg-white" />
            <span className="h-3.5 w-1 rounded-sm bg-white" />
          </span>
        ) : (
          <span className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
        )}
      </button>
      <div className="flex flex-1 items-center gap-1">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            key={index}
            className="w-1 rounded-full bg-emerald-600"
            style={{ height: `${7 + ((index * 5) % 14)}px` }}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs font-semibold text-emerald-700">
        {formatDuration(duration)}
      </span>
    </div>
  );
};

export default function EvaluacionPage() {
  const router = useRouter();
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recordedAudioByStepRef = useRef<Record<number, string>>({});

  const [currentStep, setCurrentStep] = useState(0);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [, setRecordingError] = useState<string | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>(() => [...waveformHeights]);
  const [recordedAudioByStep, setRecordedAudioByStep] = useState<Record<number, string>>({});
  const [answerReady, setAnswerReady] = useState(false);

  const isLastStep = currentStep === questionsData.length - 1;

  const cleanupAudioProcessing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const stopMicrophone = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    cleanupAudioProcessing();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setWaveHeights([...waveformHeights]);
  }, [cleanupAudioProcessing]);

  const startRecording = useCallback(async () => {
    if (isAvatarTalking || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      setIsRecording(true);
      setAnswerReady(false);

      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        if (!audioChunksRef.current.length) return;

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        setRecordedAudioByStep((prev) => {
          const previousUrl = prev[currentStep];
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          const next = { ...prev, [currentStep]: url };
          recordedAudioByStepRef.current = next;
          return next;
        });

        setAnswerReady(true);
      });

      recorder.start();

      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        throw new Error("AudioContext no esta disponible en este navegador.");
      }

      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const average = sum / bufferLength;

        setWaveHeights((prev) => prev.map(() => Math.max(10, average * 1.5)));

        if (streamRef.current) {
          animationFrameRef.current = requestAnimationFrame(checkVolume);
        }
      };

      checkVolume();
    } catch {
      setRecordingError("No se pudo acceder al microfono.");
      cleanupAudioProcessing();
      setIsRecording(false);
    }
  }, [cleanupAudioProcessing, currentStep, isAvatarTalking, isRecording]);

  const handleResponseToggle = useCallback(() => {
    if (isAvatarTalking) return;

    if (isRecording) {
      stopMicrophone();
      return;
    }

    void startRecording();
  }, [isAvatarTalking, isRecording, startRecording, stopMicrophone]);

  const handleNextStep = useCallback(() => {
    if (!answerReady && !isLastStep) return;

    stopMicrophone();
    setWaveHeights([...waveformHeights]);

    if (currentStep < questionsData.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setAnswerReady(Boolean(recordedAudioByStepRef.current[nextStep]));
      setIsAvatarTalking(true);
      return;
    }

    router.replace("/");
  }, [answerReady, currentStep, isLastStep, router, stopMicrophone]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsAvatarTalking(true);
    }, 1500);

    return () => {
      clearTimeout(initTimer);
      stopMicrophone();
      Object.values(recordedAudioByStepRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stopMicrophone]);

  useEffect(() => {
    setAnswerReady(Boolean(recordedAudioByStep[currentStep]));
  }, [currentStep, recordedAudioByStep]);

  useEffect(() => {
    const video = avatarVideoRef.current;
    if (!video) return;

    if (isAvatarTalking) {
      video.pause();
      video.currentTime = 0;
      void video.play().catch(() => {
        setIsAvatarTalking(false);
      });
      return;
    }

    video.pause();
  }, [currentStep, isAvatarTalking]);

  return (
    <div className={`min-h-screen bg-gradient-to-b from-white via-emerald-50/60 to-emerald-100 relative overflow-hidden ${isRecording ? "recording-shimmer" : ""}`}>
      <main className="mx-auto max-w-[1140px] px-3 py-4 space-y-6">
        <section className="flex justify-center">
          <div className="w-full max-w-[900px] rounded-[34px] bg-slate-900 p-1 shadow-2xl relative overflow-hidden aspect-video min-h-[280px] md:min-h-[420px]">
            <video
              ref={avatarVideoRef}
              src={questionsData[currentStep]?.video}
              playsInline
              preload="auto"
              onEnded={() => {
                setIsAvatarTalking(false);
              }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                isAvatarTalking ? "opacity-100" : "opacity-0"
              }`}
            />

            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[10px] text-white">
              <span className={`h-2 w-2 rounded-full ${isAvatarTalking ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
              {isAvatarTalking ? "AVATAR HABLANDO" : "TURNO DE RESPUESTA"}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[820px] rounded-[32px] border border-emerald-100 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <div className="text-center mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Pregunta {currentStep + 1} de {questionsData.length}
            </p>
            <h2 className="text-xl font-bold text-slate-800 mt-2">
              {questionsData[currentStep]?.text || "Finalizando entrevista..."}
            </h2>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex h-20 w-full max-w-[280px] items-center justify-center">
              <AudioBars heights={waveHeights} />
            </div>

            <div className="text-sm font-medium text-slate-500">
              {isAvatarTalking
                ? "El avatar esta hablando..."
                : isRecording
                  ? "Microfono activo. Responde la pregunta."
                  : answerReady
                    ? "Respuesta guardada. Puedes continuar."
                    : "Activa responder para grabar tu respuesta."}
            </div>

            {recordedAudioByStep[currentStep] && (
              <RecordedAudioPlayer src={recordedAudioByStep[currentStep]} />
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
          </div>
        </div>
      </main>
    </div>
  );
}
