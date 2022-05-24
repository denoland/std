// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { kHandle, kKeyObject } from "./constants.ts";
import { ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE } from "../errors.ts";
import { notImplemented } from "../../_utils.ts";
import type { KeyFormat, KeyType } from "./types.ts";
import { Buffer } from "../../buffer.ts";
import type { BufferEncoding } from "../../_global.d.ts";

const kKeyType = Symbol("kKeyType");

export function isKeyObject(obj: unknown): obj is KeyObject {
  return (
    obj != null && (obj as Record<symbol, unknown>)[kKeyType] !== undefined
  );
}

export function isCryptoKey(obj: unknown) {
  return (
    obj != null && (obj as Record<symbol, unknown>)[kKeyObject] !== undefined
  );
}

export interface AsymmetricKeyDetails {
  /**
   * Key size in bits (RSA, DSA).
   */
  modulusLength?: number | undefined;
  /**
   * Public exponent (RSA).
   */
  publicExponent?: bigint | undefined;
  /**
   * Name of the message digest (RSA-PSS).
   */
  hashAlgorithm?: string | undefined;
  /**
   * Name of the message digest used by MGF1 (RSA-PSS).
   */
  mgf1HashAlgorithm?: string | undefined;
  /**
   * Minimal salt length in bytes (RSA-PSS).
   */
  saltLength?: number | undefined;
  /**
   * Size of q in bits (DSA).
   */
  divisorLength?: number | undefined;
  /**
   * Name of the curve (EC).
   */
  namedCurve?: string | undefined;
}

export type KeyObjectType = "secret" | "public" | "private";

export interface KeyExportOptions<T extends KeyFormat> {
  type: "pkcs1" | "spki" | "pkcs8" | "sec1";
  format: T;
  cipher?: string | undefined;
  passphrase?: string | Buffer | undefined;
}

export interface JwkKeyExportOptions {
  format: "jwk";
}

export class KeyObject {
  [kKeyType]: KeyObjectType;
  [kHandle]: unknown;

  constructor(type: KeyObjectType, handle: unknown) {
    if (type !== "secret" && type !== "public" && type !== "private") {
      throw new ERR_INVALID_ARG_VALUE("type", type);
    }

    if (typeof handle !== "object") {
      throw new ERR_INVALID_ARG_TYPE("handle", "object", handle);
    }

    this[kKeyType] = type;

    Object.defineProperty(this, kHandle, {
      value: handle,
      enumerable: false,
      configurable: false,
      writable: false,
    });
  }

  get type(): KeyObjectType {
    return this[kKeyType];
  }

  get asymmetricKeyDetails(): AsymmetricKeyDetails | undefined {
    notImplemented("crypto.KeyObject.prototype.asymmetricKeyDetails");

    return undefined;
  }

  get asymmetricKeyType(): KeyType | undefined {
    notImplemented("crypto.KeyObject.prototype.asymmetricKeyType");

    return undefined;
  }

  get symmetricKeySize(): number | undefined {
    notImplemented("crypto.KeyObject.prototype.symmetricKeySize");

    return undefined;
  }

  static from(key: CryptoKey): KeyObject {
    if (!isCryptoKey(key)) {
      throw new ERR_INVALID_ARG_TYPE("key", "CryptoKey", key);
    }

    notImplemented("crypto.KeyObject.prototype.from");
  }

  equals(otherKeyObject: KeyObject): boolean {
    if (!isKeyObject(otherKeyObject)) {
      throw new ERR_INVALID_ARG_TYPE(
        "otherKeyObject",
        "KeyObject",
        otherKeyObject,
      );
    }

    notImplemented("crypto.KeyObject.prototype.equals");
  }

  export(options: KeyExportOptions<"pem">): string | Buffer;
  export(options?: KeyExportOptions<"der">): Buffer;
  export(options?: JwkKeyExportOptions): JsonWebKey;
  export(_options?: unknown): string | Buffer | JsonWebKey {
    notImplemented("crypto.KeyObject.prototype.asymmetricKeyType");
  }
}

export interface PrivateKeyInput {
  key: string | Buffer;
  format?: KeyFormat | undefined;
  type?: "pkcs1" | "pkcs8" | "sec1" | undefined;
  passphrase?: string | Buffer | undefined;
}

export interface PublicKeyInput {
  key: string | Buffer;
  format?: KeyFormat | undefined;
  type?: "pkcs1" | "spki" | undefined;
}

export interface JsonWebKeyInput {
  key: JsonWebKey;
  format: "jwk";
}

export function createPrivateKey(
  _key: PrivateKeyInput | string | Buffer | JsonWebKeyInput,
): KeyObject {
  notImplemented("crypto.createPrivateKey");
}

export function createPublicKey(
  _key: PublicKeyInput | string | Buffer | KeyObject | JsonWebKeyInput,
): KeyObject {
  notImplemented("crypto.createPublicKey");
}

export function createSecretKey(key: ArrayBufferView): KeyObject;
export function createSecretKey(
  key: string,
  encoding: BufferEncoding,
): KeyObject;
export function createSecretKey(
  _key: string | ArrayBufferView,
  _encoding?: BufferEncoding,
): KeyObject {
  notImplemented("crypto.createSecretKey");
}

export default {
  isKeyObject,
  isCryptoKey,
  KeyObject,
  createPrivateKey,
  createPublicKey,
  createSecretKey,
};
