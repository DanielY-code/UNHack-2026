// The companion API with a mocked Anthropic endpoint: validation, prompt building and errors.
import test from "node:test";
import assert from "node:assert/strict";

const { default: handler } = await import("../api/companion.js");

function call({ method = "POST", body, ip = "1.1.1.1", origin } = {}) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.statusCode = c; return this; },
      json(d) { resolve({ status: this.statusCode, body: d }); },
    };
    handler({ method, body, headers: { "x-forwarded-for": ip, origin } }, res);
  });
}

function mockClaude(text) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 });
  };
  return calls;
}

test("health check reports whether a key is configured", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  assert.deepEqual((await call({ method: "GET" })).body, { ok: true, configured: false });
});

test("refuses to call Claude without a key", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const r = await call({ body: { kind: "chat", messages: [{ role: "user", content: "hi" }] }, ip: "2.2.2.2" });
  assert.equal(r.status, 503);
  assert.equal(r.body.code, "not_configured");
});

test("chat builds the prompt on the server with the chosen companion", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  const calls = mockClaude("Hello, apprentice!");
  const r = await call({ body: { kind: "chat", companion: "wizard", context: "Student: Maya", messages: [{ role: "assistant", content: "hi" }, { role: "user", content: "What should I learn?" }] }, ip: "3.3.3.3" });
  assert.equal(r.status, 200);
  assert.equal(r.body.text, "Hello, apprentice!");
  assert.match(calls[0].system, /Merla/);
  assert.match(calls[0].system, /Student: Maya/);
  assert.equal(calls[0].messages[0].role, "user", "leading assistant turns are dropped");
});

test("rejects unknown kinds and conversations that don't end with the student", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  mockClaude("x");
  assert.equal((await call({ body: { kind: "anything" }, ip: "4.4.4.4" })).status, 400);
  assert.equal((await call({ body: { kind: "chat", messages: [{ role: "assistant", content: "hi" }] }, ip: "4.4.4.4" })).status, 400);
});

test("grow returns the parsed tree and reports unreadable output", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  mockClaude('Here you go: {"name":"Marine Biology","nodes":[{"id":"n1","t":0}]}');
  const ok = await call({ body: { kind: "grow", topic: "Marine biology", pathIds: ["cs", "bad id!"] }, ip: "5.5.5.5" });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.path.name, "Marine Biology");
  mockClaude("sorry, no json");
  const bad = await call({ body: { kind: "grow", topic: "Marine biology" }, ip: "5.5.5.5" });
  assert.equal(bad.body.code, "invalid_json");
});

test("rate limits a single visitor", async () => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  mockClaude("ok");
  let last;
  for (let i = 0; i < 21; i++) last = await call({ body: { kind: "chat", messages: [{ role: "user", content: "hi" }] }, ip: "9.9.9.9" });
  assert.equal(last.status, 429);
});
