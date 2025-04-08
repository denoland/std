// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Proxy type of {@code Uint8Array<ArrayBuffer} or {@code Uint8Array} in TypeScript 5.7 or below respectively.
 *
 * This type is internal utility type and should not be used directly.
 *
 * @internal @private
 */

// deno-lint-ignore deno-style-guide/naming-convention
export type Uint8Array_ = ReturnType<Uint8Array["slice"]>;
