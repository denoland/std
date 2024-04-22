// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/** Utility functions for media types (MIME types).
 *
 * This API is inspired by the GoLang {@linkcode https://pkg.go.dev/mime | mime} package
 * and {@link https://github.com/jshttp/mime-types | jshttp/mime-types}, and is
 * designed to integrate and improve the APIs from
 * {@link https://deno.land/x/media_types | x/media_types}.
 *
 * The `vendor` folder contains copy of the
 * {@link https://github.com/jshttp/mime-types | jshttp/mime-db} `db.json` file along
 * with its license.
 *
 * ```ts
 * import { extensionsByType } from "https://deno.land/std@$STD_VERSION/media_types/extensions_by_type.ts";
 *
 * extensionsByType("application/json"); // ["json", "map"]
 * extensionsByType("text/html; charset=UTF-8"); // ["html", "htm", "shtml"]
 * extensionsByType("application/foo"); // undefined
 * ```
 *
 * @module
 */

export * from "./content_type.ts";
export * from "./extension.ts";
export * from "./extensions_by_type.ts";
export * from "./format_media_type.ts";
export * from "./get_charset.ts";
export * from "./parse_media_type.ts";
export * from "./type_by_extension.ts";
