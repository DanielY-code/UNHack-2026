// Destinations: backup routes after a roadblock, new goals from a path, and starting a new program.
import test from "node:test";
import assert from "node:assert/strict";
import { loadGame } from "./helpers.js";
const json = (run, code) => JSON.parse(run(`JSON.stringify(${code})`));

test("from Computer Science you can aim for Software Developer, Cybersecurity Analyst and more", () => {
  const { run } = loadGame();
  const goals = json(run, `destinationsFrom("cs").map(x=>x.dest.id+":"+(x.route.via||"-"))`);
  assert.ok(goals.includes("software-dev:-"));
  assert.ok(goals.includes("cyber-analyst:cyber"), "via the Cybersecurity branch");
});

test("a roadblock offers other routes to the same goal, best matches first", () => {
  const { run } = loadGame();
  run(`applyDestination("software-dev","main",{mode:"new"})`);
  const ids = json(run, `alternateRoutes(["grades","admission"]).map(r=>r.id)`);
  assert.equal(ids[0], "college", "the college route helps with grades and admission");
  assert.ok(!ids.includes("main"));
});

test("taking a step route builds a real path with chained steps and keeps the old program as a minor", () => {
  const { run } = loadGame();
  run(`S.progress={cs:["cs1","cs2"]};applyDestination("software-dev","main",{mode:"new"})`);
  run(`applyDestination("software-dev","college",{mode:"roadblock",keepOld:true})`);
  const pid = "route-software-dev-college";
  assert.equal(run("S.major"), pid);
  assert.ok(json(run, "S.minors").includes("cs"));
  assert.deepEqual(json(run, "S.progress.cs"), ["cs1", "cs2"], "progress is kept");
  const nodes = json(run, `allPaths()["${pid}"].nodes.map(n=>[n.id,n.req])`);
  assert.equal(nodes.length, 4);
  assert.deepEqual(nodes[1][1], [nodes[0][0]]);
  assert.equal(run(`nodeState("${pid}",allPaths()["${pid}"].nodes[0])`), "open");
  assert.equal(json(run, "currentDest().dest.id"), "software-dev");
});

test("a new goal from the same path keeps the path and major", () => {
  const { run } = loadGame();
  run(`applyDestination("software-dev","main",{mode:"new"})`);
  run(`applyDestination("cyber-analyst","cs",{mode:"goal"})`);
  assert.equal(run("S.major"), "cs");
  assert.equal(run("currentDest().pid"), "cs");
  assert.equal(run("currentDest().route.via"), "cyber");
  assert.match(run(`worldTreeSVG("cs")`), /Toward your goal/);
});

test("starting a new program (agriculture to political science) can pause the old one", () => {
  const { run } = loadGame();
  run(`applyDestination("agronomist","main",{mode:"new"});S.progress.ag=["ag1"]`);
  run(`applyDestination("policy-analyst","main",{mode:"new",keepOld:false})`);
  assert.equal(run("S.major"), "law");
  assert.ok(json(run, "S.paused").includes("ag"));
  assert.ok(!json(run, "S.pinned").includes("ag"));
  assert.deepEqual(json(run, "S.progress.ag"), ["ag1"]);
  assert.match(run(`worldTreeSVG("law")`), /◎ Policy Analyst/);
});

test("agriculture can also reach political science through its policy crossover", () => {
  const { run } = loadGame();
  const viaAg = json(run, `destById("policy-analyst").routes.find(r=>r.path==="ag")`);
  assert.equal(viaAg.via, "law");
  assert.ok(json(run, `branchesOf("ag")`).some((b) => b.to === "law" && b.kind === "cross"));
});
