// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.

export const sep = "\\";
export const delimiter = ";";

export { windowsResolve as resolve } from "./_resolve.ts";
export { windowsNormalize as normalize } from "./_normalize.ts";
export { windowsIsAbsolute as isAbsolute } from "./_is_absolute.ts";
export { windowsJoin as join } from "./_join.ts";
export { windowsRelative as relative } from "./_relative.ts";
export { windowsToNamespacedPath as toNamespacedPath } from "./_to_namespaced_path.ts";
export { windowsDirname as dirname } from "./_dirname.ts";
export { windowsBasename as basename } from "./_basename.ts";
export { windowsExtname as extname } from "./_extname.ts";
export { windowsFormat as format } from "./_format.ts";
export { windowsParse as parse } from "./_parse.ts";
export { windowsFromFileUrl as fromFileUrl } from "./_from_file_url.ts";
export { windowsToFileUrl as toFileUrl } from "./_to_file_url.ts";
