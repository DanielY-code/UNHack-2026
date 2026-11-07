// Foundation: earlier courses and objectives follow the student to every new tree.
import test from "node:test";
import assert from "node:assert/strict";
import { loadGame } from "./helpers.js";
const json = (run, code) => JSON.parse(run(`JSON.stringify(${code})`));
const setup = (run) => run(`S.progress={cs:["cs1","cs2","cs5"],law:["la1","la4"]};S.profile.subjects={Math:"A",Biology:"C","Visual Arts":"B"}`);

test("skill tags come from each objective's text", () => {
  const { run } = loadGame();
  const tags = (p, id) => json(run, `nodeSkills(allPaths().${p}.nodes.find(n=>n.id==="${id}"))`);
  assert.ok(tags("cs", "cs5").includes("math"));
  assert.ok(tags("data", "da4").includes("math"));
  assert.ok(tags("data", "da3").includes("programming"));
  assert.ok(!tags("eng", "en1").includes("law"), "Newton's laws are physics, not law");
  assert.ok(!tags("law", "la4").includes("data"), "the Charter isn't a chart");
});

test("on a new path, related earlier work glows and unrelated work stays, greyed", () => {
  const { run } = loadGame();
  setup(run);
  const F = json(run, `foundationFor("data").map(i=>[i.label,i.related])`);
  const rel = Object.fromEntries(F);
  assert.equal(rel["Discrete math"], true);
  assert.equal(rel["Think like a programmer"], true);
  assert.equal(rel["Math"], true);
  assert.equal(rel["How law works"], false, "kept, but greyed");
  assert.equal(rel["Biology"], false);
  assert.equal(F.length, 8, "nothing is dropped");
  assert.ok(F.findIndex((x) => !x[1]) > F.findIndex((x) => x[1]), "related items come first");
});

test("head starts point new steps at the earlier work that covers them", () => {
  const { run } = loadGame();
  setup(run);
  const hs = json(run, `headStart("data",allPaths().data.nodes.find(n=>n.id==="da4")).map(i=>i.label)`);
  assert.deepEqual(hs.sort(), ["Discrete math", "Math"]);
  assert.deepEqual(json(run, `headStart("cs",allPaths().cs.nodes.find(n=>n.id==="cs3"))`), [], "a path's own work isn't a head start");
});

test("a C grade still shows in the foundation but doesn't count as a head start", () => {
  const { run } = loadGame();
  run(`S.progress={};S.profile.subjects={Biology:"C"}`);
  assert.equal(json(run, `foundationFor("health").find(i=>i.label==="Biology").related`), true);
  assert.deepEqual(json(run, `headStart("health",allPaths().health.nodes.find(n=>n.id==="he1"))`), []);
});

test("the world tree draws earlier work as roots", () => {
  const { run } = loadGame();
  setup(run);
  const svg = run(`worldTreeSVG("data")`);
  assert.match(svg, /wt-root rel/);
  assert.match(svg, /wt-root dim/);
});

test("ignored phrases: data structures is programming, not statistics", () => {
  const { run } = loadGame();
  const tags = JSON.parse(run(`JSON.stringify(nodeSkills(allPaths().cs.nodes.find(n=>n.id==="cs2")))`));
  assert.ok(!tags.includes("data"), tags.join(","));
  assert.ok(tags.includes("programming"));
});
