import {
  bytesFindIndex,
  bytesFindLastIndex,
  bytesEqual,
  bytesHasPrefix
} from "./bytes.ts";
import { assertEqual, runTests, test } from "./deps.ts";

test(function testFindIndex() {
  const i = bytesFindIndex(
    new Uint8Array([1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2])
  );
  assertEqual(i, 2);
});
test(function testFindLastIndex() {
  const i = bytesFindLastIndex(
    new Uint8Array([0, 1, 2, 0, 1, 2, 0, 1, 3]),
    new Uint8Array([0, 1, 2])
  );
  assertEqual(i, 3);
});
test(function testBytesEqual() {
  const v = bytesEqual(
    new Uint8Array([0, 1, 2, 3]),
    new Uint8Array([0, 1, 2, 3])
  );
  assertEqual(v, true);
});
test(function testBytesHasPrefix() {
  const v = bytesHasPrefix(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1]));
  assertEqual(v, true);
});
runTests();
