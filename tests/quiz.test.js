// The onboarding quiz: path scoring and how results fill the student's journey and trees.
import test from "node:test";
import assert from "node:assert/strict";
import { loadGame } from "./helpers.js";

const draft = (over = "") => `({step:0,name:"Sam",grade:"11",interests:["Biology & the body","Helping people"],
  subjects:Object.fromEntries(Object.keys(SUBJECTS).map(k=>[k,"—"])),activities:["Volunteering"],
  answers:{saturday:3,group:3,problem:1,power:3,learn:1,matters:0},goals:["coop","network"],timeframe:"This school year",
  text:"Shadow a nurse at a hospital",certainty:"few",program:"",picks:null${over}})`;

test("answers that point to health care rank Health Sciences first, with reasons", () => {
  const { run } = loadGame();
  const r = run(`scorePaths(${draft()})`);
  assert.equal(r[0].id, "health");
  assert.ok(r[0].score > r[r.length - 1].score);
  assert.ok(r[0].why.length >= 1);
});

test("naming a program in mind boosts it", () => {
  const { run } = loadGame();
  const before = run(`scorePaths(${draft()}).find(r=>r.id==="eng").score`);
  const after = run(`scorePaths(${draft(',program:"eng"')}).find(r=>r.id==="eng").score`);
  assert.ok(after > before);
});

test("applying results replaces the example student and plants goal objectives", () => {
  const { run } = loadGame();
  run(`const D=${draft()};applyQuiz(D,["health","law","biz"])`);
  assert.equal(run("S.example"), false);
  assert.equal(run("S.onboarded"), true);
  assert.equal(run("S.profile.name"), "Sam");
  assert.deepEqual(JSON.parse(run("JSON.stringify(S.pinned)")), ["health", "law", "biz"]);
  assert.equal(run("S.major"), null, "a few ideas means no major yet");
  assert.equal(run("Object.keys(S.progress).length"), 0, "example progress is cleared");
  const healthGoals = JSON.parse(run(`JSON.stringify(allPaths().health.nodes.filter(n=>n.goal).map(n=>n.id).sort())`));
  assert.deepEqual(healthGoals, ["goal-coop-health", "goal-network-health", "goal-own-health"]);
  assert.equal(run(`allPaths().law.nodes.filter(n=>n.goal).length`), 2, "goals go into the top two paths");
  assert.equal(run(`allPaths().biz.nodes.filter(n=>n.goal).length`), 0);
  assert.equal(run(`nodeState("health",allPaths().health.nodes.find(n=>n.id==="goal-own-health"))`), "open");
});

test("quiz answers feed the starting stats", () => {
  const { run } = loadGame();
  const before = run(`baseStats(profileFromDraft(${draft(',answers:{}')})).empathy`);
  const after = run(`baseStats(profileFromDraft(${draft()})).empathy`);
  assert.ok(after > before);
});

test("retaking the quiz keeps finished goal objectives and drops unfinished ones", () => {
  const { run } = loadGame();
  run(`applyQuiz(${draft()},["health"]);S.progress.health=["he1","goal-coop-health"]`);
  run(`applyQuiz(${draft(',goals:["cert"],text:""')},["health"])`);
  const ids = JSON.parse(run(`JSON.stringify(allPaths().health.nodes.filter(n=>n.goal).map(n=>n.id).sort())`));
  assert.deepEqual(ids, ["goal-cert-health", "goal-coop-health"]);
  assert.equal(run(`S.major`), null);
  run(`applyQuiz(${draft(',certainty:"set"')},["eng","health"])`);
  assert.equal(run(`S.major`), "eng", "pretty sure makes the top pick the major");
});
