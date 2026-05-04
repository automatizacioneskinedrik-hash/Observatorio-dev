import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
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
      const target = new URL(`${base}/admin/usuarios`);
      url.searchParams.forEach((value, key) => {
        target.searchParams.set(key, value);
      });

      const response = await fetch(target.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      }

      const text = await response.text();
      return NextResponse.json(
        {
          error: `Respuesta no JSON del backend (${response.status}).`,
          preview: text.slice(0, 400),
        },
        { status: response.status }
      );
    } catch {
      // intenta con la siguiente base
    }
  }

  return NextResponse.json(
    {
      error: `No se pudo conectar al backend (${bases.join(", ")}). Verifica que esté levantado.`,
    },
    { status: 502 }
  );
}
