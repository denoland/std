// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "./mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { findTestModules } from "./runner.ts";
import { join } from "../fs/path/mod.ts";

/**
 * IMPORTANT: This file assumes it is run from root of repository.
 */
const cwd = Deno.cwd();
const TEST_ROOT_PATH = join(cwd, "fmt");

test(async function findTestModulesRemote(): Promise<void> {
  const matches = [
    "https://deno.land/std/fmt/colors_test.ts",
    "http://deno.land/std/fmt/printf_test.ts"
  ];

  const urls = await findTestModules(matches, [], TEST_ROOT_PATH);
  assertEquals(urls, matches);
});

test(async function findTestModulesLocal(): Promise<void> {
  const urls = await findTestModules(
    ["*_test.ts"],
    ["colors*"],
    TEST_ROOT_PATH
  );
  assertEquals(urls.length, 1);
});

test(async function findTestModulesDirectory(): Promise<void> {
  const urls = await findTestModules(["."], [], TEST_ROOT_PATH);
  assertEquals(urls.length, 2);
});
