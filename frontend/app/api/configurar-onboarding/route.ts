export async function POST(req: Request) {
  const body = await req.json();
  const bases = [
    process.env.API_BASE_URL?.replace(/\/$/, ""),
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, ""),
    "http://localhost:5000",
    "http://localhost:8080",
  ].filter((value): value is string => Boolean(value));

  if (bases.length === 0) {
    return Response.json({ error: "Falta API_BASE_URL" }, { status: 500 });
  }

  for (const base of bases) {
    try {
      const upstream = await fetch(`${base}/api/configurar-onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await upstream.json().catch(() => ({}));
      return Response.json(data, { status: upstream.status });
    } catch {
      // intenta con la siguiente base
    }
  }

  return Response.json(
    {
      error: `No se pudo conectar al backend (${bases.join(", ")}). Verifica que este levantado.`,
    },
    { status: 502 }
  );
}
