// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { jsonFormatter } from "./formatters.ts";
import { LogRecord } from "./logger.ts";

const makeRecord = (msg: string, args: unknown[] = []) =>
  new LogRecord({
    msg,
    args,
    level: 20,
    loggerName: "user-logger",
  });

Deno.test("jsonFormatter with just a message", function () {
  const result = JSON.parse(jsonFormatter(makeRecord("User service exploded")));

  assertEquals(result.level, "INFO");
  assertEquals(typeof result.datetime, "number");
  assertEquals(result.message, "User service exploded");
  assertEquals(Object.keys(result), ["level", "datetime", "message"]);
});

Deno.test("jsonFormatter with one argument", function () {
  const result = JSON.parse(
    jsonFormatter(makeRecord("User service exploded", [{ user: "Dave" }])),
  );

  assertEquals(result.level, "INFO");
  assertEquals(typeof result.datetime, "number");
  assertEquals(result.message, "User service exploded");
  assertEquals(result.args, { user: "Dave" });
  assertEquals(Object.keys(result), ["level", "datetime", "message", "args"]);
});

Deno.test("jsonFormatter with many arguments", function () {
  const result = JSON.parse(
    jsonFormatter(makeRecord("User service exploded", [1, true, 3, [], {}])),
  );

  assertEquals(result.level, "INFO");
  assertEquals(typeof result.datetime, "number");
  assertEquals(result.message, "User service exploded");
  assertEquals(result.args, [1, true, 3, [], {}]);
  assertEquals(Object.keys(result), ["level", "datetime", "message", "args"]);
});
