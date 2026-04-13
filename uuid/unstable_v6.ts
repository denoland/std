// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { bytesToUuid } from "./_common.ts";

const UUID_REGEXP =
  /^[0-9a-f]{8}-[0-9a-f]{4}-6[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Determines whether a string is a valid
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-6 | UUIDv6}.
 *
 * @param id UUID value.
 *
 * @returns `true` if the string is a valid UUIDv6, otherwise `false`.
 *
 * @example Usage
 * ```ts
 * import { validate } from "@std/uuid/unstable-v6";
 * import { assert, assertFalse } from "@std/assert";
 *
 * assert(validate("1efed67d-d966-6490-8b9a-755015853480"));
 * assertFalse(validate("1efed67d-d966-1490-8b9a-755015853480"));
 * ```
 */
export function validate(id: string): boolean {
  return UUID_REGEXP.test(id);
}

let _lastMSecs = 0;
let _lastNSecs = 0;

/**
 * Options for {@linkcode generate}.
 */
export interface GenerateOptions {
  /**
   * An array of 6 bytes that represents the node bits for the UUID.
   *
   * If not set, a random value will be generated.
   *
   * @see {@link https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-6}
   */
  node?: number[];
  /**
   * A 14-bit value used to avoid duplicates that could arise when the clock is
   * set backwards in time or if the node ID changes (0 - 16383).
   *
   * If not set, a random value will be generated.
   *
   * @see {@link https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-6}
   */
  clockseq?: number;
  /**
   * The number of milliseconds since the Unix epoch (January 1, 1970).
   *
   * @see {@link https://www.rfc-editor.org/rfc/rfc9562.html#name-timestamp-considerations}
   */
  msecs?: number;
  /**
   * The number of nanoseconds to add to {@linkcode GenerateOptions.msecs}
   * (0 - 10,000).
   *
   * @see {@link https://www.rfc-editor.org/rfc/rfc9562.html#name-timestamp-considerations}
   */
  nsecs?: number;
  /**
   * An array of 8 random bytes (0 - 255) to be used for node and clock sequence
   * bits (unless they are set).
   */
  random?: number[];
  /**
   * A function that returns an array of 8 random bytes (0 - 255).
   * Alternative to {@linkcode GenerateOptions.random}.
   */
  rng?: () => number[];
}

/**
 * Generates a
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#name-uuid-version-6 | UUIDv6}.
 *
 * @param options Can use RFC time sequence values as overwrites.
 *
 * @returns Returns a UUIDv6 string.
 *
 * @example Usage
 * ```ts
 * import { generate, validate } from "@std/uuid/unstable-v6";
 * import { assert } from "@std/assert";
 *
 * const options = {
 *   node: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab],
 *   clockseq: 0x1234,
 *   msecs: new Date("2011-11-01").getTime(),
 *   nsecs: 5678,
 * };
 *
 * const uuid = generate(options);
 * assert(validate(uuid as string));
 * ```
 */
export function generate(options: GenerateOptions = {}): string {
  let i = 0;
  const b: number[] = [];

  let { node, clockseq } = options;

  if (node === undefined || clockseq === undefined) {
    // deno-lint-ignore no-explicit-any
    const seedBytes: any = options.random ??
      (options.rng ? options.rng() : undefined) ??
      crypto.getRandomValues(new Uint8Array(8));

    if (node === undefined) {
      node = [
        seedBytes[0],
        seedBytes[1],
        seedBytes[2],
        seedBytes[3],
        seedBytes[4],
        seedBytes[5],
      ];
    }

    if (clockseq === undefined) {
      clockseq = ((seedBytes[6] << 8) | seedBytes[7]) & 0x3fff;
    }
  }

  let { msecs = new Date().getTime(), nsecs = _lastNSecs + 1 } = options;

  const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000;

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = (clockseq + 1) & 0x3fff;
  }

  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  if (nsecs > 10000) {
    throw new Error("Cannot create more than 10M uuids/sec");
  }

  if (node.length !== 6) {
    throw new Error(
      "Cannot create UUID: the node option must be an array of 6 bytes",
    );
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;

  // We have to add this value because "msecs" here is the number of
  // milliseconds since January 1, 1970, not since October 15, 1582.
  // This is also the milliseconds from October 15, 1582 to January 1, 1970.
  msecs += 12219292800000;

  const th = ((msecs / 0x10000000) * 10000) & 0xffffffff;
  b[i++] = (th >>> 24) & 0xff;
  b[i++] = (th >>> 16) & 0xff;
  b[i++] = (th >>> 8) & 0xff;
  b[i++] = th & 0xff;

  const tml = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x10000000;
  b[i++] = (tml >>> 20) & 0xff;
  b[i++] = (tml >>> 12) & 0xff;

  b[i++] = (tml >>> 8) & 0xf | 0x60;
  b[i++] = tml & 0xff;

  b[i++] = (clockseq >>> 8) | 0x80;

  b[i++] = clockseq & 0xff;

  for (let n = 0; n < 6; ++n) {
    b[i + n] = node[n]!;
  }

  return bytesToUuid(b);
}
