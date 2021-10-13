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

// Copyright Mathias Bynens <https://mathiasbynens.be/>

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Adapted from https://github.com/mathiasbynens/punycode.js

// TODO(cmorten): migrate punycode logic to "icu" internal binding and/or "url"
// internal module so there can be re-use within the "url" module etc.

"use strict";

/** Highest positive signed 32-bit float value */
const maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

/** Bootstring parameters */
const base = 36;
const tMin = 1;
const tMax = 26;
const skew = 38;
const damp = 700;
const initialBias = 72;
const initialN = 128; // 0x80
const delimiter = "-"; // '\x2D'

/** Regular expressions */
const regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

/** Error messages */
const errors: Record<string, string> = {
  "overflow": "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input",
};

/** Convenience shortcuts */
const baseMinusTMin = base - tMin;

/**
 * A generic error utility function.
 *
 * @param type The error type.
 * @return Throws a `RangeError` with the applicable error message.
 */
function _error(type: string) {
  throw new RangeError(errors[type]);
}

/**
 * A simple `Array#map`-like wrapper to work with domain name strings or email
 * addresses.
 *
 * @param domain The domain name or email address.
 * @param callback The function that gets called for every
 * character.
 * @return A new string of characters returned by the callback
 * function.
 */
function _mapDomain(str: string, fn: (label: string) => string) {
  const parts = str.split("@");
  let result = "";

  if (parts.length > 1) {
    // In email addresses, only the domain name should be punycoded. Leave
    // the local part (i.e. everything up to `@`) intact.
    result = parts[0] + "@";
    str = parts[1];
  }

  // Avoid `split(regex)` for IE8 compatibility. See #17.
  str = str.replace(regexSeparators, "\x2E");
  const labels = str.split(".");
  const encoded = labels.map(fn).join(".");

  return result + encoded;
}

/**
 * Creates an array containing the numeric code points of each Unicode
 * character in the string. While JavaScript uses UCS-2 internally,
 * this function will convert a pair of surrogate halves (each of which
 * UCS-2 exposes as separate characters) into a single code point,
 * matching UTF-16.
 *
 * @param str The Unicode input string (UCS-2).
 * @return The new array of code points.
 */
function _ucs2decode(str: string) {
  const output = [];
  let counter = 0;
  const length = str.length;

  while (counter < length) {
    const value = str.charCodeAt(counter++);

    if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
      // It's a high surrogate, and there is a next character.
      const extra = str.charCodeAt(counter++);

      if ((extra & 0xFC00) == 0xDC00) { // Low surrogate.
        output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
      } else {
        // It's an unmatched surrogate; only append this code unit, in case the
        // next code unit is the high surrogate of a surrogate pair.
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }

  return output;
}

/**
 * Converts a digit/integer into a basic code point.
 *
 * @param digit The numeric value of a basic code point.
 * @return The basic code point whose value (when used for
 * representing integers) is `digit`, which needs to be in the range
 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
 * used; else, the lowercase form is used. The behavior is undefined
 * if `flag` is non-zero and `digit` has no uppercase form.
 */
function _digitToBasic(digit: number, flag: number) {
  //  0..25 map to ASCII a..z or A..Z
  // 26..35 map to ASCII 0..9
  return digit + 22 + 75 * Number(digit < 26) - (Number(flag != 0) << 5);
}

/**
 * Bias adaptation function as per section 3.4 of RFC 3492.
 * https://tools.ietf.org/html/rfc3492#section-3.4
 */
function _adapt(delta: number, numPoints: number, firstTime: boolean) {
  let k = 0;
  delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
  delta += Math.floor(delta / numPoints);

  for (; /* no initialization */ delta > baseMinusTMin * tMax >> 1; k += base) {
    delta = Math.floor(delta / baseMinusTMin);
  }

  return Math.floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
}

/**
 * Converts a string of Unicode symbols (e.g. a domain name label) to a
 * Punycode string of ASCII-only symbols.
 *
 * @param str The string of Unicode symbols.
 * @return The resulting Punycode string of ASCII-only symbols.
 */
function _encode(str: string) {
  const output = [];

  // Convert the input in UCS-2 to an array of Unicode code points.
  const input = _ucs2decode(str);

  // Cache the length.
  const inputLength = input.length;

  // Initialize the state.
  let n = initialN;
  let delta = 0;
  let bias = initialBias;

  // Handle the basic code points.
  for (const currentValue of input) {
    if (currentValue < 0x80) {
      output.push(String.fromCharCode(currentValue));
    }
  }

  const basicLength = output.length;
  let handledCPCount = basicLength;

  // `handledCPCount` is the number of code points that have been handled;
  // `basicLength` is the number of basic code points.

  // Finish the basic string with a delimiter unless it's empty.
  if (basicLength) {
    output.push(delimiter);
  }

  // Main encoding loop:
  while (handledCPCount < inputLength) {
    // All non-basic code points < n have been handled already. Find the next
    // larger one:
    let m = maxInt;

    for (const currentValue of input) {
      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    }

    // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
    // but guard against overflow.
    const handledCPCountPlusOne = handledCPCount + 1;

    if (m - n > Math.floor((maxInt - delta) / handledCPCountPlusOne)) {
      _error("overflow");
    }

    delta += (m - n) * handledCPCountPlusOne;
    n = m;

    for (const currentValue of input) {
      if (currentValue < n && ++delta > maxInt) {
        _error("overflow");
      }

      if (currentValue == n) {
        // Represent delta as a generalized variable-length integer.
        let q = delta;

        for (let k = base;; /* no condition */ k += base) {
          const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

          if (q < t) {
            break;
          }

          const qMinusT = q - t;
          const baseMinusT = base - t;

          output.push(
            String.fromCharCode(_digitToBasic(t + qMinusT % baseMinusT, 0)),
          );

          q = Math.floor(qMinusT / baseMinusT);
        }

        output.push(String.fromCharCode(_digitToBasic(q, 0)));

        bias = _adapt(
          delta,
          handledCPCountPlusOne,
          handledCPCount == basicLength,
        );

        delta = 0;
        ++handledCPCount;
      }
    }

    ++delta;
    ++n;
  }

  return output.join("");
}

/**
 * Converts a Unicode string representing a domain name or an email address to
 * Punycode. Only the non-ASCII parts of the domain name will be converted,
 * i.e. it doesn't matter if you call it with a domain that's already in
 * ASCII.
 *
 * @param input The domain name or email address to convert, as a
 * Unicode string.
 * @return The Punycode representation of the given domain name or
 * email address.
 */
function _toASCII(input: string) {
  return _mapDomain(input, function (str: string) {
    return regexNonASCII.test(str) ? "xn--" + _encode(str) : str;
  });
}

export function toASCII(str: string): string {
  return _toASCII(str);
}
