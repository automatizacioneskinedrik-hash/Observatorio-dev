import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8080";
const UPLOAD_TIMEOUT_MS = 120000;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const bases = [
      process.env.BACKEND_URL?.replace(/\/$/, ""),
      process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, ""),
      "http://localhost:5000",
      "http://localhost:8080",
    ].filter((value): value is string => Boolean(value));

    let lastError: unknown = null;

    for (const base of bases.length > 0 ? bases : [BACKEND_URL]) {
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

          const data = await response.json().catch(() => null);

          return NextResponse.json(data ?? { ok: false, error: "Respuesta invalida del backend." }, {
            status: response.status,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("No se pudo conectar al backend.");
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
