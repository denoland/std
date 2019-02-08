import {assertEqual, runTests, setFilter, test} from "../testing/mod.ts";
import {
  matchAfterPrefix,
  MultipartReader,
  MultipartWriter,
  scanUntilBoundary
} from "./multipart.ts";
import {args, Buffer, cwd, open} from "deno";
import * as path from "../fs/path.ts"

const e = new TextEncoder();
const d = new TextDecoder();
const boundary = "--abcde";
const dashBoundary = e.encode("--" + boundary);
const nlDashBoundary = e.encode("\r\n--" + boundary);
test(function testScanUntilBoundary1() {
  const data = `--${boundary}`;
  const [n, err] = scanUntilBoundary(
    e.encode(data),
    dashBoundary,
    nlDashBoundary,
    0,
    "EOF"
  );
  assertEqual(n, 0);
  assertEqual(err, "EOF");
});
test(function testScanUntilBoundary2() {
  const data = `foo\r\n--${boundary}`;
  const [n, err] = scanUntilBoundary(
    e.encode(data),
    dashBoundary,
    nlDashBoundary,
    0,
    "EOF"
  );
  assertEqual(n, 3);
  assertEqual(err, "EOF");
});
test(function testScanUntilBoundary4() {
  const data = `foo\r\n--`;
  const [n, err] = scanUntilBoundary(
    e.encode(data),
    dashBoundary,
    nlDashBoundary,
    0,
    null
  );
  assertEqual(n, 3);
  assertEqual(err, null);
});
test(function testScanUntilBoundary3() {
  const data = `foobar`;
  const [n, err] = scanUntilBoundary(
    e.encode(data),
    dashBoundary,
    nlDashBoundary,
    0,
    null
  );
  assertEqual(n, data.length);
  assertEqual(err, null);
});

test(function testMatchAfterPrefix1() {
  const data = `${boundary}\r`;
  const v = matchAfterPrefix(e.encode(data), e.encode(boundary), null);
  assertEqual(v, 1);
});
test(function testMatchAfterPrefix2() {
  const data = `${boundary}hoge`;
  const v = matchAfterPrefix(e.encode(data), e.encode(boundary), null);
  assertEqual(v, -1);
});
test(function testMatchAfterPrefix3() {
  const data = `${boundary}`;
  const v = matchAfterPrefix(e.encode(data), e.encode(boundary), null);
  assertEqual(v, 0);
});
test(async function testWriter() {
  const buf = new Buffer();
  const mw = new MultipartWriter(buf);
  await mw.writeField("foo", "foo");
  await mw.writeField("bar", "bar");
  const f = await open("./tsconfig.json", "r");
  await mw.writeFile("file", "tsconfig.json", f);
  await mw.close();
});
test(async function testReader() {
  const __file__ = path.resolve(cwd(), args[0]);
  const __dir__ = path.dirname(__file__);
  const o = await open(path.resolve(__dir__, "./fixtures/sample.txt"));
  const mr = new MultipartReader(
    o,
    "--------------------------434049563556637648550474"
  );
  const form = await mr.readForm(10 << 20);
  assertEqual(form.get("foo"), "foo");
  assertEqual(form.get("bar"), "bar");
});
