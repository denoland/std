// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { posixJoin } from "../path/_join.ts";

/**
 * Join all given a sequence of a `url` and `paths`, then normalizes the resulting url.
 * @param url to be joined with the paths and normalized
 * @param paths to be joined
 */
export function join(url: string | URL, ...paths: string[]) {
  url = new URL(url);
  url.pathname = posixJoin(url.pathname, ...paths);
  return url;
}
