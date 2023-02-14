// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertRejects } from "../testing/asserts.ts";
import { StringReader } from "../io/string_reader.ts";
import { StringWriter } from "../io/string_writer.ts";
import { readDelim } from "../io/read_delim.ts";

import {
  type Command,
  pipelineCommands,
  readReplies,
  readReply,
  type Reply,
  sendCommand,
  writeCommand,
} from "./mod.ts";

/**
 * Sections:
 * 1. Request
 * 2. Reply
 * 3. Combined
 */

/** 1. Request */

Deno.test("write command", async () => {
  const writer = new StringWriter();
  await writeCommand(writer, ["LLEN", "mylist", 42]);
  assertEquals(
    writer.toString(),
    "*3\r\n$4\r\nLLEN\r\n$6\r\nmylist\r\n$2\r\n42\r\n",
  );
});

/** 2. Reply */

const encoder = new TextEncoder();

const CRLF = "\r\n";

async function readReplyTest(output: string, expected: Reply) {
  assertEquals(
    await readReply(readDelim(new StringReader(output), encoder.encode(CRLF))),
    expected,
  );
}

async function readReplyRejectTest(output: string, expected: string) {
  await assertRejects(
    async () =>
      await readReply(
        readDelim(new StringReader(output), encoder.encode(CRLF)),
      ),
    expected,
  );
}

Deno.test("mixed array", async () =>
  await readReplyTest("*3\r\n$5\r\nstring\r\n:123\r\n$-1", [
    "string",
    123,
    null,
  ]));

Deno.test("empty array", async () => await readReplyTest("*0\r\n", []));

Deno.test("null array", async () => await readReplyTest("*-1\r\n", null));

Deno.test("nested array", async () =>
  await readReplyTest("*2\r\n*3\r\n:1\r\n$5\r\nhello\r\n:2\r\n#f\r\n", [[
    1,
    "hello",
    2,
  ], false]));

Deno.test("attribute", async () => {
  await readReplyTest(
    "|1\r\n+key-popularity\r\n%2\r\n$1\r\na\r\n,0.1923\r\n$1\r\nb\r\n,0.0012\r\n*2\r\n:2039123\r\n:9543892\r\n",
    [2039123, 9543892],
  );
  await readReplyTest("*3\r\n:1\r\n:2\r\n|1\r\n+ttl\r\n:3600\r\n:3\r\n", [
    1,
    2,
    3,
  ]);
});

Deno.test("positive big number", async () =>
  await readReplyTest(
    "(3492890328409238509324850943850943825024385\r\n",
    3492890328409238509324850943850943825024385n,
  ));

Deno.test("negative big number", async () =>
  await readReplyTest(
    "(-3492890328409238509324850943850943825024385\r\n",
    -3492890328409238509324850943850943825024385n,
  ));

Deno.test("true boolean", async () => await readReplyTest("#t\r\n", true));

Deno.test("false boolean", async () => await readReplyTest("#f\r\n", false));

Deno.test("integer", async () => await readReplyTest(":42\r\n", 42));

Deno.test("bulk string", async () =>
  await readReplyTest("$5\r\nhello\r\n", "hello"));

Deno.test("emtpy bulk string", async () =>
  await readReplyTest("$0\r\n\r\n", ""));

Deno.test("null bulk string", async () => await readReplyTest("$-1\r\n", null));

Deno.test("raw bulk string", async () => {
  const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assertEquals(await sendCommand(redisConn, ["SET", "binary", data]), "OK");
  assertEquals(await sendCommand(redisConn, ["GET", "binary"], true), data);
});

Deno.test("blob error", async () => {
  await readReplyRejectTest(
    "!21\r\nSYNTAX invalid syntax\r\n",
    "SYNTAX invalid syntax",
  );
});

Deno.test("error", async () => {
  await readReplyRejectTest(
    "-ERR this is the error description\r\n",
    "ERR this is the error description",
  );
});

Deno.test("double", async () => await readReplyTest(",1.23\r\n", 1.23));

Deno.test("positive infinity double", async () =>
  await readReplyTest(",inf\r\n", Infinity));

Deno.test("negative infinity double", async () =>
  await readReplyTest(",-inf\r\n", -Infinity));

Deno.test("map", async () =>
  await readReplyTest("%2\r\n+first\r\n:1\r\n+second\r\n:2\r\n", {
    first: 1,
    second: 2,
  }));

