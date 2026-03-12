import Image from "next/image";

const waveformHeights = [16, 22, 18, 28, 20, 26, 12, 18, 24, 16, 22];

const AudioBars = () => (
  <div className="flex items-end justify-center gap-2">
    {waveformHeights.map((height, index) => (
      <span
        key={index}
        className="inline-block w-1.5 rounded-full bg-gradient-to-b from-emerald-600 to-emerald-300"
        style={{ height: `${height + 10}px` }}
      />
    ))}
  </div>
);

export default function EvaluacionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-4 shadow-sm shadow-slate-900/5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-3xl bg-slate-900 text-white shadow-lg">
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 21V9l9-6 9 6v12" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">
              Observatorio AEC
            </p>
            <p className="text-base font-bold text-slate-900">Executive Assessment</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 md:gap-3">
          <span className="text-[9px] font-semibold uppercase tracking-[0.45em] text-slate-400">
            Progreso de la entrevista
          </span>
          <div className="rounded-full bg-emerald-900/5 px-3 py-1 text-xs font-semibold text-emerald-900">
            Pregunta 2 de 5
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
            aria-label="Configuración"
          >
            ⚙
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
            aria-label="Ayuda"
          >
            ?
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-tr from-emerald-700 to-emerald-500 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-inner">
            JD
          </div>
        </div>
      </header>

      <div className="mx-auto mt-6 flex w-full max-w-[1140px] flex-col gap-5 px-3 py-5">
        <main className="space-y-6">
          <section className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.5em] text-emerald-700">
              Entrevista de Liderazgo
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
              Entrevista de Liderazgo: Visión Estratégica
            </h1>
            <p className="mt-2 max-w-3xl mx-auto text-sm text-slate-600">
              Esta sesión está siendo grabada para el comité de selección. Por favor, asegúrate de estar en un
              ambiente tranquilo.
            </p>
          </section>

          <section className="flex justify-center">
            <div className="w-full max-w-[980px] rounded-[34px] bg-gradient-to-br from-slate-900 to-slate-800 p-1 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.9)]">
              <div className="relative h-[360px] overflow-hidden rounded-[30px] border border-slate-900/60 bg-slate-950">
                <Image
                  src=""
                  alt="Entrevistador"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 1200px"
                  unoptimized
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  INTERVENTOR AI EN LÍNEA
                </div>
                <p className="absolute inset-x-0 bottom-4 mx-auto max-w-3xl px-6 text-center text-base font-semibold leading-tight text-white drop-shadow-xl md:text-lg">
                  “¿Cómo describiría su enfoque para liderar equipos en entornos de alta incertidumbre?”
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto flex w-full max-w-[860px] flex-col gap-4 rounded-[32px] border border-slate-100 bg-white/90 px-5 py-5 shadow-xl">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.5em] text-slate-400">
              <span>Entrada de audio</span>
              <span>00:00 / 02:00 máx.</span>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-5">
              <AudioBars />
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-7 py-3 text-[13px] font-semibold uppercase tracking-[0.25em] text-white shadow-[0_12px_24px_rgba(14,116,144,0.35)] transition hover:-translate-y-0.5"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M12 4c-1.657 0-3 1.343-3 3v6a3 3 0 1 0 6 0V7c0-1.657-1.343-3-3-3zm5 6a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zm-9 5a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2H8zm4 0c-1.966 0-3.555.901-4.625 1.949A1 1 0 0 0 7.75 20h8.5a1 1 0 0 0 .375-1.051C15.555 17.901 13.966 17 12 17z" />
                </svg>
                Responder con audio
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
