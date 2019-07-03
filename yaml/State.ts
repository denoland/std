import { SchemaDefinition } from "./Schema.ts";
import { DEFAULT_FULL_SCHEMA } from "./schema/mod.ts";

export abstract class State {
  constructor(public schema: SchemaDefinition = DEFAULT_FULL_SCHEMA) {}
}
