// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Proxy type of {@code Uint8Array<ArrayBuffer} and {@code Uint8Array} in TypeScript 5.7 and below respectively
 *
 * This type is internal utility type and should not be used directly.
 *
 * @internal @private
 */

export type Uint8Array_ = ReturnType<Uint8Array["slice"]>;
