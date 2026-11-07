// Edventure companion API (Vercel serverless function).
//
// The browser never sees the Anthropic API key. It sends a small, validated request
// ("chat" or "grow"), and this function builds the real prompt from data/prompts.json,
// so the endpoint can't be used as a general-purpose Claude proxy.
//
// Environment variables (set them in Vercel → Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY      required
//   ANTHROPIC_CHAT_MODEL   optional, default claude-haiku-5-5 (fast, cheap chat)
//   ANTHROPIC_GROW_MODEL   optional, default claude-sonnet-5-5 (better skill-tree design)
//   ALLOWED_ORIGINS        optional, comma-separated list, e.g. https://edventure.vercel.app

import { readFileSync } from "node:fs";
import { join } from "node:path";

const PROMPTS = JSON.parse(readFileSync(join(process.cwd(), "data", "prompts.json"), "utf8"));
const API_URL = "https://api.anthropic.com/v1/messages";
const LIMITS = { context: 2500, message: 1200, turns: 12, topic: 80, pathIds: 40 };

// Best-effort rate limit: 20 requests per 10 minutes per visitor, per server instance.
// For a public launch, move this to a shared store such as Upstash Redis or Vercel KV.
const WINDOW_MS = 10 * 60 * 1000, MAX_REQUESTS = 20;
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { count: 1, reset: now + WINDOW_MS }); return false; }
  h.count += 1;
  return h.count > MAX_REQUESTS;
}

const fill = (t, v) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? "");
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const fail = (res, status, code, error) => res.status(status).json({ code, error });

function cleanTurns(raw) {
  if (!Array.isArray(raw)) return null;
  const turns = raw
    .slice(-LIMITS.turns)
    .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim())
    .map((t) => ({ role: t.role, content: t.content.slice(0, LIMITS.message) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  // The Messages API needs alternating roles that end on the student's turn.
  const merged = [];
  for (const t of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === t.role) last.content += "\n" + t.content;
    else merged.push({ ...t });
  }
  return merged.length && merged[merged.length - 1].role === "user" ? merged : null;
}

function extractJson(text) {
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

async function callClaude({ model, system, messages, maxTokens }) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    signal: AbortSignal.timeout(28000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error?.message || `Anthropic API error ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (allowed.length && origin && !allowed.includes(origin)) return fail(res, 403, "forbidden", "Origin not allowed.");

  // GET is a health check the app uses to know whether the companion can talk.
  if (req.method === "GET") return res.status(200).json({ ok: true, configured: Boolean(process.env.ANTHROPIC_API_KEY) });
  if (req.method !== "POST") return fail(res, 405, "method_not_allowed", "Use POST.");
  if (!process.env.ANTHROPIC_API_KEY) return fail(res, 503, "not_configured", "ANTHROPIC_API_KEY is not set.");

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return fail(res, 429, "rate_limited", "Too many requests. Try again in a few minutes.");

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const context = str(body.context, LIMITS.context);

  try {
    if (body.kind === "chat") {
      const messages = cleanTurns(body.messages);
      if (!messages) return fail(res, 400, "bad_request", "messages must end with a user turn.");
      const persona = PROMPTS.personas[body.companion] || PROMPTS.personas.orb;
      const text = await callClaude({
        model: process.env.ANTHROPIC_CHAT_MODEL || "claude-haiku-5-5",
        system: fill(PROMPTS.chat, { persona, context }),
        messages,
        maxTokens: 500,
      });
      return res.status(200).json({ text });
    }

    if (body.kind === "grow") {
      const topic = str(body.topic, LIMITS.topic).trim();
      if (!topic) return fail(res, 400, "bad_request", "topic is required.");
      const pathIds = (Array.isArray(body.pathIds) ? body.pathIds : [])
        .slice(0, LIMITS.pathIds)
        .map((id) => String(id).replace(/[^\w-]/g, "").slice(0, 40))
        .filter(Boolean);
      const text = await callClaude({
        model: process.env.ANTHROPIC_GROW_MODEL || "claude-sonnet-5-5",
        system: "You design educational skill trees. Reply with a single JSON object and nothing else.",
        messages: [{ role: "user", content: fill(PROMPTS.grow, { topic, pathIds: pathIds.join(", "), context }) }],
        maxTokens: 2500,
      });
      const path = extractJson(text);
      if (!path || !Array.isArray(path.nodes)) return fail(res, 502, "invalid_json", "The model returned an unreadable tree.");
      return res.status(200).json({ path });
    }

    return fail(res, 400, "bad_request", 'kind must be "chat" or "grow".');
  } catch (e) {
    console.error("companion error:", e.status || "", e.message);
    if (e.status === 429) return fail(res, 429, "rate_limited", "The AI service is busy. Try again shortly.");
    return fail(res, 502, "server_error", "The companion couldn't answer just now.");
  }
}
