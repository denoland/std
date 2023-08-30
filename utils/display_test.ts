// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { pluralize, timeAgo } from "./display.ts";
import { DAY, HOUR, MINUTE, SECOND } from "std/datetime/constants.ts";
import { assertEquals } from "std/testing/asserts.ts";

Deno.test("[display] pluralize()", () => {
  assertEquals(pluralize(0, "item"), "0 items");
  assertEquals(pluralize(1, "item"), "1 item");
  assertEquals(pluralize(2, "item"), "2 items");
});

Deno.test("[display] timeAgo()", () => {
  assertEquals(timeAgo(new Date(Date.now())), "just now");
  assertEquals(timeAgo(new Date(Date.now() - SECOND * 30)), "30 seconds ago");
  assertEquals(timeAgo(new Date(Date.now() - MINUTE)), "1 minute ago");
  assertEquals(timeAgo(new Date(Date.now() - MINUTE * 2)), "2 minutes ago");
  assertEquals(timeAgo(new Date(Date.now() - MINUTE * 59)), "59 minutes ago");
  assertEquals(timeAgo(new Date(Date.now() - HOUR)), "1 hour ago");
  assertEquals(
    timeAgo(new Date(Date.now() - HOUR - MINUTE * 35)),
    "1 hour ago",
  );
  assertEquals(timeAgo(new Date(Date.now() - HOUR * 2)), "2 hours ago");
  assertEquals(timeAgo(new Date(Date.now() - DAY)), "1 day ago");
  assertEquals(timeAgo(new Date(Date.now() - DAY - HOUR * 12)), "1 day ago");
  assertEquals(timeAgo(new Date(Date.now() - DAY * 5)), "5 days ago");
});
