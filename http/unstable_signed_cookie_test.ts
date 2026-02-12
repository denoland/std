// Copyright 2018-2026 the Deno authors. MIT license.
import {
  parseSignedCookie,
  signCookie,
  verifySignedCookie,
} from "./unstable_signed_cookie.ts";
import { assertEquals } from "@std/assert";

Deno.test("signCookie() and verifySignedCookie() work circularly", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const value = "boris";

  const signedCookie = await signCookie(value, key);
  assertEquals(await verifySignedCookie(signedCookie, key), true);

  const tamperedCookie = signedCookie.replace(value, "xenia");
  assertEquals(await verifySignedCookie(tamperedCookie, key), false);
});

Deno.test("signCookie() and verifySignedCookie() work circularly when the cookie value contains a period", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const value = "boris.xenia";

  const signedCookie = await signCookie(value, key);
  assertEquals(await verifySignedCookie(signedCookie, key), true);

  const tamperedCookie = signedCookie.replace(value, "xenia");
  assertEquals(await verifySignedCookie(tamperedCookie, key), false);
});

Deno.test("verifySignedCookie() returns false on poorly formed value", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );

  assertEquals(await verifySignedCookie(".", key), false);
  assertEquals(await verifySignedCookie("hello.", key), false);
  assertEquals(await verifySignedCookie(".world", key), false);
});

Deno.test("parseSignedCookie() returns parsed cookie value", () => {
  const value = "tokyo";
  const signedCookie =
    `${value}.37f7481039762eef5cd46669f93c0a3214dfecba7d0cdc0b0dc40036063fb22e`;
  assertEquals(parseSignedCookie(signedCookie), value);
});

Deno.test("parseSignedCookie() returns parsed cookie value with name containing period", () => {
  const value = "tokyo.osaka";
  const signedCookie =
    `${value}.37f7481039762eef5cd46669f93c0a3214dfecba7d0cdc0b0dc40036063fb22e`;
  assertEquals(parseSignedCookie(signedCookie), value);
});
