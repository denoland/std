// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { posixExtname } from "../path/_extname.ts";

/**
 * Return the extension of the `url` with leading period.
 * @param url with extension
 * @returns extension (ex. for url ending with `index.html` returns `.html`)
 */
export function extname(url: string | URL) {
  url = new URL(url);
  return posixExtname(url.pathname);
}
