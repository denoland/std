// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { Uint8Array_ } from "./_types.ts";
export type { Uint8Array_ };
import { decodeRawBase64, encodeRawBase64 } from "./unstable_base64.ts";

const PLUS = "+".charCodeAt(0);
const MINUS = "-".charCodeAt(0);
const SLASH = "/".charCodeAt(0);
const UNDERSCORE = "_".charCodeAt(0);
const EQUALS = "=".charCodeAt(0);

export function encodeBase64Url(
  input: string | Uint8Array_ | ArrayBuffer,
): string {
  if (typeof input === "string") {
    input = new TextEncoder().encode(input) as Uint8Array_;
  } else if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  return new TextDecoder().decode(encodeRawBase64Url(input));
}

export function encodeRawBase64Url(
  input: Uint8Array_,
): Uint8Array_ {
  input = encodeRawBase64(input);
  for (let i = 0; i < input.length; ++i) {
    switch (input[i]) {
      case PLUS:
        input[i] = MINUS;
        break;
      case SLASH:
        input[i] = UNDERSCORE;
        break;
    }
  }
  const i = input.indexOf(EQUALS, input.length - 2);
  if (i > 0) return input.subarray(0, i);
  return input;
}

export function decodeBase64Url(input: string): Uint8Array_ {
  return decodeRawBase64Url(new TextEncoder()
    .encode(input) as Uint8Array_);
}

export function decodeRawBase64Url(
  input: Uint8Array_,
): Uint8Array_ {
  for (let i = 0; i < input.length; ++i) {
    switch (input[i]) {
      case PLUS:
      case SLASH:
        throw new TypeError("Invalid Character");
      case MINUS:
        input[i] = PLUS;
        break;
      case UNDERSCORE:
        input[i] = SLASH;
        break;
    }
  }
  return decodeRawBase64(input);
}
