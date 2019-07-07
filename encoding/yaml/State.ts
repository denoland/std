import { SchemaDefinition } from "./schema.ts";
import { DEFAULT_SCHEMA } from "./schema/mod.ts";

export abstract class State {
  constructor(public schema: SchemaDefinition = DEFAULT_SCHEMA) {}
}
