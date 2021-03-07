import { assertStrictEquals } from "../../testing/asserts.ts";
import { quoteCmdArg } from "./_quote_cmd_arg.ts";

Deno.test("[node/_child_process] quoteCmdArg", () => {
  assertStrictEquals(quoteCmdArg('hello"world'), '"hello\\"world"');
  assertStrictEquals(quoteCmdArg('hello""world'), '"hello\\"\\"world"');
  assertStrictEquals(quoteCmdArg("hello\\world"), "hello\\world");
  assertStrictEquals(quoteCmdArg("hello\\\\world"), "hello\\\\world");
  assertStrictEquals(quoteCmdArg('hello\\"world'), '"hello\\\\\\"world"');
  assertStrictEquals(quoteCmdArg('hello\\\\"world'), '"hello\\\\\\\\\\"world"');
  assertStrictEquals(quoteCmdArg("hello world\\"), '"hello world\\\\"');
});
