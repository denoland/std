// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../../_utils.ts";

export function hkdf(
  _digest: string,
  // deno-lint-ignore no-explicit-any
  _ikm: any,
  // deno-lint-ignore no-explicit-any
  _salt: any,
  // deno-lint-ignore no-explicit-any
  _info: any,
  // deno-lint-ignore no-explicit-any
  _keylen: any,
  // deno-lint-ignore no-explicit-any
  _callback: any
) {
  notImplemented("crypto.hkdf");
}

export function hkdfSync(
  _digest: string,
  // deno-lint-ignore no-explicit-any
  _ikm: any,
  // deno-lint-ignore no-explicit-any
  _salt: any,
  // deno-lint-ignore no-explicit-any
  _info: any,
  // deno-lint-ignore no-explicit-any
  _keylen: any
) {
  notImplemented("crypto.hkdfSync");
}
