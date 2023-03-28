// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import * as path from "../path/mod.ts";

/**
 * Checks if two strings or URLs resolve to the same path.
 *
 * @example
 * ```ts
 * import { isSamePath } from "https://deno.land/std@$STD_VERSION/fs/move.ts";
 *
 * const path1 = "/home/example/file.txt"
 * const path2 = new URL("file:///home/example/file.txt")
 *
 * isSamePath(path1, path2) // returns Promise<boolean>
 * ```
 */
export function isSamePath(
  path1: string | URL,
  path2: string | URL,
): boolean {
  const paths = [String(path1), String(path2)];

  // Convert every path to a normalized string for comparison
  paths.forEach((pathString, index) => {
    if (pathString.startsWith("file://")) {
      paths[index] = path.fromFileUrl(pathString);
    }

    paths[index] = path.resolve(paths[index]);
  });

  return paths[0] === paths[1];
}
