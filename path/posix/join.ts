// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { normalize } from "./normalize.ts";

/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */
export function join(...paths: string[]): string {
  if (paths.length === 0) return ".";

  let joined: string | undefined;
  for (let i = 0, len = paths.length; i < len; ++i) {
    const path = paths[i];
    if (path.length > 0) {
      if (!joined) joined = path;
      else joined += `/${path}`;
    }
  }
  if (!joined) return ".";
  return normalize(joined);
}
