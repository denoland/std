// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertInstanceOf } from "@std/assert";
import { HttpError } from "./unstable_error.ts";

Deno.test("HttpError initialises with correct defaults", () => {
  const error = new HttpError(500);
  assertInstanceOf(error, Error);
  assertEquals(error.name, "HttpError");
  assertEquals(error.status, 500);
  assertEquals(error.message, "Internal Server Error");
  assertEquals(error.cause, undefined);
  assertEquals(error.init, {
    status: 500,
  });
});

Deno.test("HttpError initialises with custom properties", () => {
  const error = new HttpError(401, "Unauthorized", {
    cause: new Error("Underlying error"),
    init: { headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' } },
  });
  assertInstanceOf(error, Error);
  assertEquals(error.name, "HttpError");
  assertEquals(error.status, 401);
  assertEquals(error.message, "Unauthorized");
  assertInstanceOf(error.cause, Error);
  assertEquals(error.cause?.message, "Underlying error");
  assertEquals(
    (error.init.headers as Record<string, string>)["WWW-Authenticate"],
    'Basic realm="Secure Area"',
  );
});
