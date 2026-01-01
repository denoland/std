// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { decodeHex, encodeHex } from "@std/encoding/hex";

const encoder = new TextEncoder();

function splitByLast(value: string, separator: string): [string, string] {
  const index = value.lastIndexOf(separator);
  return index === -1
    ? [value, ""]
    : [value.slice(0, index), value.slice(index + 1)];
}

/**
 * Returns a promise with the signed cookie value from the given cryptographic
 * key.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore no-assert
 * import { signCookie } from "@std/http/unstable-signed-cookie";
 * import { setCookie } from "@std/http/cookie";
 *
 * const key = await crypto.subtle.generateKey(
 *   { name: "HMAC", hash: "SHA-256" },
 *   true,
 *   ["sign", "verify"],
 * );
 * const value = await signCookie("my-cookie-value", key);
 *
 * const headers = new Headers();
 * setCookie(headers, {
 *   name: "my-cookie-name",
 *   value,
 * });
 *
 * const cookieHeader = headers.get("set-cookie");
 * ```
 *
 * @param value The cookie value to sign.
 * @param key The cryptographic key to sign the cookie with.
 * @returns The signed cookie.
 */
export async function signCookie(
  value: string,
  key: CryptoKey,
): Promise<string> {
  const data = encoder.encode(value);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const signatureHex = encodeHex(signature);
  return `${value}.${signatureHex}`;
}

/**
 * Returns a promise of a boolean indicating whether the signed cookie is valid.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore no-assert
 * import { verifySignedCookie } from "@std/http/unstable-signed-cookie";
 * import { getCookies } from "@std/http/cookie";
 *
 * const key = await crypto.subtle.generateKey(
 *   { name: "HMAC", hash: "SHA-256" },
 *   true,
 *   ["sign", "verify"],
 * );
 *
 * const headers = new Headers({
 *   Cookie: "location=tokyo.37f7481039762eef5cd46669f93c0a3214dfecba7d0cdc0b0dc40036063fb22e",
 * });
 * const signedCookie = getCookies(headers)["location"];
 * if (signedCookie === undefined) throw new Error("Cookie not found");
 * await verifySignedCookie(signedCookie, key);
 * ```
 *
 * @param signedCookie The signed cookie to verify.
 * @param key The cryptographic key to verify the cookie with.
 * @returns Whether or not the cookie is valid.
 */
export async function verifySignedCookie(
  signedCookie: string,
  key: CryptoKey,
): Promise<boolean> {
  const [value, signatureHex] = splitByLast(signedCookie, ".");
  if (!value || !signatureHex) return false;

  const data = encoder.encode(value);
  const signature = decodeHex(signatureHex);

  return await crypto.subtle.verify("HMAC", key, signature, data);
}

/**
 * Parses a signed cookie to get its value.
 *
 * Important: always verify the cookie using {@linkcode verifySignedCookie} first.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore no-assert
 * import { verifySignedCookie, parseSignedCookie } from "@std/http/unstable-signed-cookie";
 * import { getCookies } from "@std/http/cookie";
 *
 * const key = await crypto.subtle.generateKey(
 *   { name: "HMAC", hash: "SHA-256" },
 *   true,
 *   ["sign", "verify"],
 * );
 *
 * const headers = new Headers({
 *   Cookie: "location=tokyo.37f7481039762eef5cd46669f93c0a3214dfecba7d0cdc0b0dc40036063fb22e",
 * });
 * const signedCookie = getCookies(headers)["location"];
 * if (signedCookie === undefined) throw new Error("Cookie not found");
 * await verifySignedCookie(signedCookie, key);
 * const cookie = parseSignedCookie(signedCookie);
 * ```
 *
 * @param signedCookie The signed cookie to parse the value from.
 * @returns The parsed cookie.
 */
export function parseSignedCookie(signedCookie: string): string {
  return splitByLast(signedCookie, ".")[0];
}
