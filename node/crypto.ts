// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { ERR_CRYPTO_FIPS_FORCED } from "./internal/errors.ts";
import { crypto as constants } from "./internal_binding/constants.ts";
import { getOptionValue } from "./internal/options.ts";
import {
  getFipsCrypto,
  setFipsCrypto,
  timingSafeEqual,
} from "./internal_binding/crypto.ts";
import {
  checkPrime,
  checkPrimeSync,
  generatePrime,
  generatePrimeSync,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
} from "./internal/crypto/random.ts";
import { pbkdf2, pbkdf2Sync } from "./internal/crypto/pbkdf2.ts";
import { scrypt, scryptSync } from "./internal/crypto/scrypt.ts";
import { hkdf, hkdfSync } from "./internal/crypto/hkdf.ts";
import {
  generateKey,
  generateKeyPair,
  generateKeyPairSync,
  generateKeySync,
} from "./internal/crypto/keygen.ts";
import {
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  KeyObject,
} from "./internal/crypto/keys.ts";
import {
  DiffieHellman,
  diffieHellman,
  DiffieHellmanGroup,
  ECDH,
} from "./internal/crypto/diffiehellman.ts";
import {
  Cipheriv,
  Decipheriv,
  getCipherInfo,
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
} from "./internal/crypto/cipher.ts";
import {
  Sign,
  signOneShot,
  Verify,
  verifyOneShot,
} from "./internal/crypto/sig.ts";
import { createHash, Hash, Hmac } from "./internal/crypto/hash.ts";
import { X509Certificate } from "./internal/crypto/x509.ts";
import {
  getCiphers,
  getCurves,
  getHashes,
  secureHeapUsed,
  setEngine,
} from "./internal/crypto/util.ts";
import Certificate from "./internal/crypto/certificate.ts";

const webcrypto = globalThis.crypto;
const fipsForced = getOptionValue("--force-fips");

// deno-lint-ignore no-explicit-any
function createCipheriv(cipher: string, key: any, iv: any, options?: any) {
  return new Cipheriv(cipher, key, iv, options);
}

// deno-lint-ignore no-explicit-any
function createDecipheriv(cipher: string, key: any, iv: any, options?: any) {
  return new Decipheriv(cipher, key, iv, options);
}

function createDiffieHellman(
  // deno-lint-ignore no-explicit-any
  sizeOrKey: any,
  keyEncoding: string,
  // deno-lint-ignore no-explicit-any
  generator: any,
  genEncoding: string,
) {
  return new DiffieHellman(sizeOrKey, keyEncoding, generator, genEncoding);
}

function createDiffieHellmanGroup(name: string) {
  return new DiffieHellmanGroup(name);
}

function createECDH(curve: string) {
  return new ECDH(curve);
}

// deno-lint-ignore no-explicit-any
function createHmac(hmac: string, key: any, options: any) {
  return new Hmac(hmac, key, options);
}

// deno-lint-ignore no-explicit-any
function createSign(algorithm: string, options: any) {
  return new Sign(algorithm, options);
}

// deno-lint-ignore no-explicit-any
function createVerify(algorithm: string, options: any) {
  return new Verify(algorithm, options);
}

function setFipsForced(val: boolean) {
  if (val) {
    return;
  }

  throw new ERR_CRYPTO_FIPS_FORCED();
}

function getFipsForced() {
  return 1;
}

Object.defineProperty(constants, "defaultCipherList", {
  value: getOptionValue("--tls-cipher-list"),
});

const getDiffieHellman = createDiffieHellmanGroup;

const getFips = fipsForced ? getFipsForced : getFipsCrypto;
const setFips = fipsForced ? setFipsForced : setFipsCrypto;

const sign = signOneShot;
const verify = verifyOneShot;

export default {
  Certificate,
  checkPrime,
  checkPrimeSync,
  Cipheriv,
  constants,
  createCipheriv,
  createDecipheriv,
  createDiffieHellman,
  createDiffieHellmanGroup,
  createECDH,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  createSign,
  createVerify,
  Decipheriv,
  DiffieHellman,
  diffieHellman,
  DiffieHellmanGroup,
  ECDH,
  generateKey,
  generateKeyPair,
  generateKeyPairSync,
  generateKeySync,
  generatePrime,
  generatePrimeSync,
  getCipherInfo,
  getCiphers,
  getCurves,
  getDiffieHellman,
  getFips,
  getHashes,
  Hash,
  hkdf,
  hkdfSync,
  Hmac,
  KeyObject,
  pbkdf2,
  pbkdf2Sync,
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
  scrypt,
  scryptSync,
  secureHeapUsed,
  setEngine,
  setFips,
  Sign,
  sign,
  timingSafeEqual,
  Verify,
  verify,
  webcrypto,
  X509Certificate,
};

export {
  Certificate,
  checkPrime,
  checkPrimeSync,
  Cipheriv,
  constants,
  createCipheriv,
  createDecipheriv,
  createDiffieHellman,
  createDiffieHellmanGroup,
  createECDH,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  createSecretKey,
  createSign,
  createVerify,
  Decipheriv,
  DiffieHellman,
  diffieHellman,
  DiffieHellmanGroup,
  ECDH,
  generateKey,
  generateKeyPair,
  generateKeyPairSync,
  generateKeySync,
  generatePrime,
  generatePrimeSync,
  getCipherInfo,
  getCiphers,
  getCurves,
  getDiffieHellman,
  getFips,
  getHashes,
  Hash,
  hkdf,
  hkdfSync,
  Hmac,
  KeyObject,
  pbkdf2,
  pbkdf2Sync,
  privateDecrypt,
  privateEncrypt,
  publicDecrypt,
  publicEncrypt,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
  scrypt,
  scryptSync,
  secureHeapUsed,
  setEngine,
  setFips,
  Sign,
  sign,
  timingSafeEqual,
  Verify,
  verify,
  webcrypto,
  X509Certificate,
};
