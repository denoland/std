// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { normalize } from "./normalize.ts";

/**
 * Join all given a sequence of a `url` and `paths`,then normalizes the resulting url.
 * @param url to be joined with the paths and normalized
 * @param paths to be joined
 */
export function join(url: string | URL, ...paths: string[]) {
  return normalize(url.toString() + "/" + paths.join("/"));
}
