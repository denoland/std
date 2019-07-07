import { Schema } from "../schema.ts";
import { bool, float, int, nil } from "../type/mod.ts";
import { failsafe } from "./failsafe.ts";

// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
export const json = new Schema({
  implicit: [nil, bool, int, float],
  include: [failsafe]
});
