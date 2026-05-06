"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase"; 

const waveformHeights = [16, 22, 18, 28, 20, 26, 12, 18, 24, 16, 22];

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getSupportedAudioMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
};

const questionsData = [
  { id: 1, text: "Pregunta 1...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011524/Bienvenida_pregunta_1_ratl0s.mp4" },
  { id: 2, text: "Pregunta 2...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011524/Pregunta_2_yqbvcn.mp4" },
  { id: 3, text: "Pregunta 3...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011530/Pregunta_3_zbwaih.mp4" },
  { id: 4, text: "Pregunta 4...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011524/Pregunta_4_i1hg4h.mp4" },
  { id: 5, text: "Pregunta 5...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011524/Pregunta_5_cdwpjj.mp4" },
  { id: 6, text: "Pregunta 6...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011524/Pregunta_6_ojljd4.mp4" },
  { id: 7, text: "Pregunta 7...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011525/Pregunta_7_grjlp2.mp4" },
  { id: 8, text: "Pregunta 8...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011525/Pregunta_8_mwtof8.mp4" },
  { id: 9, text: "Cierre...", video: "https://res.cloudinary.com/dokjm2hj6/video/upload/v1778011524/Cierre_utvrdr.mp4" },
];

const AudioBars = ({ heights, isActive }: { heights: number[]; isActive: boolean }) => (
  <div className="flex items-end justify-center gap-2">
    {heights.map((height, index) => (
      <span
        key={index}
        className="inline-block w-1.5 rounded-full bg-gradient-to-b from-emerald-600 to-emerald-300"
        style={{
          height: `${height + 10}px`,
          transition: isActive ? "height 0.08s ease" : "height 0.18s ease",
        }}
      />
    ))}
  </div>
);

const RecordedAudioPlayer = ({ src }: { src: string }) => {
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);

  const togglePlayback = useCallback(() => {
    const audio = playbackRef.current;
    if (!audio) return;
    if (audio.paused) {
      setPlaybackError(false);
      void audio.play().catch(() => { setIsPlaying(false); setPlaybackError(true); });
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
    const handleError = () => { setIsPlaying(false); setPlaybackError(true); };
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    return () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      playbackRef.current = null;
    };
  }, [src]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={togglePlayback}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); togglePlayback(); }
      }}
      className="flex w-full max-w-[320px] items-center gap-3 rounded-full border border-emerald-200 bg-white px-3 py-2 shadow-sm transition-colors hover:border-emerald-300"
      aria-label="Reproducir respuesta grabada"
    >
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); togglePlayback(); }}
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
          <span key={index} className="w-1 rounded-full bg-emerald-600" style={{ height: `${7 + ((index * 5) % 14)}px` }} />
        ))}
      </div>
      <span className="shrink-0 text-xs font-semibold text-emerald-700">
        {playbackError ? "Error" : formatDuration(duration)}
      </span>
    </div>
  );
};

export default function EvaluacionPage() {
  const router = useRouter();
  const googleId = auth?.currentUser?.uid ?? ""; // ← aquí, una sola vez

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
    if (animationFrameRef.current) { cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((track) => track.stop()); streamRef.current = null; }
    if (audioContextRef.current) { void audioContextRef.current.close(); audioContextRef.current = null; }
    analyserRef.current = null;
  }, []);

  const stopMicrophone = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.requestData();
      recorder.stop();
      setIsRecording(false);
      setWaveHeights([...waveformHeights]);
      return;
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
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        if (!audioChunksRef.current.length) {
          cleanupAudioProcessing();
          mediaRecorderRef.current = null;
          setIsRecording(false);
          setWaveHeights([...waveformHeights]);
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudioByStep((prev) => {
          const previousUrl = prev[currentStep];
          if (previousUrl) URL.revokeObjectURL(previousUrl);
          const next = { ...prev, [currentStep]: url };
          recordedAudioByStepRef.current = next;
          return next;
        });
        setAnswerReady(true);
        cleanupAudioProcessing();
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setWaveHeights([...waveformHeights]);
      });

      recorder.start(250);

      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error("AudioContext no esta disponible en este navegador.");

      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.fftSize);
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const amplitude = Math.max(8, rms * 520);
        setWaveHeights((prev) =>
          prev.map((_, index) => {
            const spread = 0.58 + ((index % 5) * 0.18);
            const wobble = 0.88 + Math.sin((performance.now() / 120) + index) * 0.22;
            return Math.max(8, amplitude * spread * wobble);
          })
        );
        if (streamRef.current) animationFrameRef.current = requestAnimationFrame(checkVolume);
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
    if (isRecording) { stopMicrophone(); return; }
    void startRecording();
  }, [isAvatarTalking, isRecording, startRecording, stopMicrophone]);

  const transcribirYGuardar = useCallback(async (step: number, audioUrl: string) => {
    try {
      const blob = await fetch(audioUrl).then(r => r.blob());
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");
      formData.append("step", String(step));
      formData.append("google_id", googleId); 

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/onboarding/transcribir`, {
        method: "POST",
        body: formData,
      });

      const { texto } = await res.json();

      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/onboarding/respuestas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_id: googleId,
          preguntas: [questionsData[step].text],
          respuestas: [texto],
          dimensiones: [""],
        }),
      });
    } catch (err) {
      console.error("Error transcribiendo/guardando:", err);
    }
  }, [googleId]);

  const handleNextStep = useCallback(async () => {
    if (!answerReady && !isLastStep) return;
    stopMicrophone();
    setWaveHeights([...waveformHeights]);
    const audioUrl = recordedAudioByStepRef.current[currentStep];
    if (audioUrl) await transcribirYGuardar(currentStep, audioUrl);
    if (currentStep < questionsData.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setAnswerReady(Boolean(recordedAudioByStepRef.current[nextStep]));
      setIsAvatarTalking(true);
      return;
    }
    router.replace("/");
  }, [answerReady, currentStep, isLastStep, router, stopMicrophone, transcribirYGuardar]);

  useEffect(() => {
    const initTimer = setTimeout(() => { setIsAvatarTalking(true); }, 1500);
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
      void video.play().catch(() => { setIsAvatarTalking(false); });
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
              onEnded={() => { setIsAvatarTalking(false); }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${isAvatarTalking ? "opacity-100" : "opacity-0"}`}
            />
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[10px] text-white">
              <span className={`h-2 w-2 rounded-full ${isAvatarTalking ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
              {isAvatarTalking ? "" : "TURNO DE RESPUESTA"}
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
              <AudioBars heights={waveHeights} isActive={isRecording} />
            </div>

            <div className="text-sm font-medium text-slate-500">
              {isAvatarTalking ? "" : isRecording ? "Microfono activo. Responde la pregunta." : answerReady ? "Respuesta guardada. Puedes continuar." : "Activa responder para grabar tu respuesta."}
            </div>

            {recordedAudioByStep[currentStep] && (
              <RecordedAudioPlayer key={recordedAudioByStep[currentStep]} src={recordedAudioByStep[currentStep]} />
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
