// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { notImplemented } from "./_utils.ts";

export class Http2Session {
  constructor() {
    notImplemented();
  }
}
export class ServerHttp2Session {
  constructor() {
    notImplemented();
  }
}
export class ClientHttp2Session {
  constructor() {
    notImplemented();
  }
}
export class Http2Stream {
  constructor() {
    notImplemented();
  }
}
export class ClientHttp2Stream {
  constructor() {
    notImplemented();
  }
}
export class ServerHttp2Stream {
  constructor() {
    notImplemented();
  }
}
export class Http2Server {
  constructor() {
    notImplemented();
  }
}
export class Http2SecureServer {
  constructor() {
    notImplemented();
  }
}
export function createServer() {}
export function createSecureServer() {}
export function connect() {}
export const constants = {};
export function getDefaultSettings() {}
export function getPackedSettings() {}
export function getUnpackedSettings() {}
export const sensitiveHeaders = Symbol("nodejs.http2.sensitiveHeaders");
export class Http2ServerRequest {
  constructor() {
    notImplemented();
  }
}
export class Http2ServerResponse {
  constructor() {
    notImplemented();
  }
}
export default {
  Http2Session,
  ServerHttp2Session,
  ClientHttp2Session,
  Http2Stream,
  ClientHttp2Stream,
  ServerHttp2Stream,
  Http2Server,
  Http2SecureServer,
  createServer,
  createSecureServer,
  connect,
  constants,
  getDefaultSettings,
  getPackedSettings,
  getUnpackedSettings,
  sensitiveHeaders,
  Http2ServerRequest,
  Http2ServerResponse,
};
