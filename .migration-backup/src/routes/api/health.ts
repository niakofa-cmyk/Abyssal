import { createFileRoute } from "@tanstack/react-router";
import { ensureDbReady, readDbMode } from "@/lib/db";

async function GET() {
  try {
    await ensureDbReady();
    const db = readDbMode().source === "postgres" ? "postgres" : "pglite";
    return Response.json({ ok: true, ready: true, db });
  } catch (err) {
    const message = err instanceof Error ? err.message : "database unavailable";
    return Response.json({ ok: false, ready: false, error: message }, { status: 503 });
  }
}

export const Route = createFileRoute("/api/health")({
  server: { handlers: { GET } },
});