// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { assertPath } from "../_common/assert_path.ts";
import { fromFileUrl } from "./from_file_url.ts";
import { normalize } from "./normalize.ts";

/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 *
 * @example Usage
 * ```ts
 * import { join } from "@std/path/posix/join";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(join("/foo", "bar", "baz/asdf", "quux", ".."), "/foo/bar/baz/asdf");
 * assertEquals(join(new URL("file:///foo"), "bar", "baz/asdf", "quux", ".."), "/foo/bar/baz/asdf");
 * ```
 *
 * @example Working with URLs
 * ```ts
 * import { join } from "@std/path/posix/join";
 * import { assertEquals } from "@std/assert";
 *
 * const url = new URL("https://deno.land");
 * url.pathname = join("std", "path", "mod.ts");
 * assertEquals(url.href, "https://deno.land/std/path/mod.ts");
 *
 * url.pathname = join("//std", "path/", "/mod.ts");
 * assertEquals(url.href, "https://deno.land/std/path/mod.ts");
 * ```
 *
 * @param path The path to join. This can be string or file URL.
 * @param paths The paths to join.
 * @returns The joined path.
 */
export function join(path?: URL | string, ...paths: string[]): string {
  if (path === undefined) return ".";
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  paths = path ? [path, ...paths] : paths;
  paths.forEach((path) => assertPath(path));
  const joined = paths.filter((path) => path.length > 0).join("/");
  return joined === "" ? "." : normalize(joined);
}
