// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { posixBasename } from "../path/_basename.ts";

/**
 * Return the last portion of a `url`.
 * Trailing `/`s are ignored, and optional suffix is removed.
 *
 * @param url - url to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */
export function basename(url: string | URL, suffix?: string) {
  url = new URL(url);
  const basename = posixBasename(url.pathname, suffix);
  return basename === "/" ? url.origin : basename;
}
