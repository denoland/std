import { assert, test } from "../testing/mod.ts";
import { FormFile } from "./formfile.ts";
import * as path from "../fs/path.ts";

test(async function multipartFormFile1() {
  const f = new FormFile({
    filename: "file",
    headers: new Headers({
      "content-type": "text/plain"
    }),
    content: new Uint8Array(new TextEncoder().encode("deno"))
  });
  assert.equal(f.size, 4);
  assert.equal(f.name, "file");
  assert.equal(f.type, "text/plain");
  const file = await f.open();
  assert.assert(!!file);
  file.close();
});

test(async function multipartFormFile2() {
  const f = new FormFile({
    filename: "__sample.txt",
    headers: new Headers({
      "content-type": "text/plain"
    }),
    // FIXME: path cannot be resolved unless test executed by project root
    tempfile: path.resolve("./multipart/fixtures/sample.txt")
  });
  assert.equal(f.size, null);
  assert.equal(f.name, "__sample.txt");
  assert.equal(f.type, "text/plain");
  const file = await f.open();
  assert.assert(!!file);
  file.close();
});
