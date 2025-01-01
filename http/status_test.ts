// Copyright 2018-2025 the Deno authors. MIT license.

import {
  isClientErrorStatus,
  isErrorStatus,
  isInformationalStatus,
  isRedirectStatus,
  isServerErrorStatus,
  isSuccessfulStatus,
  STATUS_CODE,
  STATUS_TEXT,
} from "./status.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test({
  name: "STATUS_CODE",
  fn() {
    // just spot check a few common codes
    assertEquals(STATUS_CODE.OK, 200);
    assertEquals(STATUS_CODE.NoContent, 204);
    assertEquals(STATUS_CODE.NotFound, 404);
    assertEquals(STATUS_CODE.InternalServerError, 500);
  },
});

Deno.test({
  name: "STATUS_TEXT",
  fn() {
    // just spot check a few common codes
    assertEquals(STATUS_TEXT[STATUS_CODE.OK], "OK");
    assertEquals(STATUS_TEXT[STATUS_CODE.NoContent], "No Content");
    assertEquals(STATUS_TEXT[STATUS_CODE.NotFound], "Not Found");
    assertEquals(
      STATUS_TEXT[STATUS_CODE.InternalServerError],
      "Internal Server Error",
    );
  },
});

Deno.test({
  name: "isInformationalStatus()",
  fn() {
    assert(isInformationalStatus(STATUS_CODE.Continue));
    assert(!isInformationalStatus(STATUS_CODE.OK));
    assert(isInformationalStatus(101));
    assert(!isInformationalStatus(300));
  },
});

Deno.test({
  name: "isSuccessfulStatus()",
  fn() {
    assert(isSuccessfulStatus(STATUS_CODE.OK));
    assert(!isSuccessfulStatus(STATUS_CODE.NotFound));
    assert(isSuccessfulStatus(204));
    assert(!isSuccessfulStatus(100));
  },
});

Deno.test({
  name: "isRedirectStatus()",
  fn() {
    assert(isRedirectStatus(STATUS_CODE.Found));
    assert(!isRedirectStatus(STATUS_CODE.NotFound));
    assert(isRedirectStatus(301));
    assert(!isRedirectStatus(200));
  },
});

Deno.test({
  name: "isClientErrorStatus()",
  fn() {
    assert(isClientErrorStatus(STATUS_CODE.NotFound));
    assert(!isClientErrorStatus(STATUS_CODE.InternalServerError));
    assert(isClientErrorStatus(400));
    assert(!isClientErrorStatus(503));
  },
});

Deno.test({
  name: "isServerErrorStatus()",
  fn() {
    assert(isServerErrorStatus(STATUS_CODE.InternalServerError));
    assert(!isServerErrorStatus(STATUS_CODE.NotFound));
    assert(isServerErrorStatus(503));
    assert(!isServerErrorStatus(400));
  },
});

Deno.test({
  name: "isErrorStatus()",
  fn() {
    assert(isErrorStatus(STATUS_CODE.InternalServerError));
    assert(isErrorStatus(STATUS_CODE.NotFound));
    assert(isErrorStatus(503));
    assert(isErrorStatus(400));
    assert(!isErrorStatus(STATUS_CODE.OK));
    assert(!isErrorStatus(STATUS_CODE.MovedPermanently));
    assert(!isErrorStatus(100));
    assert(!isErrorStatus(204));
  },
});
