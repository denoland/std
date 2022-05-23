// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { KeyObject } from "./keys.ts";
import { Buffer } from "../../buffer.ts";
import { ERR_INVALID_ARG_TYPE } from "../errors.ts";
import { isArrayBufferView } from "../util/types.ts";
import { notImplemented } from "../../_utils.ts";

export class X509Certificate {
  // deno-lint-ignore no-explicit-any
  constructor(buffer: any) {
    if (typeof buffer === "string") {
      buffer = Buffer.from(buffer);
    }

    if (!isArrayBufferView(buffer)) {
      throw new ERR_INVALID_ARG_TYPE(
        "buffer",
        ["string", "Buffer", "TypedArray", "DataView"],
        buffer,
      );
    }

    notImplemented("crypto.X509Certificate");
  }

  get ca(): boolean {
    notImplemented("crypto.X509Certificate.prototype.ca");

    return false;
  }

  // deno-lint-ignore no-explicit-any
  checkEmail(_email: string, _options?: any): string | undefined {
    notImplemented("crypto.X509Certificate.prototype.checkEmail");
  }

  // deno-lint-ignore no-explicit-any
  checkHost(_name: string, _options?: any): string | undefined {
    notImplemented("crypto.X509Certificate.prototype.checkHost");
  }

  checkIP(_ip: string): string | undefined {
    notImplemented("crypto.X509Certificate.prototype.checkIP");
  }

  checkIssued(_otherCert: X509Certificate): boolean {
    notImplemented("crypto.X509Certificate.prototype.checkIssued");
  }

  checkPrivateKey(_privateKey: KeyObject) {
    notImplemented("crypto.X509Certificate.prototype.checkPrivateKey");
  }

  get fingerprint(): string {
    notImplemented("crypto.X509Certificate.prototype.fingerprint");

    return "";
  }

  get fingerprint256(): string {
    notImplemented("crypto.X509Certificate.prototype.fingerprint256");

    return "";
  }

  get fingerprint512(): string {
    notImplemented("crypto.X509Certificate.prototype.fingerprint512");

    return "";
  }

  get infoAccess(): string {
    notImplemented("crypto.X509Certificate.prototype.infoAccess");

    return "";
  }

  get issuer(): string {
    notImplemented("crypto.X509Certificate.prototype.issuer");

    return "";
  }

  get issuerCertificate(): X509Certificate {
    notImplemented("crypto.X509Certificate.prototype.issuerCertificate");

    return {} as X509Certificate;
  }

  get keyUsage(): string[] {
    notImplemented("crypto.X509Certificate.prototype.keyUsage");

    return [];
  }

  get publicKey(): KeyObject {
    notImplemented("crypto.X509Certificate.prototype.publicKey");

    return {} as KeyObject;
  }

  get raw(): Buffer {
    notImplemented("crypto.X509Certificate.prototype.raw");

    return {} as Buffer;
  }

  get serialNumber(): string {
    notImplemented("crypto.X509Certificate.prototype.serialNumber");

    return "";
  }

  get subject(): string {
    notImplemented("crypto.X509Certificate.prototype.subject");

    return "";
  }

  get subjectAltName(): string {
    notImplemented("crypto.X509Certificate.prototype.subjectAltName");

    return "";
  }

  toJSON(): string {
    return this.toString();
  }

  // deno-lint-ignore no-explicit-any
  toLegacyObject(): any {
    notImplemented("crypto.X509Certificate.prototype.toLegacyObject");
  }

  toString(): string {
    notImplemented("crypto.X509Certificate.prototype.toString");
  }

  get validFrom(): string {
    notImplemented("crypto.X509Certificate.prototype.validFrom");

    return "";
  }

  get validTo(): string {
    notImplemented("crypto.X509Certificate.prototype.validTo");

    return "";
  }

  verify(_publicKey: KeyObject): boolean {
    notImplemented("crypto.X509Certificate.prototype.verify");
  }
}
