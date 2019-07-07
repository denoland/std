// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { CbFunction, safeLoad, safeLoadAll } from "./loader/loader.ts";
import { LoaderStateOptions } from "./loader/LoaderState.ts";

export type ParseOptions = LoaderStateOptions;

export function parse(content: string, options?: ParseOptions): unknown {
  return safeLoad(content, options);
}

export function parseAll(
  content: string,
  iterator?: CbFunction,
  options?: ParseOptions
): unknown {
  return safeLoadAll(content, iterator, options);
}
