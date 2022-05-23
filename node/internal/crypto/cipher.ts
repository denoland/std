// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { ERR_INVALID_ARG_TYPE } from "../errors.ts";
import { validateInt32, validateObject } from "../validators.mjs";
import { Buffer } from "../../buffer.ts";
import { notImplemented } from "../../_utils.ts";

export {
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
} from "../../_crypto/crypto_browserify/public_encrypt/mod.js";

export class Cipheriv {
  // deno-lint-ignore no-explicit-any
  constructor(_cipher: string, _key: any, _iv: any, _options: any) {
    notImplemented("crypto.Cipheriv");
  }

  final(_outputEncoding?: string): Buffer | string {
    notImplemented("crypto.Cipheriv.prototype.final");
  }

  getAuthTag(): Buffer {
    notImplemented("crypto.Cipheriv.prototype.getAuthTag");
  }

  // deno-lint-ignore no-explicit-any
  setAAD(_buffer: any, _options?: any): this {
    notImplemented("crypto.Cipheriv.prototype.setAAD");
  }

  setAutoPadding(_autoPadding?: boolean): this {
    notImplemented("crypto.Cipheriv.prototype.setAutoPadding");
  }

  update(
    // deno-lint-ignore no-explicit-any
    _data: any,
    _inputEncoding?: string,
    _outputEncoding?: string,
  ): Buffer | string {
    notImplemented("crypto.Cipheriv.prototype.update");
  }
}

export class Decipheriv {
  // deno-lint-ignore no-explicit-any
  constructor(_cipher: string, _key: any, _iv: any, _options: any) {
    notImplemented("crypto.Decipheriv");
  }

  final(_outputEncoding?: string): Buffer | string {
    notImplemented("crypto.Decipheriv.prototype.final");
  }

  // deno-lint-ignore no-explicit-any
  setAAD(_buffer: any, _options?: any): this {
    notImplemented("crypto.Decipheriv.prototype.setAAD");
  }

  // deno-lint-ignore no-explicit-any
  setAuthTag(_buffer: any, _encoding?: string): this {
    notImplemented("crypto.Decipheriv.prototype.setAuthTag");
  }

  setAutoPadding(_autoPadding?: boolean): this {
    notImplemented("crypto.Decipheriv.prototype.setAutoPadding");
  }

  update(
    // deno-lint-ignore no-explicit-any
    _data: any,
    _inputEncoding?: string,
    _outputEncoding?: string,
  ): Buffer | string {
    notImplemented("crypto.Decipheriv.prototype.update");
  }
}

export function getCipherInfo(
  nameOrNid: string | number,
  options?: { keyLength?: number; ivLength?: number },
) {
  if (typeof nameOrNid !== "string" && typeof nameOrNid !== "number") {
    throw new ERR_INVALID_ARG_TYPE(
      "nameOrNid",
      ["string", "number"],
      nameOrNid,
    );
  }

  if (typeof nameOrNid === "number") {
    validateInt32(nameOrNid, "nameOrNid");
  }

  let keyLength, ivLength;

  if (options !== undefined) {
    validateObject(options, "options");

    ({ keyLength, ivLength } = options);

    if (keyLength !== undefined) {
      validateInt32(keyLength, "options.keyLength");
    }

    if (ivLength !== undefined) {
      validateInt32(ivLength, "options.ivLength");
    }
  }

  notImplemented("crypto.getCipherInfo");
}
