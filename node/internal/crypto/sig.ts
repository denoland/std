// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../../_utils.ts";
import { validateString } from "../validators.mjs";
import { Buffer } from "../../buffer.ts";

export class Sign {
  // deno-lint-ignore no-explicit-any
  constructor(algorithm: string, _options?: any) {
    validateString(algorithm, "algorithm");

    notImplemented("crypto.Sign");
  }

  // deno-lint-ignore no-explicit-any
  sign(_privateKey: any, _outputEncoding?: string): Buffer | string {
    notImplemented("crypto.Sign.prototype.sign");
  }

  // deno-lint-ignore no-explicit-any
  update(_data: any, _inputEncoding?: string) {
    notImplemented("crypto.Sign.prototype.update");
  }
}

export class Verify {
  // deno-lint-ignore no-explicit-any
  constructor(algorithm: string, _options?: any) {
    validateString(algorithm, "algorithm");

    notImplemented("crypto.Verify");
  }

  // deno-lint-ignore no-explicit-any
  update(_data: any, _inputEncoding?: string) {
    notImplemented("crypto.Sign.prototype.update");
  }

  // deno-lint-ignore no-explicit-any
  verify(_object: any, _signature: any, _signatureEncoding?: string): boolean {
    notImplemented("crypto.Sign.prototype.sign");
  }
}

export function signOneShot(
  // deno-lint-ignore no-explicit-any
  _algorithm: any,
  // deno-lint-ignore no-explicit-any
  _data: any,
  // deno-lint-ignore no-explicit-any
  _key: any,
  // deno-lint-ignore no-explicit-any
  _callback: any,
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
  _callback: any,
) {
  notImplemented("crypto.verify");
}
