// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

import { getOptionValue } from "../_options.ts";
import { emitWarning } from "../process.ts";
import {
  AI_ADDRCONFIG,
  AI_ALL,
  AI_V4MAPPED,
} from "../internal_binding/cares_wrap.ts";
import { ERR_INVALID_ARG_VALUE } from "../internal/errors.ts";

export function validateHints(hints: number) {
  if ((hints & ~(AI_ADDRCONFIG | AI_ALL | AI_V4MAPPED)) !== 0) {
    throw new ERR_INVALID_ARG_VALUE("hints", hints, "is invalid");
  }
}

let invalidHostnameWarningEmitted = false;

export function emitInvalidHostnameWarning(hostname: string) {
  if (invalidHostnameWarningEmitted) {
    return;
  }

  invalidHostnameWarningEmitted = true;

  emitWarning(
    `The provided hostname "${hostname}" is not a valid ` +
      "hostname, and is supported in the dns module solely for compatibility.",
    "DeprecationWarning",
    "DEP0118",
  );
}

const dnsOrder = getOptionValue("--dns-result-order") || "ipv4first";

export function getDefaultVerbatim() {
  switch (dnsOrder) {
    case "verbatim": {
      return true;
    }
    case "ipv4first": {
      return false;
    }
    default: {
      return false;
    }
  }
}
