import * as path from "../path/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { isSamePath } from "./same_path.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("isSamePath", function () {
  const path1 = path.join(testdataDir, "path");
  const path2 = new URL(path.join(testdataDir, "path"), "file://");
  const path3 = path2.href;
  const path4 = new URL(path.join(testdataDir, "path2"), "file://");

  assertEquals(isSamePath(path1, path1), true);
  assertEquals(isSamePath(path1, path2), true);
  assertEquals(isSamePath(path1, path3), true);
  assertEquals(isSamePath(path1, path4), false);
});
