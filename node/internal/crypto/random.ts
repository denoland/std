// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../../_utils.ts";

export { default as randomBytes } from "./_randomBytes.ts";
export { default as randomFill, randomFillSync } from "./_randomFill.ts";
export { default as randomInt } from "./_randomInt.ts";

// deno-lint-ignore no-explicit-any
export function checkPrime(_candidate: any, _options: any, _callback: any) {
  notImplemented("crypto.checkPrime");
}

// deno-lint-ignore no-explicit-any
export function checkPrimeSync(_candidate: any, _options: any) {
  notImplemented("crypto.checkPrimeSync");
}

// deno-lint-ignore no-explicit-any
export function generatePrime(_size: any, _options: any, _callback: any) {
  notImplemented("crypto.generatePrime");
}

// deno-lint-ignore no-explicit-any
export function generatePrimeSync(_candidate: any, _options: any) {
  notImplemented("crypto.generatePrimeSync");
}

export const randomUUID = () => globalThis.crypto.randomUUID();
