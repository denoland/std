// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { posixDirname } from "../path/_dirname.ts";

/**
 * Return the directory path of a `url`.
 * @param url - url to extract the directory from.
 */
export function dirname(url: string | URL) {
  url = new URL(url);
  url.pathname = posixDirname(url.pathname);
  url.search = "";
  url.hash = "";
  return url;
}
