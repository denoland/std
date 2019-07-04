import { Schema } from "../Schema.ts";
import { binary, merge, omap, pairs, set, timestamp } from "../type/mod.ts";
import { core } from "./core.ts";

// JS-YAML's default schema for `safeLoad` function.
// It is not described in the YAML specification.
//
// This schema is based on standard YAML's Core schema and includes most of
// extra types described at YAML tag repository. (http://yaml.org/type/)

export const default_safe = new Schema({
  explicit: [binary, omap, pairs, set],
  implicit: [timestamp, merge],
  include: [core]
});
