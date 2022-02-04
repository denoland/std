// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { notImplemented } from "./_utils.ts";
import { Socket } from "./net.ts";

export class CryptoStream {}
export class SecurePair {}
export class Server {}
export class TLSSocket extends Socket {
  // Note: Mock authorized property for now
  authorized = true;
}
export function checkServerIdentity() {
  notImplemented();
}
export function connect() {
  notImplemented();
}
export function createSecureContext() {
  notImplemented();
}
export function createSecurePair() {
  notImplemented();
}
export function createServer() {
  notImplemented();
}
export function getCiphers() {
  notImplemented();
}
export const rootCertificates = undefined;
export const DEFAULT_ECDH_CURVE = undefined;
export const DEFAULT_MAX_VERSION = undefined;
export const DEFAULT_MIN_VERSION = undefined;
export default {
  CryptoStream,
  SecurePair,
  Server,
  TLSSocket,
  checkServerIdentity,
  connect,
  createSecureContext,
  createSecurePair,
  createServer,
  getCiphers,
  rootCertificates,
  DEFAULT_ECDH_CURVE,
  DEFAULT_MAX_VERSION,
  DEFAULT_MIN_VERSION,
};
