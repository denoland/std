// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import * as _ from "./mod.ts";
import "../examples/colors.ts";

test(function singleColor(): void {
  assertEquals(_.red("foo bar"), "[31mfoo bar[39m");
});

test(function doubleColor(): void {
  assertEquals(_.bgBlue(_.red("foo bar")), "[44m[31mfoo bar[39m[49m");
});

test(function replacesCloseCharacters(): void {
  assertEquals(_.red("Hel[39mlo"), "[31mHel[31mlo[39m");
});

test(function enablingColors(): void {
  assertEquals(_.getEnabled(), true);
  _.setEnabled(false);
  assertEquals(_.bgBlue(_.red("foo bar")), "foo bar");
  _.setEnabled(true);
  assertEquals(_.red("foo bar"), "[31mfoo bar[39m");
});

test(function testBold(): void {
  assertEquals(_.bold("foo bar"), "[1mfoo bar[22m");
});

test(function testDim(): void {
  assertEquals(_.dim("foo bar"), "[2mfoo bar[22m");
});

test(function testItalic(): void {
  assertEquals(_.italic("foo bar"), "[3mfoo bar[23m");
});

test(function testUnderline(): void {
  assertEquals(_.underline("foo bar"), "[4mfoo bar[24m");
});

test(function testInverse(): void {
  assertEquals(_.inverse("foo bar"), "[7mfoo bar[27m");
});

test(function testHidden(): void {
  assertEquals(_.hidden("foo bar"), "[8mfoo bar[28m");
});

test(function testStrikethrough(): void {
  assertEquals(_.strikethrough("foo bar"), "[9mfoo bar[29m");
});

test(function testBlack(): void {
  assertEquals(_.black("foo bar"), "[30mfoo bar[39m");
});

test(function testRed(): void {
  assertEquals(_.red("foo bar"), "[31mfoo bar[39m");
});

test(function testGreen(): void {
  assertEquals(_.green("foo bar"), "[32mfoo bar[39m");
});

test(function testYellow(): void {
  assertEquals(_.yellow("foo bar"), "[33mfoo bar[39m");
});

test(function testBlue(): void {
  assertEquals(_.blue("foo bar"), "[34mfoo bar[39m");
});

test(function testMagenta(): void {
  assertEquals(_.magenta("foo bar"), "[35mfoo bar[39m");
});

test(function testCyan(): void {
  assertEquals(_.cyan("foo bar"), "[36mfoo bar[39m");
});

test(function testWhite(): void {
  assertEquals(_.white("foo bar"), "[37mfoo bar[39m");
});

test(function testGray(): void {
  assertEquals(_.gray("foo bar"), "[90mfoo bar[39m");
});

test(function testBgBlack(): void {
  assertEquals(_.bgBlack("foo bar"), "[40mfoo bar[49m");
});

test(function testBgRed(): void {
  assertEquals(_.bgRed("foo bar"), "[41mfoo bar[49m");
});

test(function testBgGreen(): void {
  assertEquals(_.bgGreen("foo bar"), "[42mfoo bar[49m");
});

test(function testBgYellow(): void {
  assertEquals(_.bgYellow("foo bar"), "[43mfoo bar[49m");
});

test(function testBgBlue(): void {
  assertEquals(_.bgBlue("foo bar"), "[44mfoo bar[49m");
});

test(function testBgMagenta(): void {
  assertEquals(_.bgMagenta("foo bar"), "[45mfoo bar[49m");
});

test(function testBgCyan(): void {
  assertEquals(_.bgCyan("foo bar"), "[46mfoo bar[49m");
});

test(function testBgWhite(): void {
  assertEquals(_.bgWhite("foo bar"), "[47mfoo bar[49m");
});
