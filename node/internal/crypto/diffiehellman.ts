// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { notImplemented } from "../../_utils.ts";
import { isAnyArrayBuffer, isArrayBufferView } from "../util/types.ts";
import { ERR_INVALID_ARG_TYPE } from "../errors.ts";
import { validateInt32, validateString } from "../validators.mjs";
import { Buffer } from "../../buffer.ts";
import { getDefaultEncoding, toBuf } from "./util.ts";

const DH_GENERATOR = 2;

export class DiffieHellman {
  verifyError!: number;

  constructor(
    // deno-lint-ignore no-explicit-any
    sizeOrKey: any,
    // deno-lint-ignore no-explicit-any
    keyEncoding: any,
    // deno-lint-ignore no-explicit-any
    generator: any,
    // deno-lint-ignore no-explicit-any
    genEncoding: any,
  ) {
    if (
      typeof sizeOrKey !== "number" &&
      typeof sizeOrKey !== "string" &&
      !isArrayBufferView(sizeOrKey) &&
      !isAnyArrayBuffer(sizeOrKey)
    ) {
      throw new ERR_INVALID_ARG_TYPE(
        "sizeOrKey",
        ["number", "string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
        sizeOrKey,
      );
    }

    // Sizes < 0 don't make sense but they _are_ accepted (and subsequently
    // rejected with ERR_OSSL_BN_BITS_TOO_SMALL) by OpenSSL. The glue code
    // in node_crypto.cc accepts values that are IsInt32() for that reason
    // and that's why we do that here too.
    if (typeof sizeOrKey === "number") {
      validateInt32(sizeOrKey, "sizeOrKey");
    }

    if (
      keyEncoding &&
      !Buffer.isEncoding(keyEncoding) &&
      keyEncoding !== "buffer"
    ) {
      genEncoding = generator;
      generator = keyEncoding;
      keyEncoding = false;
    }

    const encoding = getDefaultEncoding();
    keyEncoding = keyEncoding || encoding;
    genEncoding = genEncoding || encoding;

    if (typeof sizeOrKey !== "number") {
      sizeOrKey = toBuf(sizeOrKey, keyEncoding);
    }

    if (!generator) {
      generator = DH_GENERATOR;
    } else if (typeof generator === "number") {
      validateInt32(generator, "generator");
    } else if (typeof generator === "string") {
      generator = toBuf(generator, genEncoding);
    } else if (!isArrayBufferView(generator) && !isAnyArrayBuffer(generator)) {
      throw new ERR_INVALID_ARG_TYPE(
        "generator",
        ["number", "string", "ArrayBuffer", "Buffer", "TypedArray", "DataView"],
        generator,
      );
    }

    notImplemented("crypto.DiffieHellman");
  }

  computeSecret(
    // deno-lint-ignore no-explicit-any
    _otherPublicKey: any,
    _inputEncoding: string,
    _outputEncoding: string,
  ) {
    notImplemented("crypto.DiffieHellman.prototype.computeSecret");
  }

  generateKeys(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.generateKeys");
  }

  getGenerator(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getGenerator");
  }

  getPrime(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getPrime");
  }

  getPrivateKey(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getPrivateKey");
  }

  getPublicKey(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getPublicKey");
  }

  // deno-lint-ignore no-explicit-any
  setPrivateKey(_privateKey: any, _encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.setPrivateKey");
  }

  // deno-lint-ignore no-explicit-any
  setPublicKey(_publicKey: any, _encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.setPublicKey");
  }
}

export class DiffieHellmanGroup {
  verifyError!: number;

  constructor(_name: string) {
    notImplemented("crypto.DiffieHellmanGroup");
  }

  computeSecret(
    // deno-lint-ignore no-explicit-any
    _otherPublicKey: any,
    _inputEncoding: string,
    _outputEncoding: string,
  ) {
    notImplemented("crypto.DiffieHellman.prototype.computeSecret");
  }

  generateKeys(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.generateKeys");
  }

  getGenerator(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getGenerator");
  }

  getPrime(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getPrime");
  }

  getPrivateKey(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getPrivateKey");
  }

  getPublicKey(_encoding: string) {
    notImplemented("crypto.DiffieHellman.prototype.getPublicKey");
  }
}

export class ECDH {
  constructor(curve: string) {
    validateString(curve, "curve");

    notImplemented("crypto.ECDH");
  }

  convertKey(
    // deno-lint-ignore no-explicit-any
    _key: any,
    _curve: string,
    _inputEncoding: string,
    _outputEncoding: string,
    _format: string,
  ): Buffer | string {
    notImplemented("crypto.ECDH.prototype.convertKey");
  }

  computeSecret(
    // deno-lint-ignore no-explicit-any
    _otherPublicKey: any,
    _inputEncoding: string,
    _outputEncoding: string,
  ): Buffer | string {
    notImplemented("crypto.ECDH.prototype.computeSecret");
  }

  generateKeys(_encoding: string, _format: string): Buffer | string {
    notImplemented("crypto.ECDH.prototype.generateKeys");
  }

  getPrivateKey(_encoding: string): Buffer | string {
    notImplemented("crypto.ECDH.prototype.getPrivateKey");
  }

  getPublicKey(_encoding: string, _format: string): Buffer | string {
    notImplemented("crypto.ECDH.prototype.getPublicKey");
  }

  // deno-lint-ignore no-explicit-any
  setPrivateKey(_privateKey: any, _encoding: string): Buffer | string {
    notImplemented("crypto.ECDH.prototype.setPrivateKey");
  }
}

// deno-lint-ignore no-explicit-any
export function diffieHellman(_options: any) {
  notImplemented("crypto.diffieHellman");
}
