// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/assert_equals.ts";
import { info } from "./info.ts";

Deno.test("default loggers work as expected", () => {
  const infoData: number = info(456, 1, 2, 3);
  const infoResolver: boolean | undefined = info(() => true);
  assertEquals(infoData, 456);
  assertEquals(infoResolver, true);
});
