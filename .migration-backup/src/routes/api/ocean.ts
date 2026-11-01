import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { oceanJoin, oceanRoster, oceanSync } from "@/game/ocean.server";

const intent = z.object({
  ax: z.number(),
  ay: z.number(),
  aimX: z.number(),
  aimY: z.number(),
  fire: z.boolean(),
  use: z.boolean().optional(),
  repair: z.boolean().optional(),
  cycle: z.boolean().optional(),
});

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("roster") }),
  z.object({ action: z.literal("join"), token: z.string().nullable().optional(), callsign: z.string().optional() }),
  z.object({ action: z.literal("sync"), token: z.string(), input: intent }),
]);

async function handle({ request }: { request: Request }) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "The ocean could not read that." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ ok: false, error: "The ocean refused that." }, { status: 400 });
  try {
    if (parsed.data.action === "roster") {
      const data = await oceanRoster();
      return Response.json({ ok: true, ...data });
    }
    if (parsed.data.action === "join") {
      const data = await oceanJoin(parsed.data.token ?? null, parsed.data.callsign ?? "");
      return Response.json({ ok: true, ...data });
    }
    const data = await oceanSync(parsed.data.token, parsed.data.input);
    if (!data) return Response.json({ ok: false, error: "That dive is gone. Enter the ocean again." }, { status: 404 });
    return Response.json({ ok: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The sea did not answer.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export const Route = createFileRoute("/api/ocean")({
  server: { handlers: { POST: handle } },
});
