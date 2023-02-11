import * as path from "../../path.ts";
import Module from "../../module.ts";

const modulePath = path.join(
  path.dirname(path.fromFileUrl(import.meta.url)),
  "./cjs_import",
);
Module._load(modulePath, null, true);
