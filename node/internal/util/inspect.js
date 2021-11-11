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

import { validateString } from "../../_validators.ts";

// Regex used for ansi escape code splitting
// Adopted from https://github.com/chalk/ansi-regex/blob/HEAD/index.js
// License: MIT, authors: @sindresorhus, Qix-, arjunmehta and LitoMore
// Matches all ansi escape code sequences in a string
const ansiPattern = "[\\u001B\\u009B][[\\]()#;?]*" +
  "(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*" +
  "|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)" +
  "|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))";
const ansi = new RegExp(ansiPattern, "g");

/**
 * Returns the number of columns required to display the given string.
 */
export function getStringWidth(str, removeControlChars = true) {
  let width = 0;

  if (removeControlChars) {
    str = stripVTControlCharacters(str);
  }
  str = str.normalize("NFC");
  for (const char of str[Symbol.iterator]()) {
    const code = char.codePointAt(0);
    if (isFullWidthCodePoint(code)) {
      width += 2;
    } else if (!isZeroWidthCodePoint(code)) {
      width++;
    }
  }

  return width;
}

/**
 * Returns true if the character represented by a given
 * Unicode code point is full-width. Otherwise returns false.
 */
const isFullWidthCodePoint = (code) => {
  // Code points are partially derived from:
  // https://www.unicode.org/Public/UNIDATA/EastAsianWidth.txt
  return code >= 0x1100 && (
    code <= 0x115f || // Hangul Jamo
    code === 0x2329 || // LEFT-POINTING ANGLE BRACKET
    code === 0x232a || // RIGHT-POINTING ANGLE BRACKET
    // CJK Radicals Supplement .. Enclosed CJK Letters and Months
    (code >= 0x2e80 && code <= 0x3247 && code !== 0x303f) ||
    // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
    (code >= 0x3250 && code <= 0x4dbf) ||
    // CJK Unified Ideographs .. Yi Radicals
    (code >= 0x4e00 && code <= 0xa4c6) ||
    // Hangul Jamo Extended-A
    (code >= 0xa960 && code <= 0xa97c) ||
    // Hangul Syllables
    (code >= 0xac00 && code <= 0xd7a3) ||
    // CJK Compatibility Ideographs
    (code >= 0xf900 && code <= 0xfaff) ||
    // Vertical Forms
    (code >= 0xfe10 && code <= 0xfe19) ||
    // CJK Compatibility Forms .. Small Form Variants
    (code >= 0xfe30 && code <= 0xfe6b) ||
    // Halfwidth and Fullwidth Forms
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    // Kana Supplement
    (code >= 0x1b000 && code <= 0x1b001) ||
    // Enclosed Ideographic Supplement
    (code >= 0x1f200 && code <= 0x1f251) ||
    // Miscellaneous Symbols and Pictographs 0x1f300 - 0x1f5ff
    // Emoticons 0x1f600 - 0x1f64f
    (code >= 0x1f300 && code <= 0x1f64f) ||
    // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
    (code >= 0x20000 && code <= 0x3fffd)
  );
};

const isZeroWidthCodePoint = (code) => {
  return code <= 0x1F || // C0 control codes
    (code >= 0x7F && code <= 0x9F) || // C1 control codes
    (code >= 0x300 && code <= 0x36F) || // Combining Diacritical Marks
    (code >= 0x200B && code <= 0x200F) || // Modifying Invisible Characters
    // Combining Diacritical Marks for Symbols
    (code >= 0x20D0 && code <= 0x20FF) ||
    (code >= 0xFE00 && code <= 0xFE0F) || // Variation Selectors
    (code >= 0xFE20 && code <= 0xFE2F) || // Combining Half Marks
    (code >= 0xE0100 && code <= 0xE01EF); // Variation Selectors
};

/**
 * Remove all VT control characters. Use to estimate displayed string width.
 */
export function stripVTControlCharacters(str) {
  validateString(str, "str");

  return str.replace(ansi, "");
}
