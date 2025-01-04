// Copyright 2018-2025 the Deno authors. MIT license.

/** Return type for {@linkcode extract} function. */
export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};
