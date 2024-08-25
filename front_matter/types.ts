// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Return type for {@linkcode extract} function. */
export type Extract<
  T extends unknown[] | Record<string, unknown> | string | null,
> = {
  frontMatter: string;
  body: string;
  attrs: T;
};
