// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import {
  createProblemDetailsResponse,
  isProblemDetailsResponse,
  parseProblemDetails,
  type ProblemDetails,
  type StandardProblemDetailsMember,
} from "./unstable_problem_details.ts";

// --- createProblemDetailsResponse ---

Deno.test("createProblemDetailsResponse() defaults type, title, Content-Type and response status", async () => {
  const response = createProblemDetailsResponse({
    status: 404,
    detail: "No user found with ID 42",
  });
  assertEquals(response.status, 404);
  assertEquals(
    response.headers.get("Content-Type"),
    "application/problem+json",
  );
  const body = await response.json();
  assertEquals(body.type, "about:blank");
  assertEquals(body.status, 404);
  assertEquals(body.title, "Not Found");
  assertEquals(body.detail, "No user found with ID 42");
});

Deno.test("createProblemDetailsResponse() custom problem type with extensions", async () => {
  const response = createProblemDetailsResponse({
    type: "https://example.com/problems/insufficient-credit",
    status: 403,
    title: "Insufficient credit",
    detail: "Your account balance is too low",
    instance: "/account/12345/transactions/abc",
    balance: 30,
    accounts: ["/account/12345", "/account/67890"],
  });
  assertEquals(response.status, 403);
  const body = await response.json();
  assertEquals(body.type, "https://example.com/problems/insufficient-credit");
  assertEquals(body.title, "Insufficient credit");
  assertEquals(body.detail, "Your account balance is too low");
  assertEquals(body.instance, "/account/12345/transactions/abc");
  assertEquals(body.balance, 30);
  assertEquals(body.accounts, ["/account/12345", "/account/67890"]);
});

Deno.test("createProblemDetailsResponse() defaults status to 500 and type/title when given empty object", async () => {
  const response = createProblemDetailsResponse({});
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.type, "about:blank");
  assertEquals(body.status, 500);
  assertEquals(body.title, "Internal Server Error");
});

Deno.test("createProblemDetailsResponse() does not override explicit title for about:blank", async () => {
  const response = createProblemDetailsResponse({
    type: "about:blank",
    status: 404,
    title: "Custom title",
  });
  const body = await response.json();
  assertEquals(body.title, "Custom title");
});

Deno.test("createProblemDetailsResponse() custom type does not auto-populate title", async () => {
  const response = createProblemDetailsResponse({
    type: "https://example.com/problems/out-of-stock",
    status: 409,
  });
  const body = await response.json();
  assertEquals(body.title, undefined);
});

Deno.test("createProblemDetailsResponse() about:blank with unknown status omits title", async () => {
  const response = createProblemDetailsResponse({ status: 299 });
  const body = await response.json();
  assertEquals(body.type, "about:blank");
  assertEquals(body.status, 299);
  assertEquals(body.title, undefined);
});

Deno.test("createProblemDetailsResponse() merges custom headers and overwrites Content-Type", () => {
  const response = createProblemDetailsResponse(
    { status: 400 },
    {
      headers: {
        "X-Request-Id": "abc-123",
        "Content-Type": "application/json",
      },
    },
  );
  assertEquals(response.headers.get("X-Request-Id"), "abc-123");
  assertEquals(
    response.headers.get("Content-Type"),
    "application/problem+json",
  );
});

Deno.test("createProblemDetailsResponse() options without headers uses fast path", () => {
  const response = createProblemDetailsResponse(
    { status: 400 },
    {},
  );
  assertEquals(response.status, 400);
  assertEquals(
    response.headers.get("Content-Type"),
    "application/problem+json",
  );
});

Deno.test("createProblemDetailsResponse() all five standard members round-trip", async () => {
  const response = createProblemDetailsResponse({
    type: "about:blank",
    status: 422,
    title: "Unprocessable Entity",
    detail: "Validation failed",
    instance: "/orders/123",
  });
  const body = await response.json();
  assertEquals(body.type, "about:blank");
  assertEquals(body.status, 422);
  assertEquals(body.title, "Unprocessable Entity");
  assertEquals(body.detail, "Validation failed");
  assertEquals(body.instance, "/orders/123");
});

// --- parseProblemDetails (Response) ---

Deno.test("parseProblemDetails() from Response returns correct fields", async () => {
  const response = new Response(
    JSON.stringify({
      type: "about:blank",
      status: 400,
      title: "Bad Request",
      detail: "Invalid payload",
    }),
    {
      headers: { "Content-Type": "application/problem+json" },
    },
  );
  const problem = await parseProblemDetails(response);
  assertEquals(problem.type, "about:blank");
  assertEquals(problem.status, 400);
  assertEquals(problem.title, "Bad Request");
  assertEquals(problem.detail, "Invalid payload");
});

Deno.test("parseProblemDetails() from plain object returns correct fields with extensions", () => {
  const problem = parseProblemDetails<{ balance: number; accounts: string[] }>({
    type: "about:blank",
    status: 403,
    title: "Forbidden",
    detail: "Insufficient credit",
    instance: "/account/12345/transactions/abc",
    balance: 30,
    accounts: ["/a", "/b"],
  });
  assertEquals(problem.type, "about:blank");
  assertEquals(problem.status, 403);
  assertEquals(problem.title, "Forbidden");
  assertEquals(problem.detail, "Insufficient credit");
  assertEquals(problem.instance, "/account/12345/transactions/abc");
  assertEquals(problem.balance, 30);
  assertEquals(problem.accounts, ["/a", "/b"]);
});

