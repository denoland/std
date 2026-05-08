// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertInstanceOf } from "@std/assert";
import { HttpError } from "./unstable_error.ts";

Deno.test("HttpError", async (t) => {
  await t.step("initialises with correct defaults", () => {
    const error = new HttpError(500);
    assertInstanceOf(error, Error);
    assertEquals(error.name, "HttpError");
    assertEquals(error.status, 500);
    assertEquals(error.message, "Internal Server Error");
    assertEquals(error.cause, undefined);
    assertEquals(error.init, {
      status: 500,
      statusText: "Internal Server Error",
    });
  });

  await t.step("initialises with custom properties", () => {
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

  await t.step("defaults message to status text when omitted", () => {
    assertEquals(new HttpError(404).message, "Not Found");
    assertEquals(new HttpError(400).message, "Bad Request");
    assertEquals(new HttpError(503).message, "Service Unavailable");
  });

  await t.step(
    "merges init headers alongside default status and statusText",
    () => {
      const error = new HttpError(403, "Forbidden", {
        init: { headers: { "X-Custom": "value" } },
      });
      assertEquals(error.init.status, 403);
      assertEquals(error.init.statusText, "Forbidden");
      assertEquals(
        (error.init.headers as Record<string, string>)["X-Custom"],
        "value",
      );
    },
  );

  await t.step(
    "init.statusText reflects standard HTTP text, not custom message",
    () => {
      const error = new HttpError(403, "Access denied for this resource");
      assertEquals(error.message, "Access denied for this resource");
      assertEquals(error.init.statusText, "Forbidden");
    },
  );
});
