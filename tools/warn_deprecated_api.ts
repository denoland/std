// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

const ALREADY_WARNED_DEPRECATED = new Set<string>();

/**
 * Prints a warning message to the console for the given deprecated API.
 *
 * @example
 * ```ts
 * import { warnDeprecatedApi } from "https://deno.land/std@$STD_VERSION/tools/warn_deprecated_api.ts";
 *
 * // Prints "Warning Use of deprecated API `copy()`. Import from `https://deno.land/std/io/copy.ts` instead."
 * warnDeprecatedApi("copy()", "Import from `https://deno.land/std/io/copy.ts` instead.");
 * ```
 */
export function warnDeprecatedApi(
  apiName: string,
  version: string,
  message = "",
) {
  const key = apiName + message;
  if (ALREADY_WARNED_DEPRECATED.has(key)) return;
  ALREADY_WARNED_DEPRECATED.add(key);
  console.log(
    "%cWarning",
    "color: yellow;",
    `Use of deprecated API \`${apiName}\`. This API will be removed in ${version} of the Deno Standard Library. ${message}`,
  );
}
