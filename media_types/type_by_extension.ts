// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { types } from "./_db.ts";

/**
 * Returns the media type associated with the file extension. Values are
 * normalized to lower case and matched irrespective of a leading `.`.
 *
 * When `extension` has no associated type, the function returns `undefined`.
 *
 * @example
 * ```ts
 * import { typeByExtension } from "@std/media-types/type-by-extension";
 *
 * typeByExtension("js"); // "application/json"
 * typeByExtension(".HTML"); // "text/html"
 * typeByExtension("foo"); // undefined
 * typeByExtension("file.json"); // undefined
 * ```
 */
export function typeByExtension(extension: string): string | undefined {
  extension = extension.startsWith(".") ? extension.slice(1) : extension;
  // @ts-ignore workaround around denoland/dnt#148
  return types.get(extension.toLowerCase());
}
