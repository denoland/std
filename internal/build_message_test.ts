// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { bgGreen, bgRed, bold, gray, green, red, white } from "@std/fmt/colors";
import { buildMessage, createColor, createSign } from "./build_message.ts";

Deno.test("buildMessage()", () => {
  const messages = [
    "",
    "",
    `    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${
      green(bold("Expected"))
    }`,
    "",
    "",
  ];
  assertEquals(buildMessage([]), [...messages, ""]);
  assertEquals(
    buildMessage([{ type: "added", value: "foo" }, {
      type: "removed",
      value: "bar",
    }]),
    [...messages, green(bold("+   foo")), red(bold("-   bar")), ""],
  );
});

Deno.test("createColor()", () => {
  assertEquals(createColor("added")("foo"), green(bold("foo")));
  assertEquals(createColor("removed")("foo"), red(bold("foo")));
  assertEquals(createColor("common")("foo"), white("foo"));
  assertEquals(createColor("added", true)("foo"), bgGreen(white("foo")));
  assertEquals(createColor("removed", true)("foo"), bgRed(white("foo")));
  assertEquals(createColor("common", true)("foo"), white("foo"));
});

Deno.test("createSign()", () => {
  assertEquals(createSign("added"), "+   ");
  assertEquals(createSign("removed"), "-   ");
  assertEquals(createSign("common"), "    ");
  // deno-lint-ignore no-explicit-any
  assertEquals(createSign("unknown" as any), "    ");
});
