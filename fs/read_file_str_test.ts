import { test } from "../testing/mod.ts";
import { assert } from "../testing/asserts.ts";
import { readFileStrSync, readFileStr } from "./read_file_str.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(function testReadFileStrSync() {
  const jsonFile = path.join(testdataDir, "json_valid_obj.json");
  const strFile = readFileStrSync(jsonFile, "utf-8");
  assert(typeof strFile === "string");
  assert(strFile.length > 0);
});

test(async function testReadFileStr() {
  const jsonFile = path.join(testdataDir, "json_valid_obj.json");
  const strFile = await readFileStr(jsonFile, "utf-8");
  assert(typeof strFile === "string");
  assert(strFile.length > 0);
});
