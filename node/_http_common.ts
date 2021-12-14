// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

import { setImmediate } from "./timers.ts";
import type { Buffer } from "./buffer.ts";
import { FreeList } from "./internal/freelist.ts";
// We use http-parser-js (https://www.npmjs.com/package/http-parser-js)
// instead of llhttp
// @deno-types="./vendor/http_parser.d.ts"
import { HTTPParser, HTTPParserJS } from "./vendor/http_parser.js";

export const parsers = new FreeList("parsers", 1000, function parsersCb() {
  const parser = new HTTPParser();
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
    setImmediate(closeParserInstance, parser);
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
