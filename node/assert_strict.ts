import { strict } from "./assert.ts";

export const {
  fail,
  AssertionError,
  ok,
  equal,
  notEqual,
  deepEqual,
  notDeepEqual,
  deepStrictEqual,
  notDeepStrictEqual,
  strictEqual,
  notStrictEqual,
  throws,
  rejects,
  doesNotThrow,
  doesNotReject,
  ifError,
  match,
  doesNotMatch,
  CallTracker,
} = strict;

export { strict };
export default strict;
