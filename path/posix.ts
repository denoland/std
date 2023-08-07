// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
// This module is browser compatible.

export const sep = "/";
export const delimiter = ":";

export { posixResolve as resolve } from "./_resolve.ts";
export { posixNormalize as normalize } from "./_normalize.ts";
export { posixIsAbsolute as isAbsolute } from "./_is_absolute.ts";
export { posixJoin as join } from "./_join.ts";
export { posixRelative as relative } from "./_relative.ts";
export { posixToNamespacedPath as toNamespacedPath } from "./_to_namespaced_path.ts";
export { posixDirname as dirname } from "./_dirname.ts";
export { posixBasename as basename } from "./_basename.ts";
export { posixExtname as extname } from "./_extname.ts";
export { posixFormat as format } from "./_format.ts";
export { posixParse as parse } from "./_parse.ts";
export { posixFromFileUrl as fromFileUrl } from "./_from_file_url.ts";
export { posixToFileUrl as toFileUrl } from "./_to_file_url.ts";
