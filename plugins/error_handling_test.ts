// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { createHttpError } from "std/http/http_errors.ts";
import { toErrorResponse } from "./error_handling.ts";
import { Status } from "std/http/http_status.ts";
import { assertEquals } from "std/assert/assert_equals.ts";
import { assertFalse } from "std/assert/assert_false.ts";

Deno.test("[middleware] toErrorResponse()", async (test) => {
  await test.step("Deno.errors.NotFound to HTTP 404 not found response", async () => {
    const resp = toErrorResponse(new Deno.errors.NotFound("Lost"));
    assertEquals(resp.status, Status.NotFound);
    assertFalse(resp.ok);
    assertEquals(await resp.text(), "Lost");
  });

  await test.step("Thrown HTTP-flavored errors", async () => {
    const resp1 = toErrorResponse(createHttpError(Status.NotFound));
    assertEquals(resp1.status, Status.NotFound);
    assertFalse(resp1.ok);
    assertEquals(await resp1.text(), "Not Found");

    const resp2 = toErrorResponse(
      createHttpError(Status.Unauthorized, "YOU SHALL NOT PASS", {
        headers: { wizard: "brown" },
      }),
    );
    assertEquals(resp2.status, Status.Unauthorized);
    assertFalse(resp2.ok);
    assertEquals(await resp2.text(), "YOU SHALL NOT PASS");
    assertEquals(resp2.headers.get("wizard"), "brown");
  });

  await test.step("Generic errors", async () => {
    const resp = toErrorResponse(new Error("It's a trap!"));
    assertEquals(resp.status, Status.InternalServerError);
    assertFalse(resp.ok);
    assertEquals(await resp.text(), "It's a trap!");
  });
});
