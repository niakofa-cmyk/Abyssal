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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "600",
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

async function handle({ request }: { request: Request }) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "The ocean could not read that." }, 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return jsonResponse({ ok: false, error: "The ocean refused that." }, 400);
  try {
    if (parsed.data.action === "roster") {
      const data = await oceanRoster();
      return jsonResponse({ ok: true, ...data });
    }
    if (parsed.data.action === "join") {
      const data = await oceanJoin(parsed.data.token ?? null, parsed.data.callsign ?? "");
      return jsonResponse({ ok: true, ...data });
    }
    const data = await oceanSync(parsed.data.token, parsed.data.input);
    if (!data) return jsonResponse({ ok: false, error: "That dive is gone. Enter the ocean again." }, 404);
    return jsonResponse({ ok: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The sea did not answer.";
    return jsonResponse({ ok: false, error: message }, 400);
  }
}

async function getRoster() {
  try {
    const data = await oceanRoster();
    return jsonResponse({ ok: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The sea did not answer.";
    return jsonResponse({ ok: false, error: message }, 503);
  }
}

export const Route = createFileRoute("/api/ocean")({
  server: {
    handlers: {
      GET: getRoster,
      POST: handle,
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
    },
  },
});
