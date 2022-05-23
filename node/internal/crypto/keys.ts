// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.
import { kKeyObject } from "./util.ts";
import { ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE } from "../errors.ts";
import { notImplemented } from "../../_utils.ts";
import { kHandle } from "../stream_base_commons.ts";

const kKeyType = Symbol("kKeyType");

// deno-lint-ignore no-explicit-any
export function isKeyObject(obj: any) {
  return obj != null && obj[kKeyType] !== undefined;
}

// deno-lint-ignore no-explicit-any
export function isCryptoKey(obj: any) {
  return obj != null && obj[kKeyObject] !== undefined;
}

export class KeyObject {
  [kKeyType]: string;
  // deno-lint-ignore no-explicit-any
  [kHandle]: any;

  // deno-lint-ignore no-explicit-any
  constructor(type: string, handle: any) {
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

  get type(): string {
    return this[kKeyType];
  }

  get asymmetricKeyDetails() {
    notImplemented("crypto.KeyObject.asymmetricKeyDetails");

    return {};
  }

  get asymmetricKeyType(): string | undefined {
    notImplemented("crypto.KeyObject.asymmetricKeyType");

    return undefined;
  }

  get symmetricKeySize(): number | undefined {
    notImplemented("crypto.KeyObject.symmetricKeySize");

    return undefined;
  }

  static from(key: string) {
    if (!isCryptoKey(key)) {
      throw new ERR_INVALID_ARG_TYPE("key", "CryptoKey", key);
    }

    notImplemented("crypto.KeyObject.from");
  }

  // deno-lint-ignore no-explicit-any
  equals(otherKeyObject: any): boolean {
    if (!isKeyObject(otherKeyObject)) {
      throw new ERR_INVALID_ARG_TYPE(
        "otherKeyObject",
        "KeyObject",
        otherKeyObject,
      );
    }

    return (
      otherKeyObject.type === this.type &&
      this[kHandle].equals(otherKeyObject[kHandle])
    );
  }

  // deno-lint-ignore no-explicit-any
  export(_options: any) {
    notImplemented("crypto.KeyObject.asymmetricKeyType");
  }
}

// deno-lint-ignore no-explicit-any
export function createPrivateKey(_key: any) {
  notImplemented("crypto.createPrivateKey");
}

// deno-lint-ignore no-explicit-any
export function createPublicKey(_key: any) {
  notImplemented("crypto.createPublicKey");
}

// deno-lint-ignore no-explicit-any
export function createSecretKey(_key: any, _encoding: string) {
  notImplemented("crypto.createSecretKey");
}
