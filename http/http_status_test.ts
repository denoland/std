// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import {
  isClientErrorStatus,
  isErrorStatus,
  isInformationalStatus,
  isRedirectStatus,
  isServerErrorStatus,
  isSuccessfulStatus,
  Status,
  STATUS_TEXT,
} from "./http_status.ts";
import { assert, assertEquals } from "../testing/asserts.ts";

Deno.test({
  name: "http/http_status - Status",
  fn() {
    // just spot check a few common codes
    assertEquals(Status.OK, 200);
    assertEquals(Status.NoContent, 204);
    assertEquals(Status.NotFound, 404);
    assertEquals(Status.InternalServerError, 500);
  },
});

Deno.test({
  name: "http/http_status - STATUS_TEXT",
  fn() {
    // just spot check a few common codes
    assertEquals(STATUS_TEXT[Status.OK], "OK");
    assertEquals(STATUS_TEXT[Status.NoContent], "No Content");
    assertEquals(STATUS_TEXT[Status.NotFound], "Not Found");
    assertEquals(
      STATUS_TEXT[Status.InternalServerError],
      "Internal Server Error",
    );
  },
});

Deno.test({
  name: "http/http_status - isInformationalStatus()",
  fn() {
    assert(isInformationalStatus(Status.Continue));
    assert(!isInformationalStatus(Status.OK));
    assert(isInformationalStatus(101));
    assert(!isInformationalStatus(300));
  },
});

Deno.test({
  name: "http/http_status - isSuccessfulStatus()",
  fn() {
    assert(isSuccessfulStatus(Status.OK));
    assert(!isSuccessfulStatus(Status.NotFound));
    assert(isSuccessfulStatus(204));
    assert(!isSuccessfulStatus(100));
  },
});

Deno.test({
  name: "http/http_status - isRedirectStatus()",
  fn() {
    assert(isRedirectStatus(Status.Found));
    assert(!isRedirectStatus(Status.NotFound));
    assert(isRedirectStatus(301));
    assert(!isRedirectStatus(200));
  },
});

Deno.test({
  name: "http/http_status - isClientErrorStatus()",
  fn() {
    assert(isClientErrorStatus(Status.NotFound));
    assert(!isClientErrorStatus(Status.InternalServerError));
    assert(isClientErrorStatus(400));
    assert(!isClientErrorStatus(503));
  },
});

Deno.test({
  name: "http/http_status - isServerErrorStatus()",
  fn() {
    assert(isServerErrorStatus(Status.InternalServerError));
    assert(!isServerErrorStatus(Status.NotFound));
    assert(isServerErrorStatus(503));
    assert(!isServerErrorStatus(400));
  },
});

Deno.test({
  name: "http/http_status - isErrorStatus()",
  fn() {
    assert(isErrorStatus(Status.InternalServerError));
    assert(isErrorStatus(Status.NotFound));
    assert(isErrorStatus(503));
    assert(isErrorStatus(400));
    assert(!isErrorStatus(Status.OK));
    assert(!isErrorStatus(Status.MovedPermanently));
    assert(!isErrorStatus(100));
    assert(!isErrorStatus(204));
  },
});
