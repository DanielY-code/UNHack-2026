// World tree: a single path's trunk and the branches it can grow.
import test from "node:test";
import assert from "node:assert/strict";
import { loadGame } from "./helpers.js";
const json = (run, code) => JSON.parse(run(`JSON.stringify(${code})`));

test("Computer Science branches to Cybersecurity and Data Science, plus a mastery crossover", () => {
  const { run } = loadGame();
  const br = json(run, `branchesOf("cs")`);
  const by = Object.fromEntries(br.map((b) => [b.to, b]));
  assert.equal(by.cyber.kind, "branch");
  assert.equal(by.data.kind, "branch");
  assert.equal(by.biz.kind, "cross");
  assert.match(by.biz.how, /^Master Ship a real app/);
  assert.ok(br.filter((b) => b.kind === "related").length <= 2);
  assert.ok(!br.some((b) => b.to === "cs"), "a path never branches to itself");
});

test("branch state follows the student's progress", () => {
  const { run } = loadGame();
  run(`S.progress.cs=["cs1","cs2"]`);
  assert.equal(json(run, `branchesOf("cs")`).find((b) => b.to === "cyber").state, "locked");
  run(`S.progress.cs.push("cs5")`);
  assert.equal(json(run, `branchesOf("cs")`).find((b) => b.to === "cyber").state, "open");
});

test("the trunk has one milestone per stage with done counts", () => {
  const { run } = loadGame();
  run(`S.progress.cs=["cs1","cs2"]`);
  const trunk = json(run, `trunkOf("cs")`);
  assert.deepEqual(trunk.map((m) => m.tier), [0, 1, 2, 3]);
  assert.deepEqual(trunk.slice(0, 2).map((m) => [m.done, m.total]), [[1, 1], [1, 2]]);
});

test("every path draws a tree", () => {
  const { run } = loadGame();
  for (const id of json(run, `Object.keys(allPaths())`)) assert.match(run(`worldTreeSVG("${id}")`), /wt-stone/);
});
