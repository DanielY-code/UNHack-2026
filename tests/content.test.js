// Checks that the editable JSON content is internally consistent, so a typo in data/ fails CI instead of breaking a tree.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { readJson } from "./helpers.js";

const catalog = readJson("catalog"), paths = readJson("paths"), shop = readJson("shop");
const guidance = readJson("guidance"), prompts = readJson("prompts");
const statKeys = Object.keys(catalog.stats);

test("every path has a name, blurb and valid stat weights", () => {
  for (const [id, p] of Object.entries(paths)) {
    assert.ok(p.name && p.blurb, `${id} needs a name and blurb`);
    for (const k of Object.keys(p.weights)) assert.ok(statKeys.includes(k), `${id} weight "${k}" is not a stat`);
  }
});

test("node ids are unique and prerequisites point to earlier nodes in the same tree", () => {
  for (const [id, p] of Object.entries(paths)) {
    const byId = new Map();
    for (const n of p.nodes) {
      assert.ok(!byId.has(n.id), `${id}: duplicate node id ${n.id}`);
      byId.set(n.id, n);
    }
    for (const n of p.nodes) {
      assert.ok(Number.isInteger(n.t) && n.t >= 0 && n.t < catalog.tiers.length, `${id}/${n.id}: bad tier`);
      assert.ok(n.title && n.learn && n.objective, `${id}/${n.id}: missing text`);
      for (const r of n.req) {
        assert.ok(byId.has(r), `${id}/${n.id}: unknown prerequisite ${r}`);
        assert.ok(byId.get(r).t < n.t, `${id}/${n.id}: prerequisite ${r} must be in an earlier stage`);
      }
    }
    assert.ok(p.nodes.some((n) => n.req.length === 0), `${id}: needs a starting node`);
  }
});

test("branches and crossovers lead to paths that exist, and mastery has three stages", () => {
  for (const [id, p] of Object.entries(paths)) {
    for (const n of p.nodes) {
      if (n.branch) assert.ok(paths[n.branch], `${id}/${n.id}: branch to missing path ${n.branch}`);
      if (n.mastery) {
        assert.equal(n.mastery.length, 2, `${id}/${n.id}: mastery needs 2 extra stages (3 total)`);
        assert.ok(n.cross && paths[n.cross.to], `${id}/${n.id}: mastery needs a crossover to an existing path`);
        assert.notEqual(n.cross.to, id, `${id}/${n.id}: a crossover must lead to a different field`);
      }
    }
  }
});

test("every resource is an https link", () => {
  for (const [id, p] of Object.entries(paths)) {
    for (const n of p.nodes) {
      for (const r of [...(n.res || []), ...(n.cross?.res || [])]) {
        assert.match(r.url, /^https:\/\//, `${id}/${n.id}: ${r.url}`);
        assert.ok(r.name, `${id}/${n.id}: resource needs a name`);
      }
    }
  }
});

test("shop items are unique, priced and of a known kind; every companion has a persona", () => {
  const ids = new Set();
  for (const i of shop) {
    assert.ok(!ids.has(i.id), `duplicate shop id ${i.id}`);
    ids.add(i.id);
    assert.ok(["comp", "skin", "orb", "title", "gift"].includes(i.kind), `${i.id}: unknown kind`);
    assert.ok(Number.isInteger(i.cost) && i.cost >= 0, `${i.id}: bad cost`);
    if (i.kind === "comp") assert.ok(prompts.personas[i.val], `${i.id}: no persona in prompts.json`);
  }
});

test("every tooltip used in the code exists in guidance.json", () => {
  const code = readdirSync(new URL("../js/", import.meta.url)).map((f) => readFileSync(new URL(`../js/${f}`, import.meta.url), "utf8")).join("\n");
  const used = new Set([...code.matchAll(/tip\("(\w+)"\)/g)].map((m) => m[1]));
  assert.ok(used.size > 10);
  for (const k of used) assert.ok(guidance.tips[k], `tooltip "${k}" is missing`);
  assert.ok(guidance.compass.length >= 4);
});

test("quiz options reference real stats and paths, and goals are complete", () => {
  const quiz = readJson("quiz");
  assert.ok(quiz.questions.length >= 4);
  for (const q of quiz.questions) {
    assert.ok(q.id && q.prompt && q.options.length >= 2, `question ${q.id} is incomplete`);
    for (const o of q.options) {
      for (const k of Object.keys(o.stats || {})) assert.ok(statKeys.includes(k), `${q.id}: "${k}" is not a stat`);
      for (const k of Object.keys(o.paths || {})) assert.ok(paths[k], `${q.id}: "${k}" is not a path`);
    }
  }
  for (const g of quiz.goals) assert.ok(g.id && g.label && g.title && g.objective && g.learn, `goal ${g.id} is incomplete`);
  for (const c of quiz.certainty) assert.ok(c.pin >= 1, `certainty ${c.id} needs a pin count`);
});
