// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { decodeHex, encodeHex } from "../encoding/hex.ts";

const encoder = new TextEncoder();

/**
 * Returns a promise with the signed cookie value from the given cryptographic
 * key.
 *
 * @example
 * ```ts
 * import { signCookie } from "https://deno.land/std@$STD_VERSION/http/signed_cookie.ts";
 * import { setCookie } from "https://deno.land/std@$STD_VERSION/http/cookie.ts";
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
 */
export async function verifyCookie(
  signedCookie: string,
  key: CryptoKey,
): Promise<boolean> {
  const [value, signatureHex] = signedCookie.split(".");
  if (!value || !signatureHex) return false;

  const data = encoder.encode(value);
  const signature = decodeHex(signatureHex);

  return await crypto.subtle.verify("HMAC", key, signature, data);
}

export function parseSignedCookie(signedCookie: string) {
  return signedCookie.split(".")[0];
}
