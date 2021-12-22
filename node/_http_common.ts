// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { setImmediate } from "./timers.ts";
import type { Buffer } from "./buffer.ts";
import { FreeList } from "./internal/freelist.ts";
// We use http-parser-js (https://www.npmjs.com/package/http-parser-js)
// instead of llhttp
// @deno-types="./vendor/http_parser.d.ts"
import { HTTPParser, HTTPParserJS } from "./vendor/http_parser.js";

function parserOnHeaders() {
  // skip
}

function parserOnHeadersComplete(
  this: {
    onIncoming: (res: unknown, shouldKeepAlive: boolean) => void;
    socket: unknown;
  },
  versionMajor: unknown,
  versionMinor: unknown,
  headers: unknown,
  method: unknown,
  url: unknown,
  statusCode: unknown,
  statusMessage: unknown,
  upgrade: unknown,
  shouldKeepAlive: boolean,
) {
  // FIXME(kt3k): Implement IncomingMessage class correctly.
  // Uses socket object as incoming for now
  const incoming = Object.assign(this.socket, {
    versionMajor,
    versionMinor,
    headers,
    method,
    url,
    statusCode,
    statusMessage,
    upgrade,
  });
  this.onIncoming(incoming, shouldKeepAlive);
}

function parserOnBody(
  // deno-lint-ignore no-explicit-any
  this: { incoming: any; socket: any },
  b: Buffer,
  start: number,
  len: number,
) {
  const stream = this.incoming;

  // If the stream has already been removed, then drop it.
  if (stream == null) {
    return;
  }

  // Pretend this was the result of a stream._read call.
  if (len > 0 && !stream._dumped) {
    const slice = b.slice(start, start + len);
    const ret = stream.push(slice);
    if (!ret) {
      if (this.socket) {
        this.socket.pause();
      }
    }
  }
}

function parserOnMessageComplete(
  // deno-lint-ignore no-explicit-any
  this: { incoming: any; _headers: any; _url: any; socket: any },
) {
  // deno-lint-ignore no-this-alias
  const parser = this;
  const stream = parser.incoming;

  if (stream != null) {
    stream.complete = true;
    // Emit any trailing headers.
    const headers = parser._headers;
    if (headers.length) {
      stream._addHeaderLines(headers, headers.length);
      parser._headers = [];
      parser._url = "";
    }

    // For emit end event
    stream.push(null);
  }

  // Force to read the next incoming message
  const socket = parser.socket;
  if (socket && !socket._paused && socket.readable) {
    socket.resume();
  }
}

export const parsers = new FreeList("parsers", 1000, function parsersCb() {
  const parser = new HTTPParser();

  parser[HTTPParser.kOnHeaders] = parserOnHeaders;
  // deno-lint-ignore no-explicit-any
  (parser as any)[HTTPParser.kOnHeadersComplete] = parserOnHeadersComplete;
  parser[HTTPParser.kOnBody] = parserOnBody;
  parser[HTTPParser.kOnMessageComplete] = parserOnMessageComplete;

  return parser;
});

function closeParserInstance(parser: HTTPParserJS) {
  parser.close();
}

// Free the parser and also break any links that it
// might have to any other things.
// TODO: All parser data should be attached to a
// single object, so that it can be easily cleaned
// up by doing `parser.data = {}`, which should
// be done in FreeList.free.  `parsers.free(parser)`
// should be all that is needed.
export function freeParser(
  parser: HTTPParserJS,
  // deno-lint-ignore no-explicit-any
  req: any,
  // deno-lint-ignore no-explicit-any
  socket: any,
) {
  if (parsers.free(parser) === false) {
    // Make sure the parser's stack has unwound before deleting the
    // corresponding C++ object through .close().
    // deno-lint-ignore no-explicit-any
    setImmediate(closeParserInstance as any, parser);
  } else {
    // Since the Parser destructor isn't going to run the destroy() callbacks
    // it needs to be triggered manually.
    parser.free();
  }
  if (req) {
    req.parser = null;
  }
  if (socket) {
    socket.parser = null;
  }
}

const tokenRegExp = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
/**
 * Verifies that the given val is a valid HTTP token
 * per the rules defined in RFC 7230
 * See https://tools.ietf.org/html/rfc7230#section-3.2.6
 */
function checkIsHttpToken(val: string) {
  return tokenRegExp.test(val);
}

const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
/**
 * True if val contains an invalid field-vchar
 *  field-value    = *( field-content / obs-fold )
 *  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 *  field-vchar    = VCHAR / obs-text
 */
function checkInvalidHeaderChar(val: string) {
  return headerCharRegex.test(val);
}

export function prepareError(
  // deno-lint-ignore no-explicit-any
  err: any,
  parser: HTTPParserJS,
  rawPacket: Buffer,
) {
  err.rawPacket = rawPacket || parser.getCurrentBuffer();
  if (typeof err.reason === "string") {
    err.message = `Parse Error: ${err.reason}`;
  }
}

export function isLenient() {
  return false;
}

export const chunkExpression = /(?:^|\W)chunked(?:$|\W)/i;
export {
  checkInvalidHeaderChar as _checkInvalidHeaderChar,
  checkIsHttpToken as _checkIsHttpToken,
  HTTPParser,
};
