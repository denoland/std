import { Schema } from "../Schema.ts";
import { map, seq, str } from "../type/mod.ts";

// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346

export const failsafe = new Schema({
  explicit: [str, seq, map]
});
