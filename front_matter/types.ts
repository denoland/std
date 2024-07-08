// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/** Return type for functions of the {@linkcode Extractor} type. */
export type Extract<T> = {
  frontMatter: string;
  body: string;
  attrs: T;
};