Deno.test("parseProblemDetails() ignores status when not a finite integer", () => {
  for (
    const value of [
      "404",
      NaN,
      Infinity,
      404.5,
    ] as unknown[]
  ) {
    const problem = parseProblemDetails(
      { status: value } as Record<string, unknown>,
    );
    assertEquals(
      problem.status,
      undefined,
      `status=${value} should be ignored`,
    );
  }
});

Deno.test("parseProblemDetails() ignores standard string members with wrong types", () => {
  const problem = parseProblemDetails({
    type: 123,
    title: 999,
    detail: {},
    instance: null,
    status: 400,
  });
  assertEquals(problem.type, undefined);
  assertEquals(problem.title, undefined);
  assertEquals(problem.detail, undefined);
  assertEquals(problem.instance, undefined);
  assertEquals(problem.status, 400);
});

Deno.test("parseProblemDetails() missing members remain absent", () => {
  const problem = parseProblemDetails({
    detail: "Only detail",
  });
  assertEquals(problem.type, undefined);
  assertEquals(problem.status, undefined);
  assertEquals(problem.title, undefined);
  assertEquals(problem.detail, "Only detail");
  assertEquals(problem.instance, undefined);
});

Deno.test("parseProblemDetails() excludes inherited prototype properties", () => {
  const proto = { inherited: "should-be-excluded" };
  const obj = Object.create(proto) as Record<string, unknown>;
  obj.status = 400;
  const problem = parseProblemDetails(obj);
  assertEquals(problem.status, 400);
  assertEquals(
    (problem as Record<string, unknown>).inherited,
    undefined,
  );
});

Deno.test("parseProblemDetails() throws TypeError for null input", () => {
  assertThrows(
    () => parseProblemDetails(null as unknown as Record<string, unknown>),
    TypeError,
    "Cannot parse Problem Details: expected a JSON object",
  );
});

Deno.test("parseProblemDetails() throws TypeError for array input", () => {
  assertThrows(
    () => parseProblemDetails([] as unknown as Record<string, unknown>),
    TypeError,
    "Cannot parse Problem Details: expected a JSON object",
  );
});

Deno.test("parseProblemDetails() throws TypeError for primitive input", () => {
  assertThrows(
    () => parseProblemDetails("string" as unknown as Record<string, unknown>),
    TypeError,
    "Cannot parse Problem Details: expected a JSON object",
  );
});

Deno.test("parseProblemDetails() from Response rejects for non-JSON body", async () => {
  const response = new Response("not json", {
    headers: { "Content-Type": "application/problem+json" },
  });
  await assertRejects(
    () => parseProblemDetails(response),
    SyntaxError,
  );
});

Deno.test("parseProblemDetails() from Response rejects for JSON array body", async () => {
  const response = new Response(JSON.stringify([1, 2, 3]));
  await assertRejects(
    () => parseProblemDetails(response),
    TypeError,
    "Cannot parse Problem Details: expected a JSON object",
  );
});

// --- isProblemDetailsResponse ---

Deno.test("isProblemDetailsResponse() returns true for application/problem+json", () => {
  const response = new Response(null, {
    headers: { "Content-Type": "application/problem+json" },
  });
  assertEquals(isProblemDetailsResponse(response), true);
});

Deno.test("isProblemDetailsResponse() returns true with charset parameter", () => {
  const response = new Response(null, {
    headers: {
      "Content-Type": "application/problem+json; charset=utf-8",
    },
  });
  assertEquals(isProblemDetailsResponse(response), true);
});

Deno.test("isProblemDetailsResponse() returns false for application/json", () => {
  const response = new Response(null, {
    headers: { "Content-Type": "application/json" },
  });
  assertEquals(isProblemDetailsResponse(response), false);
});

Deno.test("isProblemDetailsResponse() returns false for missing Content-Type", () => {
  const response = new Response(null);
  assertEquals(isProblemDetailsResponse(response), false);
});

Deno.test("isProblemDetailsResponse() is case insensitive", () => {
  const response = new Response(null, {
    headers: { "Content-Type": "APPLICATION/PROBLEM+JSON" },
  });
  assertEquals(isProblemDetailsResponse(response), true);
});

// --- Round-trip tests ---

Deno.test("createProblemDetailsResponse() then parseProblemDetails() round-trips with extensions", async () => {
  const response = createProblemDetailsResponse({
    status: 422,
    detail: "Validation failed",
    errors: [{ field: "email", message: "required" }],
  });
  const parsed = await parseProblemDetails<
    { errors: { field: string; message: string }[] }
  >(response);
  assertEquals(parsed.type, "about:blank");
  assertEquals(parsed.status, 422);
  assertEquals(parsed.title, "Unprocessable Entity");
  assertEquals(parsed.detail, "Validation failed");
  assertEquals(parsed.errors, [{ field: "email", message: "required" }]);
});

// --- Type-level tests ---

Deno.test("parseProblemDetails() return type is ProblemDetails", () => {
  const problem = parseProblemDetails({
    status: 404,
    detail: "Not found",
  });
  assertType<IsExact<typeof problem, ProblemDetails>>(true);
});

Deno.test("StandardProblemDetailsMember is the five standard keys", () => {
  const keys: StandardProblemDetailsMember[] = [
    "type",
    "status",
    "title",
    "detail",
    "instance",
  ];
  assertType<IsExact<StandardProblemDetailsMember, (typeof keys)[number]>>(
    true,
  );
});

Deno.test("createProblemDetailsResponse() accepts ProblemDetails with extensions", () => {
  const pd: ProblemDetails<{ balance: number }> = {
    status: 403,
    detail: "Low balance",
    balance: 30,
  };
  const response = createProblemDetailsResponse(pd);
  assertEquals(response.status, 403);
});