Deno.test("null", async () => await readReplyTest("_\r\n", null));

Deno.test("push", async () => {
  await readReplyTest(
    ">4\r\n+pubsub\r\n+message\r\n+somechannel\r\n+this is the message\r\n",
    ["pubsub", "message", "somechannel", "this is the message"],
  );
});

Deno.test("set", async () => {
  await readReplyTest(
    "~5\r\n+orange\r\n+apple\r\n#t\r\n:100\r\n:999\r\n",
    new Set(["orange", "apple", true, 100, 999]),
  );
});

Deno.test("simple string", async () => await readReplyTest("+OK\r\n", "OK"));

Deno.test("streamed string", async () => {
  await readReplyTest(
    "$?\r\n;4\r\nHell\r\n;5\r\no wor\r\n;1\r\nd\r\n;0\r\n",
    "Hello word",
  );
});

/** @todo test more complex case */
Deno.test("streamed array", async () => {
  await readReplyTest("*?\r\n:1\r\n:2\r\n:3\r\n.\r\n", [1, 2, 3]);
});

Deno.test("streamed set", async () => {
  await readReplyTest(
    "~?\r\n+a\r\n:1\r\n+b\r\n:2\r\n.\r\n",
    new Set(["a", 1, "b", 2]),
  );
});

Deno.test("streamed map", async () => {
  await readReplyTest("%?\r\n+a\r\n:1\r\n+b\r\n:2\r\n.\r\n", { a: 1, b: 2 });
});

Deno.test("verbatim string", async () => {
  await readReplyTest("=15\r\ntxt:Some string\r\n", "txt:Some string");
});

Deno.test("large reply", async () => {
  const reply = "a".repeat(4096 * 2);
  await readReplyTest(`$${reply.length}\r\n${reply}\r\n`, reply);
});

/** 3. Combined */

const PORT = 6379;
const redisConn = await Deno.connect({ port: PORT });

await sendCommand(redisConn, ["FLUSHALL"]);

async function sendCommandTest(
  command: Command,
  expected: Reply,
): Promise<void> {
  assertEquals(await sendCommand(redisConn, command), expected);
}

Deno.test("transactions", async () => {
  await sendCommandTest(["MULTI"], "OK");
  await sendCommandTest(["INCR", "FOO"], "QUEUED");
  await sendCommandTest(["INCR", "BAR"], "QUEUED");
  await sendCommandTest(["EXEC"], [1, 1]);
});

Deno.test("pipelining", async () => {
  assertEquals(
    await pipelineCommands(redisConn, [
      ["INCR", "X"],
      ["INCR", "X"],
      ["INCR", "X"],
      ["INCR", "X"],
    ]),
    [1, 2, 3, 4],
  );
});

Deno.test("write-only and listening", async () => {
  await writeCommand(redisConn, ["SUBSCRIBE", "mychannel"]);
  const iterator = readReplies(redisConn);
  assertEquals(await iterator.next(), {
    value: ["subscribe", "mychannel", 1],
    done: false,
  });
  await writeCommand(redisConn, ["UNSUBSCRIBE"]);
  assertEquals(await iterator.next(), {
    value: ["unsubscribe", "mychannel", 0],
    done: false,
  });
});

Deno.test("eval script", async () => {
  await sendCommandTest(["EVAL", "return ARGV[1]", 0, "hello"], "hello");
});

Deno.test("Lua script", async () => {
  await sendCommandTest([
    "FUNCTION",
    "LOAD",
    "#!lua name=mylib\nredis.register_function('knockknock', function() return 'Who\\'s there?' end)",
  ], "mylib");
  await sendCommandTest(["FCALL", "knockknock", 0], "Who's there?");
});

Deno.test("RESP3", async () => {
  await sendCommand(redisConn, ["HELLO", 3]);
  await sendCommandTest(["HSET", "hash3", "foo", 1, "bar", 2], 2);
  await sendCommandTest(["HGETALL", "hash3"], {
    foo: "1",
    bar: "2",
  });
});

Deno.test("no reply", async () => {
  await assertRejects(
    async () => await sendCommand(redisConn, ["SHUTDOWN"]),
    TypeError,
    "No reply received",
  );
});

addEventListener("unload", () => redisConn.close());
