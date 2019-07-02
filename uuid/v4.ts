import { NIL_UUID } from "./mod.ts";

// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
/**
 * Super-small uuid generation.
 *
 * Based on
 *  https://gist.github.com/jed/982883
 */

const UUID_RE = new RegExp(
  "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
  "i"
);

export function validate(id: string): boolean {
  return UUID_RE.test(id);
}

export default function generate(): string {
  // Generate 16 random bytes
  // adjust 4 msb of 7th byte to 0100
  // set 2 msb of 9th byte to 10
  return "00000000-0000-4000-8000-000000000000".replace(
    /[0]/g,
    (): string =>
      // random integer from 0 to 15 as a hex digit.
      (crypto.getRandomValues(new Uint8Array(1))[0] % 16).toString(16)
  );
}
