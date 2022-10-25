// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  createExtractor,
  Format,
  Parser,
  recognize as _recognize,
  test as _test,
} from "./mod.ts";
import { parse } from "../yaml.ts";
export { Format } from "./mod.ts";

export function test(str: string): boolean {
  return _test(str, [Format.YAML]);
}

export function recognize(str: string): Format {
  return _recognize(str, [Format.YAML]);
}

export const extract = createExtractor({ [Format.YAML]: parse as Parser });
export default extract;
