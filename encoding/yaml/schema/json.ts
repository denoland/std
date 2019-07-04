import { Schema } from "../Schema.ts";
import { bool, float, int, nil } from "../type/mod.ts";
import { failsafe } from "./failsafe.ts";

// Standard YAML's JSON schema.
// http://www.yaml.org/spec/1.2/spec.html#id2803231
//
// NOTE: JS-YAML does not support schema-specific tag resolution restrictions.
// So, this schema is not such strict as defined in the YAML specification.
// It allows numbers in binary notaion, use `Null` and `NULL` as `null`, etc.

export const json = new Schema({
  implicit: [nil, bool, int, float],
  include: [failsafe]
});
