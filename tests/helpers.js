// Loads the browser scripts into a Node sandbox so game rules can be tested without a browser.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
export const readJson = (name) => JSON.parse(readFileSync(new URL(`data/${name}.json`, root), "utf8"));
export const content = () => ({
  catalog: readJson("catalog"), paths: readJson("paths"), shop: readJson("shop"),
  guidance: readJson("guidance"), prompts: readJson("prompts"), quiz: readJson("quiz"), destinations: readJson("destinations"),
});

export function loadGame({ hostname = "edventure.example", hash = "" } = {}) {
  const store = new Map();
  const ctx = vm.createContext({
    console,
    location: { hostname, hash },
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    document: { getElementById: () => null },
    window: {},
  });
  for (const f of ["content", "game", "views", "quiz", "update", "world", "destination", "foundation"]) {
    vm.runInContext(readFileSync(new URL(`js/${f}.js`, root), "utf8"), ctx, { filename: `js/${f}.js` });
  }
  vm.runInContext("applyContent(__content); initState();", Object.assign(ctx, { __content: content() }));
  return { ctx, run: (code) => vm.runInContext(code, ctx), store };
}
