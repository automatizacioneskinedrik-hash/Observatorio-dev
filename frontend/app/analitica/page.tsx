import type { Metadata } from "next";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  CircleCheckBig,
  Download,
  Globe2,
  Layers3,
  LineChart,
  Mic2,
  PanelLeft,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Analitica AEC | Observatorio AEC",
  description: "Vista de analitica AEC en modo claro",
};

const kpis = [
  { label: "Confianza del modelo", value: "98%", delta: "+2.4%", note: "Lectura estable con validacion continua" },
  { label: "Eventos procesados", value: "1,284", delta: "+18%", note: "Entradas consolidadas para el tablero" },
  { label: "Paises detectados", value: "17", delta: "+5", note: "Cobertura geografica identificada por IA" },
  { label: "Alertas activas", value: "06", delta: "-3", note: "Señales que requieren seguimiento" },
] as const;

const waveformHeights = [
  28, 42, 61, 79, 46, 53, 88, 69, 38, 49, 100, 66, 82, 41, 26, 59, 93, 74, 52, 85, 31, 44, 60, 77, 43, 56, 91, 71,
  36, 50, 97,
] as const;

const activity = [
  "Pico de actividad detectado",
  "Sesion consolidada por ID",
  "Transcripcion indexada",
  "Pais de origen identificado",
  "Señal ejecutiva clasificada",
] as const;

const transcriptFeed = [
  {
    time: "10:24:01",
    speaker: "Sistema AEC",
    text: "La transcripcion muestra aumento en prioridad operativa y continuidad.",
    accent: "emerald",
  },
  {
    time: "10:24:15",
    speaker: "Motor IA",
    text: "Se detecta presencia de empresa internacional con sede en Mexico y operacion en Chile.",
    accent: "slate",
  },
  {
    time: "10:24:42",
    speaker: "Señal",
    text: "El perfil ejecutivo presenta mayor intensidad que el resto de segmentos.",
    accent: "emerald",
  },
  {
    time: "10:25:05",
    speaker: "Clasificador",
    text: "Etiquetas sugeridas: reunion, pais, empresa, evento, perfil y transcripcion.",
    accent: "slate",
  },
] as const;

const companies = [
  { name: "Grupo Andino", country: "Colombia", signal: "Alta prioridad", status: "Observado" },
  { name: "TechBridge", country: "Mexico", signal: "Mencion territorial", status: "Validar" },
  { name: "Nova Infra", country: "Chile", signal: "Crecimiento estable", status: "OK" },
  { name: "Atlas Build", country: "USA", signal: "CEO track", status: "Activa" },
] as const;

const insightCards = [
  {
    title: "Audio en vivo",
    description: "Entrada y persistencia listas para analisis continuo.",
    icon: Mic2,
  },
  {
    title: "Video activo",
    description: "Reproduccion con respuesta y trazabilidad por evento.",
    icon: Video,
  },
  {
    title: "Cobertura global",
    description: "Mapa de empresas por pais, sector y nivel de señal.",
    icon: Globe2,
  },
] as const;

