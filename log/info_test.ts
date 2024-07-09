// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { info } from "./info.ts";

Deno.test("info()", () => {
  const infoData: number = info(456, 1, 2, 3);
  const infoResolver: boolean | undefined = info(() => true);
  assertEquals(infoData, 456);
  assertEquals(infoResolver, true);
});
