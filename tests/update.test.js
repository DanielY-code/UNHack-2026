// "Something changed?" path updates: the offline reader, cleaning AI output, and applying an update.
import test from "node:test";
import assert from "node:assert/strict";
import { loadGame } from "./helpers.js";

const EXAMPLE = "I failed my Computer Science Course, and I realised I do not enjoy problem solving, I like constructing models what do you think I could try out";
const json = (run, code) => JSON.parse(run(`JSON.stringify(${code})`));

test("the offline reader understands the example: pause CS, try Engineering, grow Architecture", () => {
  const { run } = loadGame();
  run(`S.pinned=["cs","data"];S.major="cs"`);
  const U = json(run, `heuristicUpdate(${JSON.stringify(EXAMPLE)})`);
  assert.deepEqual(U.pause.map((x) => x.id), ["cs"]);
  assert.equal(U.add[0].id, "eng");
  assert.ok(U.grow.some((g) => g.name === "Architecture"));
  assert.ok(U.signals.more.includes("craft"));
  assert.ok(U.signals.less.includes("logic"));
  assert.equal(U.firstStep.pathId, "eng");
  assert.match(U.summary, /not a failure/);
});

test("AI suggestions are limited to real paths and the student's own journey", () => {
  const { run } = loadGame();
  run(`S.pinned=["cs"]`);
  const U = json(run, `sanitizeUpdate({summary:"Hi",signals:{more:["craft","magic"]},
    pause:[{id:"cs",note:"ok"},{id:"health",note:"not on journey"}],keep:[{id:"made-up"}],
    add:[{id:"eng",why:"models"},{id:"cs",why:"already pinned"},{id:"nope"}],
    grow:[{name:"Architecture",why:"x"},{name:"Engineering",why:"exists"}],firstStep:{pathId:"nope",objective:"x"}})`);
  assert.deepEqual(U.pause.map((x) => x.id), ["cs"]);
  assert.deepEqual(U.add.map((x) => x.id), ["eng"]);
  assert.deepEqual(U.keep, []);
  assert.deepEqual(U.grow.map((g) => g.name), ["Architecture"]);
  assert.deepEqual(U.signals.more, ["craft"]);
  assert.equal(U.firstStep, null);
});

test("applying an update pauses without losing progress and plants a first step", () => {
  const { run } = loadGame();
  run(`S.pinned=["cs","data"];S.major="cs";S.progress={cs:["cs1","cs2"]}`);
  run(`const U=heuristicUpdate(${JSON.stringify(EXAMPLE)});applyUpdate(U,${JSON.stringify(EXAMPLE)},{add:U.add.map(x=>x.id),pause:U.pause.map(x=>x.id),grow:[],firstStep:true})`);
  const pinned = json(run, "S.pinned");
  assert.ok(!pinned.includes("cs") && pinned.includes("eng"));
  assert.deepEqual(json(run, "S.paused"), ["cs"]);
  assert.deepEqual(json(run, "S.progress.cs"), ["cs1", "cs2"], "progress is kept");
  assert.equal(run("S.major"), null, "a paused major is cleared");
  assert.equal(run("S.pathNotes.eng.tag"), "new");
  const step = json(run, "S.updates[0].step");
  assert.equal(step.pid, "eng");
  assert.equal(run(`nodeState("eng",allPaths().eng.nodes.find(n=>n.id==="${step.id}"))`), "open");
  assert.equal(run("S.path"), "eng");
});

test("adding a paused path back resumes it", () => {
  const { run } = loadGame();
  run(`S.pinned=["eng"];S.paused=["cs"]`);
  run(`applyUpdate({summary:"",signals:{more:[],less:[]},keep:[],pause:[],add:[{id:"cs",why:"back"}],grow:[],firstStep:null},"I miss coding",{add:["cs"],pause:[],grow:[],firstStep:false})`);
  assert.deepEqual(json(run, "S.paused"), []);
  assert.ok(json(run, "S.pinned").includes("cs"));
});
