import cp from "../child_process.ts";
import * as path from "../path.ts";

const script = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "infinite_loop.js",
);
const childProcess = cp.spawn(Deno.execPath(), ["run", script]);
childProcess.unref();