export default function AnaliticaAECPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-8%] h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-96 w-96 rounded-full bg-teal-200/25 blur-3xl" />
        <div className="absolute bottom-[-10%] left-1/3 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen w-full gap-4 p-4 lg:p-5">
        <aside className="sticky top-4 h-[calc(100vh-2rem)] w-[320px] shrink-0 self-start overflow-y-auto rounded-[36px] border border-emerald-100/70 bg-white/92 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <Layers3 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Panel</p>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">Lectura de datos ejecutivos</p>
                </div>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Sparkles className="size-4" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Estado</p>
                <p className="mt-1 text-base font-bold text-slate-900">Resumen operativo</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Enfoque</p>
                <p className="mt-1 text-base font-bold text-emerald-700">Señales, volumen y cobertura</p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {["Resumen ejecutivo", "Entrevistas en vivo", "Transcripciones", "Empresas y paises", "Alertas de perfil"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    index === 0
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <ChevronRight className={`size-4 ${index === 0 ? "text-emerald-600" : "text-slate-300"}`} />
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>

          <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Actividad reciente</p>
              <PanelLeft className="size-4 text-slate-400" />
            </div>
            <div className="mt-4 space-y-3">
              {activity.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 size-2 rounded-full bg-emerald-500" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[42px] border border-white/90 bg-white/92 shadow-[0_18px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 lg:px-7">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <BarChart3 className="size-6" />
              </div>
              <div className="flex items-end gap-2">
                <h1 className="text-[22px] font-black uppercase leading-none tracking-tight text-slate-900">AECO</h1>
                <span className="text-[22px] font-black uppercase leading-none tracking-tight text-emerald-600">IA</span>
              </div>
            </div>

            <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 md:flex">
              {["Resumen", "Entrevistas", "Empresas", "Alertas"].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    index === 0
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex"
              >
                <Search className="size-4" />
                Buscar
              </button>
              <button
                type="button"
                className="rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                <Download className="mr-2 inline size-4" />
                Exportar
              </button>
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-emerald-700"
                aria-label="Notificaciones"
              >
                <Bell className="size-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="space-y-4">
              <section className="grid gap-4 xl:grid-cols-4">
                {kpis.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">{item.label}</p>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                        {item.delta}
                      </span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <p className="text-4xl font-black tracking-tight text-slate-900">{item.value}</p>
                      <CircleCheckBig className="size-6 text-emerald-600" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{item.note}</p>
                  </article>
                ))}
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                <article className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Mic2 className="size-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                          Ingesta de eventos
                        </p>
                        <h2 className="text-xl font-black tracking-tight text-slate-900">Procesamiento en tiempo real</h2>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                      Motor activo
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                        <span>Waveform</span>
                        <span className="text-emerald-700">03:24 / 12:45</span>
                      </div>
                      <div className="mt-6 flex h-40 items-end justify-between gap-1 overflow-hidden">
                        {waveformHeights.map((height, index) => (
                          <div
                            key={`${height}-${index}`}
                            className={`w-2 rounded-full ${
                              index % 6 === 0 ? "bg-emerald-500" : index % 3 === 0 ? "bg-emerald-300" : "bg-slate-300"
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                        {[["SR", "48kHz"], ["Bit", "24-bit"], ["Buffer", "512ms"]].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</p>
                            <p className="mt-1 font-bold text-slate-900">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {insightCards.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.title}
                            className="rounded-[26px] border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                                <Icon className="size-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="rounded-[26px] border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
                            Lectura ejecutiva
                          </p>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
                            Por segmento
                          </span>
                        </div>
                        <p className="mt-3 text-base font-bold text-slate-900">
                          El patron visual se ajusta segun el nivel de actividad detectado.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5"
                          >
                            <Play className="size-4" />
                            Ver segmento
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                          >
                            Abrir detalle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Flujo en vivo</p>
                      <h2 className="text-xl font-black tracking-tight text-slate-900">Transcripcion en tiempo real</h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-rose-600">
                      <span className="size-2 rounded-full bg-rose-500" />
                      Señal activa
                    </div>
                  </div>

                  <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                    <div className="space-y-4">
                      {transcriptFeed.map((item) => (
                        <div key={`${item.time}-${item.speaker}`} className="flex items-start gap-3">
                          <span className="mt-1 w-16 shrink-0 text-[10px] font-mono font-bold text-slate-400">
                            {item.time}
                          </span>
                          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                            <p className="text-sm font-bold text-slate-900">
                              <span className={item.accent === "emerald" ? "text-emerald-700" : "text-slate-500"}>
                                {item.speaker}:
                              </span>{" "}
                              <span className="font-medium text-slate-700">{item.text}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Resumen IA</p>
                      <Sparkles className="size-4 text-emerald-600" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      El sistema consolida un patron de actividad con empresas globales, pais de origen,
                      segmento ejecutivo y trazabilidad de cada evento.
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      <ShieldAlert className="size-4 text-amber-500" />
                      Requiere validacion para señal de baja calidad
                    </div>
                  </div>
                </article>
              </section>

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <article className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Cobertura</p>
                      <h2 className="text-xl font-black tracking-tight text-slate-900">Analisis mundial por pais</h2>
                    </div>
                    <div className="rounded-full bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                      Mapa
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          {["Empresa", "Pais", "Señal", "Estado"].map((header) => (
                            <th
                              key={header}
                              className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.3em] text-slate-500"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {companies.map((company) => (
                          <tr key={company.name} className="transition hover:bg-emerald-50/40">
                            <td className="px-4 py-4">
                              <p className="font-bold text-slate-900">{company.name}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">{company.country}</td>
                            <td className="px-4 py-4 text-sm text-slate-600">{company.signal}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                                {company.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Estado del flujo</p>
                      <h2 className="text-xl font-black tracking-tight text-slate-900">Lectura de señales</h2>
                    </div>
                    <LineChart className="size-5 text-emerald-600" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      "Consolidar la sesion y normalizar el nombre",
                      "Indexar transcripcion al tablero",
                      "Procesar señales entrantes con IA",
                      "Reproducir video y registrar respuesta",
                      "Ajustar vista segun segmento detectado",
                    ].map((step, index) => (
                      <div
                        key={step}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-emerald-700 shadow-sm">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">Señal ejecutiva</p>
                      <Users className="size-4 text-emerald-300" />
                    </div>
                    <p className="mt-3 text-lg font-bold">El segmento ejecutivo presenta mayor actividad que el resto.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      La vista se adapta al nivel de señal y mantiene trazabilidad por cada evento.
                    </p>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-black text-slate-900 transition hover:-translate-y-0.5"
                    >
                      Ver analisis
                      <ArrowUpRight className="size-4" />
                    </button>
                  </div>
                </article>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
