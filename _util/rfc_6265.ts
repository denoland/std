// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// https://tools.ietf.org/html/rfc6265

const FIELD_CONTENT_REGEXP = /^(?=[\x20-\x7E]*$)[^()@<>,;:\\"\[\]?={}\s]+$/;

/**
 * Validate Path Value.
 * @see https://tools.ietf.org/html/rfc6265#section-4.1.2.4
 * @param path Path value.
 */
export function validateCookiePath(path: string | null): void {
  if (path == null) {
    return;
  }
  for (let i = 0; i < path.length; i++) {
    const c = path.charAt(i);
    if (
      c < String.fromCharCode(0x20) ||
      c > String.fromCharCode(0x7e) ||
      c == ";"
    ) {
      throw new Error(path + ": Invalid cookie path char '" + c + "'");
    }
  }
}

/**
 * Validate Cookie Value.
 * @see https://tools.ietf.org/html/rfc6265#section-4.1
 * @param value Cookie value.
 */
export function validateCookieValue(name: string, value: string | null): void {
  if (value == null || name == null) return;
  for (let i = 0; i < value.length; i++) {
    const c = value.charAt(i);
    if (
      c < String.fromCharCode(0x21) ||
      c == String.fromCharCode(0x22) ||
      c == String.fromCharCode(0x2c) ||
      c == String.fromCharCode(0x3b) ||
      c == String.fromCharCode(0x5c) ||
      c == String.fromCharCode(0x7f)
    ) {
      throw new Error(
        "RFC2616 cookie '" + name + "' cannot have '" + c + "' as value",
      );
    }
    if (c > String.fromCharCode(0x80)) {
      throw new Error(
        "RFC2616 cookie '" +
          name +
          "' can only have US-ASCII chars as value" +
          c.charCodeAt(0).toString(16),
      );
    }
  }
}

/**
 * Validate Cookie Name.
 * @param name Cookie name.
 */
export function validateCookieName(name: string | undefined | null): void {
  if (name && !FIELD_CONTENT_REGEXP.test(name)) {
    throw new TypeError(`Invalid cookie name: "${name}".`);
  }
}
