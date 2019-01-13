import { args } from "deno";
import { runTests, cancelTests, setFilter } from "./mod.ts";
import { parse } from "../flags/mod.ts";
import { resolve } from "../fs/path.ts";

cancelTests();

const a = parse(args);
const filter = a.grep || ".*";
// TODO support globs and recursive.
const test_files = a._.slice(1).map(p => resolve(p));

setFilter(filter);

(async () => {
  for (let fn of test_files) {
    await import(fn);
  }
  await runTests();
})();
