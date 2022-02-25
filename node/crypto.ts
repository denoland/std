// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { default as randomBytes } from "./_crypto/randomBytes.ts";
import randomFill, { randomFillSync } from "./_crypto/randomFill.ts";
import randomInt from "./_crypto/randomInt.ts";
import { pbkdf2, pbkdf2Sync } from "./_crypto/pbkdf2.ts";
import { scrypt, scryptSync } from "./_crypto/scrypt.ts";
import { timingSafeEqual } from "./_crypto/timingSafeEqual.ts";
import { createHash, getHashes, Hash } from "./_crypto/hash.ts";

const randomUUID = () => crypto.randomUUID();
const webcrypto = crypto;

export default {
  Hash,
  createHash,
  getHashes,
  randomFill,
  randomInt,
  randomFillSync,
  pbkdf2,
  pbkdf2Sync,
  randomBytes,
  randomUUID,
  scrypt,
  scryptSync,
  timingSafeEqual,
  webcrypto,
};
export {
  createHash,
  getHashes,
  Hash,
  pbkdf2,
  pbkdf2Sync,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
  scrypt,
  scryptSync,
  timingSafeEqual,
  webcrypto,
};
