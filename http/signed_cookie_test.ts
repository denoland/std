// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { signCookie, verifyCookie } from "./signed_cookie.ts";
import { assertEquals } from "../assert/assert_equals.ts";

Deno.test("signCookie() and verifyCookie() work circularly", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const value = "boris";

  const signedCookie = await signCookie(value, key);
  assertEquals(await verifyCookie(signedCookie, key), true);

  const tamperedCookie = signedCookie.replace(value, "xenia");
  assertEquals(await verifyCookie(tamperedCookie, key), false);
});

Deno.test("verifyCookie() returns false on poorly formed value", async () => {
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );

  assertEquals(await verifyCookie(".", key), false);
  assertEquals(await verifyCookie("hello.", key), false);
  assertEquals(await verifyCookie(".world", key), false);
});
