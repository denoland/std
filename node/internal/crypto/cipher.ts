// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { Cipher } from "../../_crypto/crypto_browserify/browserify_aes/encrypter.js";
import { Decipher } from "../../_crypto/crypto_browserify/browserify_aes/decrypter.js";
import { ERR_INVALID_ARG_TYPE } from "../errors.ts";
import { validateInt32, validateObject } from "../validators.mjs";
import { notImplemented } from "../../_utils.ts";

export { createCipheriv } from "../../_crypto/crypto_browserify/browserify_aes/encrypter.js";
export { createDecipheriv } from "../../_crypto/crypto_browserify/browserify_aes/decrypter.js";
export {
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
} from "../../_crypto/crypto_browserify/public_encrypt/mod.js";

export class Cipheriv extends Cipher {}
export class Decipheriv extends Decipher {}

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
