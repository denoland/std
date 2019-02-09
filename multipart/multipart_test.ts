import { assertEqual, test } from "../testing/mod.ts";
import {
  matchAfterPrefix,
  MultipartReader,
  MultipartWriter,
  scanUntilBoundary
} from "./multipart.ts";
import { Buffer, open } from "deno";
import * as path from "../fs/path.ts";

const e = new TextEncoder();
const d = new TextDecoder();
const boundary = "--abcde";
const dashBoundary = e.encode("--" + boundary);
const nlDashBoundary = e.encode("\r\n--" + boundary);

test(function multipartScanUntilBoundary1() {
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

test(function multipartScanUntilBoundary2() {
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

test(function multipartScanUntilBoundary4() {
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

test(function multipartScanUntilBoundary3() {
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

test(function multipartMatchAfterPrefix1() {
  const data = `${boundary}\r`;
  const v = matchAfterPrefix(e.encode(data), e.encode(boundary), null);
  assertEqual(v, 1);
});

test(function multipartMatchAfterPrefix2() {
  const data = `${boundary}hoge`;
  const v = matchAfterPrefix(e.encode(data), e.encode(boundary), null);
  assertEqual(v, -1);
});

test(function multipartMatchAfterPrefix3() {
  const data = `${boundary}`;
  const v = matchAfterPrefix(e.encode(data), e.encode(boundary), null);
  assertEqual(v, 0);
});

test(async function multipartMultipartWriter() {
  const buf = new Buffer();
  const mw = new MultipartWriter(buf);
  await mw.writeField("foo", "foo");
  await mw.writeField("bar", "bar");
  const f = await open(path.resolve("./multipart/fixtures/sample.txt"), "r");
  await mw.writeFile("file", "sample.txt", f);
  await mw.close();
});

test(async function multipartMultipartReader() {
  // FIXME: path resolution
  const o = await open(path.resolve("./multipart/fixtures/sample.txt"));
  const mr = new MultipartReader(
    o,
    "--------------------------434049563556637648550474"
  );
  const form = await mr.readForm(10 << 20);
  assertEqual(form.get("foo"), "foo");
  assertEqual(form.get("bar"), "bar");
});
