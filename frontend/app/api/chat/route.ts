export async function POST(req: Request) {
    const body = await req.json();
    const base = process.env.API_BASE_URL; // (runtime, no build)

    if (!base) return Response.json({ error: "Falta API_BASE_URL" }, { status: 500 });

    const r = await fetch(`${base.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await r.json();
    return Response.json(data, { status: r.status });
}