// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import {
  red,
  bgBlue,
  setEnabled,
  getEnabled,
  bold,
  dim,
  italic,
  underline,
  inverse,
  hidden,
  strikethrough,
  black,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  gray,
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgMagenta,
  bgCyan,
  bgWhite
} from "./mod.ts";
import "../examples/colors.ts";

test(function singleColor(): void {
  assertEquals(red("Hello world"), "[31mHello world[39m");
});

test(function doubleColor(): void {
  assertEquals(bgBlue(red("Hello world")), "[44m[31mHello world[39m[49m");
});

test(function replacesCloseCharacters(): void {
  assertEquals(red("Hel[39mlo"), "[31mHel[31mlo[39m");
});

test(function enablingColors(): void {
  assertEquals(getEnabled(), true);
  setEnabled(false);
  assertEquals(bgBlue(red("Hello world")), "Hello world");
  setEnabled(true);
  assertEquals(red("Hello world"), "[31mHello world[39m");
});

test(function testBold(): void {
  assertEquals(bold("Hello world"), "[1mHello world[22m");
});

test(function testDim(): void {
  assertEquals(dim("Hello world"), "[2mHello world[22m");
});

test(function testItalic(): void {
  assertEquals(italic("Hello world"), "[3mHello world[23m");
});

test(function testUnderline(): void {
  assertEquals(underline("Hello world"), "[4mHello world[24m");
});

test(function testInverse(): void {
  assertEquals(inverse("Hello world"), "[7mHello world[27m");
});

test(function testHidden(): void {
  assertEquals(hidden("Hello world"), "[8mHello world[28m");
});

test(function testStrikethrough(): void {
  assertEquals(strikethrough("Hello world"), "[9mHello world[29m");
});

test(function testBlack(): void {
  assertEquals(black("Hello world"), "[30mHello world[39m");
});

test(function testRed(): void {
  assertEquals(red("Hello world"), "[31mHello world[39m");
});

test(function testGreen(): void {
  assertEquals(green("Hello world"), "[32mHello world[39m");
});

test(function testYellow(): void {
  assertEquals(yellow("Hello world"), "[33mHello world[39m");
});

test(function testBlue(): void {
  assertEquals(blue("Hello world"), "[34mHello world[39m");
});

test(function testMagenta(): void {
  assertEquals(magenta("Hello world"), "[35mHello world[39m");
});

test(function testCyan(): void {
  assertEquals(cyan("Hello world"), "[36mHello world[39m");
});

test(function testWhite(): void {
  assertEquals(white("Hello world"), "[37mHello world[39m");
});

test(function testGray(): void {
  assertEquals(gray("Hello world"), "[90mHello world[39m");
});

test(function testBgBlack(): void {
  assertEquals(bgBlack("Hello world"), "[40mHello world[49m");
});

test(function testBgRed(): void {
  assertEquals(bgRed("Hello world"), "[41mHello world[49m");
});

test(function testBgGreen(): void {
  assertEquals(bgGreen("Hello world"), "[42mHello world[49m");
});

test(function testBgYellow(): void {
  assertEquals(bgYellow("Hello world"), "[43mHello world[49m");
});

test(function testBgBlue(): void {
  assertEquals(bgBlue("Hello world"), "[44mHello world[49m");
});

test(function testBgMagenta(): void {
  assertEquals(bgMagenta("Hello world"), "[45mHello world[49m");
});

test(function testBgCyan(): void {
  assertEquals(bgCyan("Hello world"), "[46mHello world[49m");
});

test(function testBgWhite(): void {
  assertEquals(bgWhite("Hello world"), "[47mHello world[49m");
});
