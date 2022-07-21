import CP from "../child_process.ts";
import * as path from "../../path/mod.ts";

const script = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "./infinite_loop.js",
);
const childProcess = CP.spawn(Deno.execPath(), ["run", script]);
childProcess.unref();
