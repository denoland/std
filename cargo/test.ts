import { test } from "../testing/mod.ts";
import { assertEquals, assert } from "../testing/asserts.ts";
import { testOp } from "./test_plugin/mod.ts";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

test(function testPluginTest(): void {
  const message = JSON.stringify({ test: "data" });
  const encodedMessage = textEncoder.encode(message);
  const response = testOp.dispatch(encodedMessage);
  assert(response instanceof Uint8Array);
  assertEquals(
    textDecoder.decode(response as Uint8Array),
    `Hello from native bindings. data: ${message} | zero_copy: NONE`
  );
  const response_zero_copy = testOp.dispatch(encodedMessage, encodedMessage);
  assert(response_zero_copy instanceof Uint8Array);
  assertEquals(
    textDecoder.decode(response_zero_copy as Uint8Array),
    `Hello from native bindings. data: ${message} | zero_copy: ${message}`
  );
});
