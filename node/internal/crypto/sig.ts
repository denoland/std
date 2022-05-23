// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../../_utils.ts";

export class Sign {}

export class Verify {}

export function signOneShot(
  // deno-lint-ignore no-explicit-any
  _algorithm: any,
  // deno-lint-ignore no-explicit-any
  _data: any,
  // deno-lint-ignore no-explicit-any
  _key: any,
  // deno-lint-ignore no-explicit-any
  _callback: any
) {
  notImplemented("crypto.sign");
}

export function verifyOneShot(
  // deno-lint-ignore no-explicit-any
  _algorithm: any,
  // deno-lint-ignore no-explicit-any
  _data: any,
  // deno-lint-ignore no-explicit-any
  _key: any,
  // deno-lint-ignore no-explicit-any
  _signature: any,
  // deno-lint-ignore no-explicit-any
  _callback: any
) {
  notImplemented("crypto.verify");
}
