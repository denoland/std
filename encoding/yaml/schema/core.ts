import { Schema } from "../schema.ts";
import { json } from "./json.ts";

// Standard YAML's Core schema.
// http://www.yaml.org/spec/1.2/spec.html#id2804923
export const core = new Schema({
  include: [json]
});
