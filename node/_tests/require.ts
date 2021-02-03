import { createRequire } from "../module.ts";
import { isAbsolute } from "../../path/mod.ts";

const file = Deno.args[0];
if (!file) {
  throw new Error("No file provided");
} else if (!isAbsolute(file)) {
  throw new Error("Path for file must be absolute");
}

const require = createRequire(file);
try {
  require(file);
} catch (e) {
  throw e;
}
