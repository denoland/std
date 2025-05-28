// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { assertArg } from "../_common/dirname.ts";
import { stripTrailingSeparators } from "../_common/strip_trailing_separators.ts";
import { isPosixPathSeparator } from "./_util.ts";
import { fromFileUrl } from "./from_file_url.ts";

/**
 * Return the directory path of a `path`.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/path/posix/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(dirname("/home/user/Documents/"), "/home/user");
 * assertEquals(dirname("/home/user/Documents/image.png"), "/home/user/Documents");
 * assertEquals(dirname("https://deno.land/std/path/mod.ts"), "https://deno.land/std/path");
 * assertEquals(dirname(new URL("file:///home/user/Documents/image.png")), "/home/user/Documents");
 * ```
 *
 * @example Working with URLs
 *
 * ```ts
 * import { dirname } from "@std/path/posix/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(dirname("https://deno.land/std/path/mod.ts"), "https://deno.land/std/path");
 * assertEquals(dirname("https://deno.land/std/path/mod.ts?a=b"), "https://deno.land/std/path");
 * assertEquals(dirname("https://deno.land/std/path/mod.ts#header"), "https://deno.land/std/path");
 * ```
 *
 * @param path The path to get the directory from.
 * @returns The directory path.
 */
export function dirname(path: string | URL): string {
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  assertArg(path);

  let end = -1;
  let matchedNonSeparator = false;

  for (let i = path.length - 1; i >= 1; --i) {
    if (isPosixPathSeparator(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        end = i;
        break;
      }
    } else {
      matchedNonSeparator = true;
    }
  }

  // No matches. Fallback based on provided path:
  //
  // - leading slashes paths
  //     "/foo" => "/"
  //     "///foo" => "/"
  // - no slash path
  //     "foo" => "."
  if (end === -1) {
    return isPosixPathSeparator(path.charCodeAt(0)) ? "/" : ".";
  }

  return stripTrailingSeparators(
    path.slice(0, end),
    isPosixPathSeparator,
  );
}
