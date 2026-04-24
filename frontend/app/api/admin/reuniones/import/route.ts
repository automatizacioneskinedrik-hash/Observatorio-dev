import { NextRequest, NextResponse } from "next/server";

const UPLOAD_TIMEOUT_MS = 120000;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const bases = [
      process.env.API_BASE_URL?.replace(/\/$/, ""),
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, ""),
      "http://localhost:5000",
      "http://localhost:8080",
    ].filter((value): value is string => Boolean(value));

    if (bases.length === 0) {
      return NextResponse.json({ error: "Falta API_BASE_URL" }, { status: 500 });
    }

    for (const base of bases) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

        try {
          const response = await fetch(`${base}/admin/reuniones/import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
          });

          const rawBody = await response.text().catch(() => "");
          try {
            const data = rawBody ? JSON.parse(rawBody) : {};
            return NextResponse.json(data, { status: response.status });
          } catch {
            return NextResponse.json(
              {
                ok: false,
                error: `Respuesta no JSON del backend (${response.status}).`,
                backend_status: response.status,
                backend_body_preview: rawBody.slice(0, 500) || null,
              },
              { status: response.status },
            );
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch {
        // intenta con la siguiente base
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: `No se pudo conectar al backend (${bases.join(", ")}). Verifica que esté levantado.`,
      },
      { status: 502 },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        {
          ok: false,
          error: "El backend tardo demasiado en responder.",
        },
        { status: 504 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo reenviar la solicitud al backend.",
      },
      { status: 500 },
    );
  }
}
