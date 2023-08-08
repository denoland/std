// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { posixNormalize } from "../path/_normalize.ts";

/**
 * Normalize the `url`, resolving mutiple `'/'`s into `'//'` after protocol and remaining into `'/'`.
 * @param path to be normalized
 */
export function normalize(url: string | URL) {
  url = new URL(url);
  url.pathname = posixNormalize(url.pathname);
  return url;
}
