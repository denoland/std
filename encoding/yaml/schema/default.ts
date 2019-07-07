import { Schema } from "../schema.ts";
import { binary, merge, omap, pairs, set, timestamp } from "../type/mod.ts";
import { core } from "./core.ts";

// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
export const def = new Schema({
  explicit: [binary, omap, pairs, set],
  implicit: [timestamp, merge],
  include: [core]
});
