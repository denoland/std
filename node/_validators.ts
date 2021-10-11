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

import {
  ERR_INVALID_ARG_TYPE,
  ERR_INVALID_ARG_VALUE,
  ERR_INVALID_CALLBACK,
  ERR_OUT_OF_RANGE,
  ERR_SOCKET_BAD_PORT,
  hideStackFrames,
} from "./_errors.ts";

export function isInt32(value: number): boolean {
  return value === (value | 0);
}

export const validateInt32 = hideStackFrames(
  (value, name, min = -2147483648, max = 2147483647) => {
    // The defaults for min and max correspond to the limits of 32-bit integers.
    if (!isInt32(value)) {
      if (typeof value !== "number") {
        throw new ERR_INVALID_ARG_TYPE(name, "number", value);
      }

      if (!Number.isInteger(value)) {
        throw new ERR_OUT_OF_RANGE(name, "an integer", value);
      }

      throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }

    if (value < min || value > max) {
      throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value);
    }
  },
);

export function validateString(value: unknown, name: string) {
  if (typeof value !== "string") {
    throw new ERR_INVALID_ARG_TYPE(name, "string", value);
  }
}

export function validateNumber(value: unknown, name: string) {
  if (typeof value !== "number") {
    throw new ERR_INVALID_ARG_TYPE(name, "number", value);
  }
}

export const validateOneOf = hideStackFrames(
  (value: unknown, name: string, oneOf: unknown[]) => {
    if (!Array.prototype.includes.call(oneOf, value)) {
      const allowed = Array.prototype.join.call(
        Array.prototype.map.call(
          oneOf,
          (v) => (typeof v === "string" ? `'${v}'` : String(v)),
        ),
        ", ",
      );
      const reason = "must be one of: " + allowed;

      throw new ERR_INVALID_ARG_VALUE(name, value, reason);
    }
  },
);

// Check that the port number is not NaN when coerced to a number,
// is an integer and that it falls within the legal range of port numbers.
export function validatePort(port: unknown, name = "Port", allowZero = true) {
  if (
    (typeof port !== "number" && typeof port !== "string") ||
    (typeof port === "string" &&
      String.prototype.trim.call(port).length === 0) ||
    +port !== (+port >>> 0) ||
    port > 0xFFFF ||
    (port === 0 && !allowZero)
  ) {
    throw new ERR_SOCKET_BAD_PORT(name, port, allowZero);
  }

  return port as number | 0;
}

export const validateCallback = hideStackFrames((callback: unknown) => {
  if (typeof callback !== "function") {
    throw new ERR_INVALID_CALLBACK(callback);
  }
});

export const validateAbortSignal = hideStackFrames(
  (signal: unknown, name: string) => {
    if (
      signal !== undefined &&
      (signal === null ||
        typeof signal !== "object" ||
        !("aborted" in (signal as Record<string, unknown>)))
    ) {
      throw new ERR_INVALID_ARG_TYPE(name, "AbortSignal", signal);
    }
  },
);

export const validateFunction = hideStackFrames(
  (value: unknown, name: string) => {
    if (typeof value !== "function") {
      throw new ERR_INVALID_ARG_TYPE(name, "Function", value);
    }
  },
);
