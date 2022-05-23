// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../../_utils.ts";

export class DiffieHellman {}

export class DiffieHellmanGroup {}

export class ECDH {}

// deno-lint-ignore no-explicit-any
export function diffieHellman(_options: any) {
  notImplemented("crypto.diffieHellman");
}
