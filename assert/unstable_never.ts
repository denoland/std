// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { format } from "@std/internal/format";
import { AssertionError } from "./assertion_error.ts";

/*!
 * Ported and modified from: https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/handbook-v1/Unions%20and%20Intersections.md#union-exhaustiveness-checking
 * licensed as:
 *
 * The MIT License (MIT)
 * Copyright (c) Microsoft Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Make an assertion that `x` is of type `never`.
 * If not then throw.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Exhaustivenss check
 * ```ts
 * import { assertNever } from "@std/assert/unstable-never";
 *
 * type Kinds = "A" | "B";
 *
 * function handleKind(kind: Kinds) {
 *   switch (kind) {
 *     case "A":
 *       doA();
 *       break;
 *     case "B":
 *       doB();
 *       break;
 *     default:
 *       assertNever(kind);
 *   }
 * }
 *
 * function doA() {
 *   // ...
 * }
 *
 * function doB() {
 *   // ...
 * }
 * ```
 *
 * @example Compile-time error when there is a missing case
 * ```ts expect-error ignore
 * import { assertNever } from "@std/assert/unstable-never";
 *
 * type Kinds = "A" | "B" | "C";
 *
 * function handleKind(kind: Kinds) {
 *   switch (kind) {
 *     case "A":
 *       doA();
 *       break;
 *     case "B":
 *       doB();
 *       break;
 *     default:
 *       // Type error since "C" is not handled
 *       assertNever(kind);
 *   }
 * }
 *
 * function doA() {
 *   // ...
 * }
 *
 * function doB() {
 *   // ...
 * }
 * ```
 *
 * @param x The value to be checked as never
 * @param msg The optional message to display if the assertion fails.
 * @returns Never returns, always throws.
 * @throws {AssertionError}
 */
export function assertNever(x: never, msg?: string): never {
  throw new AssertionError(
    msg ?? `Expect ${format(x)} to be of type never`,
  );
}
