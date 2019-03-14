import { test } from "../testing/mod.ts";
import { assert } from "../testing/asserts.ts";
import { readFileSync, readFile } from "./read_file.ts";
import * as path from "./path/mod.ts";

const testdataDir = path.resolve("fs", "testdata");

test(function testReadFileSync() {
  const jsonFile = path.join(testdataDir, "json_valid_obj.json");
  const strFile = readFileSync(jsonFile);
  assert(typeof strFile === "string");
  assert(strFile.length > 0);
});

test(async function testReadFile() {
  const jsonFile = path.join(testdataDir, "json_valid_obj.json");
  const strFile = await readFile(jsonFile);
  assert(typeof strFile === "string");
  assert(strFile.length > 0);
});
