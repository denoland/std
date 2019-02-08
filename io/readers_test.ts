import {assert, runTests, test} from "../testing/mod.ts";
import {MultiReader, StringReader} from "./readers.ts";
import {StringWriter} from "./writers.ts";
import {copy} from "deno";
import {copyN} from "./ioutil.ts";

const d = new TextDecoder();
test(async function testStringReader() {
  const r = new StringReader("abcdef")
  const {nread, eof} = await r.read(new Uint8Array(6))
  assert.equal(nread, 6)
  assert.equal(eof, true)
});
test(async function testStringReader() {
  const r = new StringReader("abcdef")
  const buf = new Uint8Array(3);
  let res1 = await r.read(buf);
  assert.equal(res1.nread, 3)
  assert.equal(res1.eof, false)
  assert.equal(d.decode(buf), "abc")
  let res2 = await r.read(buf)
  assert.equal(res2.nread, 3)
  assert.equal(res2.eof, true)
  assert.equal(d.decode(buf), "def")
});
test(async function testMultiReader() {
  const r = new MultiReader(
    new StringReader("abc"),
    new StringReader("def")
  )
  const w = new StringWriter();
  const n = await copyN(w, r, 4)
  assert.equal(n, 4);
  assert.equal(w.toString(), "abcd")
  await copy(w, r)
  assert.equal(w.toString(), "abcdef")
});
