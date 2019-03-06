const { copy } = Deno;
import { test } from "../testing/mod.ts";
import { assertEqual } from "../testing/asserts.ts";
import { MultiReader, StringReader } from "./readers.ts";
import { StringWriter } from "./writers.ts";
import { copyN } from "./ioutil.ts";
import { decode } from "../strings/strings.ts";

test(async function ioStringReader() {
  const r = new StringReader("abcdef");
  const { nread, eof } = await r.read(new Uint8Array(6));
  assertEqual(nread, 6);
  assertEqual(eof, true);
});

test(async function ioStringReader() {
  const r = new StringReader("abcdef");
  const buf = new Uint8Array(3);
  let res1 = await r.read(buf);
  assertEqual(res1.nread, 3);
  assertEqual(res1.eof, false);
  assertEqual(decode(buf), "abc");
  let res2 = await r.read(buf);
  assertEqual(res2.nread, 3);
  assertEqual(res2.eof, true);
  assertEqual(decode(buf), "def");
});

test(async function ioMultiReader() {
  const r = new MultiReader(new StringReader("abc"), new StringReader("def"));
  const w = new StringWriter();
  const n = await copyN(w, r, 4);
  assertEqual(n, 4);
  assertEqual(w.toString(), "abcd");
  await copy(w, r);
  assertEqual(w.toString(), "abcdef");
});
