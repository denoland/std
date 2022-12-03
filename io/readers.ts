// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Based on https://github.com/golang/go/blob/0452f9460f50f0f0aba18df43dc2b31906fb66cc/src/io/io.go
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

import { StringReader as _StringReader } from "./string_reader.ts";
import { MultiReader as _MultiReader } from "./multi_reader.ts";
import { LimitedReader as _LimitedReader } from "./limited_reader.ts";

/**
 * @deprecated (will be removed after 0.170.0) Import from `std/io/string_reader.ts` instead
 *
 * Reader utility for strings.
 *
 * @example
 * ```ts
 * import { StringReader } from "https://deno.land/std@$STD_VERSION/io/mod.ts";
 *
 * const data = new Uint8Array(6);
 * const r = new StringReader("abcdef");
 * const res0 = await r.read(data);
 * const res1 = await r.read(new Uint8Array(6));
 *
 * // Number of bytes read
 * console.log(res0); // 6
 * console.log(res1); // null, no byte left to read. EOL
 *
 * // text
 *
 * console.log(new TextDecoder().decode(data)); // abcdef
 * ```
 *
 * **Output:**
 *
 * ```text
 * 6
 * null
 * abcdef
 * ```
 */
export const StringReader = _StringReader;

/**
 * @deprecated (will be removed after 0.170.0) Import from `std/io/multi_reader.ts` instead
 *
 * Reader utility for combining multiple readers
 */
export const MultiReader = _MultiReader;

/**
 * @deprecated (will be removed after 0.170.0) Import from `std/io/limited_reader.ts` instead
 *
 * A `LimitedReader` reads from `reader` but limits the amount of data returned to just `limit` bytes.
 * Each call to `read` updates `limit` to reflect the new amount remaining.
 * `read` returns `null` when `limit` <= `0` or
 * when the underlying `reader` returns `null`.
 */
export const LimitedReader = _LimitedReader;
