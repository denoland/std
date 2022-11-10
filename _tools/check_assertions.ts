import { createGraph } from "https://deno.land/x/deno_graph@0.37.1/mod.ts";
import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);

const exts = [".mjs", ".js", ".ts"];
const skip = [
  /_?test/g,
];

for await (const { path } of walk(ROOT, { skip, exts })) {
  console.log(path);
}
