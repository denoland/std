import * as Deno from "deno";
import { fileServer } from "../http/file_server.ts";
import { parse } from "../flags/mod.ts";
import { join } from "../fs/path.ts";

const serverArgs = parse(Deno.args);

let dir = Deno.cwd();
const target = serverArgs._[1];
if (target) {
  dir = join(dir, target);
}

const CORSEnabled = serverArgs.cors || false;
const port = serverArgs.port || serverArgs.p || 4500;

fileServer({ port, dir, CORSEnabled });
