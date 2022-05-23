// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../../_utils.ts";
import { Buffer } from "../../buffer.ts";

export class Certificate {
  // deno-lint-ignore no-explicit-any
  static exportChallenge(_spkac: any, _encoding: string): Buffer {
    notImplemented("crypto.Certificate.exportChallenge");
  }

  // deno-lint-ignore no-explicit-any
  static exportPublicKey(_spkac: any, _encoding: string): Buffer {
    notImplemented("crypto.Certificate.exportPublicKey");
  }

  // deno-lint-ignore no-explicit-any
  static verifySpkac(_spkac: any, _encoding: string): Buffer {
    notImplemented("crypto.Certificate.verifySpkac");
  }
}

export default Certificate;
