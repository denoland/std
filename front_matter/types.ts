// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Return type for {@linkcode extract} function. */
export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};
