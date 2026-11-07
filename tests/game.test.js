// Game rules: unlocking, mastery → crossover, stats, minors, and test-mode gating.
import test from "node:test";
import assert from "node:assert/strict";
import { loadGame } from "./helpers.js";

test("a fresh game starts from the example student with no test treasure in production", () => {
  const { run } = loadGame();
  assert.equal(run("S.gems"), 50);
  assert.equal(run("TEST_MODE"), false);
});

test("test mode grants treasure once on localhost or with #test", () => {
  assert.equal(loadGame({ hostname: "localhost" }).run("S.gems"), 25050);
  assert.equal(loadGame({ hash: "#test" }).run("S.gems"), 25050);
});

test("a node unlocks only when its prerequisites are done", () => {
  const { run } = loadGame();
  run(`S.progress={}`);
  assert.equal(run(`nodeState("cs",allPaths().cs.nodes.find(n=>n.id==="cs1"))`), "open");
  assert.equal(run(`nodeState("cs",allPaths().cs.nodes.find(n=>n.id==="cs2"))`), "locked");
  run(`S.progress.cs=["cs1"]`);
  assert.equal(run(`nodeState("cs",allPaths().cs.nodes.find(n=>n.id==="cs2"))`), "open");
});

test("mastery takes three stages and only then opens the crossover", () => {
  const { run } = loadGame();
  run(`S.progress.eng=["en1","en2","en4"];S.mastery["eng:en4"]=1`);
  const state = (id) => run(`nodeState("eng",allPaths().eng.nodes.find(n=>n.id==="${id}"))`);
  assert.equal(state("en4"), "mastering");
  assert.equal(state("en4-x"), "locked");
  run(`S.mastery["eng:en4"]=3`);
  assert.equal(state("en4"), "done");
  assert.equal(state("en4-x"), "open");
  assert.equal(run(`allPaths().eng.nodes.find(n=>n.id==="en4-x").branch`), "law");
});

test("later mastery stages pay more and count stats again", () => {
  const { run } = loadGame();
  const n = `allPaths().eng.nodes.find(n=>n.id==="en4")`;
  assert.deepEqual([1, 2, 3].map((s) => run(`stageGems(${n},${s})`)), [40, 60, 80]);
  run(`S.progress={eng:["en1","en2","en4"]};S.mastery={"eng:en4":1}`);
  const once = run(`earnedStats().craft`);
  run(`S.mastery["eng:en4"]=3`);
  assert.ok(run(`earnedStats().craft`) > once);
});

test("stats stay within 0-99 and match % is a percentage", () => {
  const { run } = loadGame();
  run(`S.profile.interests=Object.keys(INTERESTS);S.profile.activities=Object.keys(ACTIVITIES);for(const k in S.profile.subjects)S.profile.subjects[k]="A"`);
  const t = run(`totalStats().t`);
  for (const v of Object.values(t)) assert.ok(v >= 0 && v <= 99);
  const f = run(`fit(allPaths().cs,totalStats().t)`);
  assert.ok(f >= 0 && f <= 100);
});

test("every tree renders without errors", () => {
  const { run } = loadGame();
  for (const id of run(`Object.keys(allPaths())`)) {
    const svg = run(`nodeGfx(0,0,27,"${id}",allPaths()["${id}"].nodes[0],true).html`);
    assert.match(svg, /class="core"/);
  }
});

test("steps have a suggested order, not locks: any step can be started early, except crossovers", () => {
  const { run } = loadGame();
  run(`S.progress={}`);
  const st = (id) => run(`nodeState("cs",allPaths().cs.nodes.find(n=>n.id==="${id}"))`);
  assert.equal(st("cs6"), "locked");
  run(`S.early={"cs:cs6":true}`);
  assert.equal(st("cs6"), "open");
  run(`S.early["eng:en4-x"]=true`);
  assert.equal(run(`nodeState("eng",allPaths().eng.nodes.find(n=>n.id==="en4-x"))`), "locked", "crossovers still need mastery");
  assert.equal(run(`statusLabel("cs",allPaths().cs.nodes[1],"locked")`), "Later");
});

test("stages are phases, not school years", () => {
  const { run } = loadGame();
  const tiers = JSON.parse(run("JSON.stringify(TIERS)"));
  assert.ok(!tiers.some((t) => /gr(ade)?\s*\d/i.test(t)), tiers.join(", "));
});
