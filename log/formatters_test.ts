// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { FakeTime } from "@std/testing/time";
import { jsonFormatter } from "./formatters.ts";
import { LogRecord } from "./logger.ts";

const log = (msg: string, args: unknown[] = []) =>
  new LogRecord({
    msg,
    args,
    level: 20,
    loggerName: "user-logger",
  });

Deno.test("jsonFormatter() handles messages without arguments", function () {
  using _time = new FakeTime(1);

  assertEquals(
    jsonFormatter(log("msg")),
    `{"level":"INFO","datetime":1,"message":"msg"}`,
  );
});

Deno.test("jsonFormatter() handles messages with one arguments", function () {
  using _time = new FakeTime(1);

  assertEquals(
    jsonFormatter(log("msg", [{ user: "Dave" }])),
    `{"level":"INFO","datetime":1,"message":"msg","args":{"user":"Dave"}}`,
  );
});

Deno.test("jsonFormatter() handles messages with many arguments", function () {
  using _time = new FakeTime(1);

  assertEquals(
    jsonFormatter(log("msg", [1, true, null, [], {}])),
    `{"level":"INFO","datetime":1,"message":"msg","args":[1,true,null,[],{}]}`,
  );
});
