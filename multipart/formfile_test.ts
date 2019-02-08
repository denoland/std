import {assert, runTests, test} from "../testing/mod.ts";
import {FormFile} from "./formfile.ts";
import * as path from "../fs/path.ts"
import {args, cwd} from "deno";

test(async function testFormFile1() {
  const f = new FormFile({
    filename: "file",
    headers: new Headers({
      "content-type": "text/plain"
    }),
    content: new Uint8Array(new TextEncoder().encode("deno"))
  });
  assert.equal(f.size, 4);
  assert.equal(f.name, "file");
  assert.equal(f.type, "text/plain")
  const file = await f.open();
  assert.assert(!!file);
  file.close();
});

test(async function testFormFile2() {
  const dir = path.dirname(path.resolve(cwd(), args[0]));
  const f = new FormFile({
    filename: "__sample.txt",
    headers: new Headers({
      "content-type": "text/plain"
    }),
    tempfile: path.resolve(dir, "./fixtures/sample.txt")
  });
  assert.equal(f.size, null)
  assert.equal(f.name, "__sample.txt")
  assert.equal(f.type, "text/plain")
  const file = await f.open();
  assert.assert(!!file);
  file.close();
});
