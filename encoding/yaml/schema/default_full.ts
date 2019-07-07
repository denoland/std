import { Schema } from "../Schema.ts";
import { defaultSafe } from "./default_safe.ts";

// JS-YAML's default schema for `load` function.
// It is not described in the YAML specification.
//
// This schema is based on JS-YAML's default safe schema and includes
// JavaScript-specific types: !!js/undefined, !!js/regexp and !!js/function.
//
// Also this schema is used as default base schema at `Schema.create` function.

export const defaultFull = (Schema.SCHEMA_DEFAULT = new Schema({
  include: [defaultSafe]
  /* TODO: JS */
  //   explicit: [
  //     require('../type/js/undefined'),
  //     require('../type/js/regexp'),
  //     require('../type/js/function')
  //   ]
}));
