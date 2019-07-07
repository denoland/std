// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { CbFunction, load, loadAll } from "./loader/loader.ts";
import { LoaderStateOptions } from "./loader/loader_state.ts";

export type ParseOptions = LoaderStateOptions;

export function parse(content: string, options?: ParseOptions): unknown {
  return load(content, options);
}

export function parseAll(
  content: string,
  iterator?: CbFunction,
  options?: ParseOptions
): unknown {
  return loadAll(content, iterator, options);
}
