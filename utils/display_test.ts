// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { getToggledStyles, pluralize, timeAgo } from "./display.ts";
import { DAY, HOUR, MINUTE, SECOND } from "std/datetime/constants.ts";
import { assertEquals } from "std/testing/asserts.ts";
import { ACTIVE_LINK_STYLES, LINK_STYLES } from "@/utils/constants.ts";

Deno.test("[display] pluralize()", () => {
  assertEquals(pluralize(0, "item"), "0 items");
  assertEquals(pluralize(1, "item"), "1 item");
  assertEquals(pluralize(2, "item"), "2 items");
});

Deno.test("[display] timeAgo()", () => {
  assertEquals(timeAgo(Date.now()), "0 minutes");
  assertEquals(timeAgo(Date.now() - SECOND * 30), "0 minutes");
  assertEquals(timeAgo(Date.now() - MINUTE), "1 minute");
  assertEquals(timeAgo(Date.now() - MINUTE * 2), "2 minutes");
  assertEquals(timeAgo(Date.now() - MINUTE * 59), "59 minutes");
  assertEquals(timeAgo(Date.now() - HOUR), "1 hour");
  assertEquals(timeAgo(Date.now() - HOUR - MINUTE * 35), "1 hour");
  assertEquals(timeAgo(Date.now() - HOUR * 2), "2 hours");
  assertEquals(timeAgo(Date.now() - DAY), "1 day");
  assertEquals(timeAgo(Date.now() - DAY - HOUR * 12), "1 day");
  assertEquals(timeAgo(Date.now() - DAY * 5), "5 days");
});

Deno.test("[display] getToggledStyles()", () => {
  assertEquals(
    getToggledStyles(LINK_STYLES, ACTIVE_LINK_STYLES, false),
    LINK_STYLES,
  );
  assertEquals(
    getToggledStyles(LINK_STYLES, ACTIVE_LINK_STYLES, true),
    LINK_STYLES + " " + ACTIVE_LINK_STYLES,
  );
});
