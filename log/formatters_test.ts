// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { FakeTime } from "../testing/time.ts";
import { jsonFormatter } from "./formatters.ts";
import { LogRecord } from "./logger.ts";

const log = (msg: string, args: unknown[] = []) =>
  new LogRecord({
    msg,
    args,
    level: 20,
    loggerName: "user-logger",
  });

Deno.test("jsonFormatter with just a message", function () {
  using _time = new FakeTime(1);

  assertEquals(
    jsonFormatter(log("msg")),
    `{"level":"INFO","datetime":1,"message":"msg"}`,
  );
});

Deno.test("jsonFormatter with one argument", function () {
  using _time = new FakeTime(1);

  assertEquals(
    jsonFormatter(log("msg", [{ user: "Dave" }])),
    `{"level":"INFO","datetime":1,"message":"msg","args":{"user":"Dave"}}`,
  );
});

Deno.test("jsonFormatter with many arguments", function () {
  using _time = new FakeTime(1);

  assertEquals(
    jsonFormatter(log("msg", [1, true, null, [], {}])),
    `{"level":"INFO","datetime":1,"message":"msg","args":[1,true,null,[],{}]}`,
  );
});
