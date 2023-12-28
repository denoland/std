// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import * as c from "./colors.ts";

Deno.test("reset()", function () {
  assertEquals(c.reset("foo bar"), "[0mfoo bar[0m");
});

Deno.test("red() single color", function () {
  assertEquals(c.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("bgBlue() double color", function () {
  assertEquals(c.bgBlue(c.red("foo bar")), "[44m[31mfoo bar[39m[49m");
});

Deno.test("red() replaces close characters", function () {
  assertEquals(c.red("Hel[39mlo"), "[31mHel[31mlo[39m");
});

Deno.test("getColorEnabled() handles enabled colors", function () {
  assertEquals(c.getColorEnabled(), true);
  c.setColorEnabled(false);
  assertEquals(c.bgBlue(c.red("foo bar")), "foo bar");
  c.setColorEnabled(true);
  assertEquals(c.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("bold()", function () {
  assertEquals(c.bold("foo bar"), "[1mfoo bar[22m");
});

Deno.test("dim()", function () {
  assertEquals(c.dim("foo bar"), "[2mfoo bar[22m");
});

Deno.test("italic()", function () {
  assertEquals(c.italic("foo bar"), "[3mfoo bar[23m");
});

Deno.test("underline()", function () {
  assertEquals(c.underline("foo bar"), "[4mfoo bar[24m");
});

Deno.test("inverse()", function () {
  assertEquals(c.inverse("foo bar"), "[7mfoo bar[27m");
});

Deno.test("hidden()", function () {
  assertEquals(c.hidden("foo bar"), "[8mfoo bar[28m");
});

Deno.test("strikethrough()", function () {
  assertEquals(c.strikethrough("foo bar"), "[9mfoo bar[29m");
});

Deno.test("black()", function () {
  assertEquals(c.black("foo bar"), "[30mfoo bar[39m");
});

Deno.test("red()", function () {
  assertEquals(c.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("green()", function () {
  assertEquals(c.green("foo bar"), "[32mfoo bar[39m");
});

Deno.test("yellow()", function () {
  assertEquals(c.yellow("foo bar"), "[33mfoo bar[39m");
});

Deno.test("blue()", function () {
  assertEquals(c.blue("foo bar"), "[34mfoo bar[39m");
});

Deno.test("magenta()", function () {
  assertEquals(c.magenta("foo bar"), "[35mfoo bar[39m");
});

Deno.test("cyan()", function () {
  assertEquals(c.cyan("foo bar"), "[36mfoo bar[39m");
});

Deno.test("white()", function () {
  assertEquals(c.white("foo bar"), "[37mfoo bar[39m");
});

Deno.test("gray()", function () {
  assertEquals(c.gray("foo bar"), "[90mfoo bar[39m");
});

Deno.test("brightBlack()", function () {
  assertEquals(c.brightBlack("foo bar"), "[90mfoo bar[39m");
});

Deno.test("brightRed()", function () {
  assertEquals(c.brightRed("foo bar"), "[91mfoo bar[39m");
});

Deno.test("brightGreen()", function () {
  assertEquals(c.brightGreen("foo bar"), "[92mfoo bar[39m");
});

Deno.test("brightYellow()", function () {
  assertEquals(c.brightYellow("foo bar"), "[93mfoo bar[39m");
});

Deno.test("brightBlue()", function () {
  assertEquals(c.brightBlue("foo bar"), "[94mfoo bar[39m");
});

Deno.test("brightMagenta()", function () {
  assertEquals(c.brightMagenta("foo bar"), "[95mfoo bar[39m");
});

Deno.test("brightCyan()", function () {
  assertEquals(c.brightCyan("foo bar"), "[96mfoo bar[39m");
});

Deno.test("brightWhite()", function () {
  assertEquals(c.brightWhite("foo bar"), "[97mfoo bar[39m");
});

Deno.test("bgBlack()", function () {
  assertEquals(c.bgBlack("foo bar"), "[40mfoo bar[49m");
});

Deno.test("bgRed()", function () {
  assertEquals(c.bgRed("foo bar"), "[41mfoo bar[49m");
});

Deno.test("bgGreen()", function () {
  assertEquals(c.bgGreen("foo bar"), "[42mfoo bar[49m");
});

Deno.test("bgYellow()", function () {
  assertEquals(c.bgYellow("foo bar"), "[43mfoo bar[49m");
});

Deno.test("bgBlue()", function () {
  assertEquals(c.bgBlue("foo bar"), "[44mfoo bar[49m");
});

Deno.test("bgMagenta()", function () {
  assertEquals(c.bgMagenta("foo bar"), "[45mfoo bar[49m");
});

Deno.test("bgCyan()", function () {
  assertEquals(c.bgCyan("foo bar"), "[46mfoo bar[49m");
});

Deno.test("bgWhite()", function () {
  assertEquals(c.bgWhite("foo bar"), "[47mfoo bar[49m");
});

Deno.test("bgBrightBlack()", function () {
  assertEquals(c.bgBrightBlack("foo bar"), "[100mfoo bar[49m");
});

Deno.test("bgBrightRed()", function () {
  assertEquals(c.bgBrightRed("foo bar"), "[101mfoo bar[49m");
});

Deno.test("bgBrightGreen()", function () {
  assertEquals(c.bgBrightGreen("foo bar"), "[102mfoo bar[49m");
});

Deno.test("bgBrightYellow()", function () {
  assertEquals(c.bgBrightYellow("foo bar"), "[103mfoo bar[49m");
});

Deno.test("bgBrightBlue()", function () {
  assertEquals(c.bgBrightBlue("foo bar"), "[104mfoo bar[49m");
});

Deno.test("bgBrightMagenta()", function () {
  assertEquals(c.bgBrightMagenta("foo bar"), "[105mfoo bar[49m");
});

Deno.test("bgBrightCyan()", function () {
  assertEquals(c.bgBrightCyan("foo bar"), "[106mfoo bar[49m");
});

Deno.test("bgBrightWhite()", function () {
  assertEquals(c.bgBrightWhite("foo bar"), "[107mfoo bar[49m");
});

Deno.test("rgb8() handles clamp", function () {
  assertEquals(c.rgb8("foo bar", -10), "[38;5;0mfoo bar[39m");
});

Deno.test("rgb8() handles truncate", function () {
  assertEquals(c.rgb8("foo bar", 42.5), "[38;5;42mfoo bar[39m");
});

Deno.test("test rgb8", function () {
  assertEquals(c.rgb8("foo bar", 42), "[38;5;42mfoo bar[39m");
});

Deno.test("bgRgb8()", function () {
  assertEquals(c.bgRgb8("foo bar", 42), "[48;5;42mfoo bar[49m");
});

Deno.test("rgb24()", function () {
  assertEquals(
    c.rgb24("foo bar", {
      r: 41,
      g: 42,
      b: 43,
    }),
    "[38;2;41;42;43mfoo bar[39m",
  );
});

Deno.test("rgb24() handles number", function () {
  assertEquals(c.rgb24("foo bar", 0x070809), "[38;2;7;8;9mfoo bar[39m");
});

Deno.test("bgRgb24()", function () {
  assertEquals(
    c.bgRgb24("foo bar", {
      r: 41,
      g: 42,
      b: 43,
    }),
    "[48;2;41;42;43mfoo bar[49m",
  );
});

Deno.test("bgRgb24() handles number", function () {
  assertEquals(c.bgRgb24("foo bar", 0x070809), "[48;2;7;8;9mfoo bar[49m");
});

// https://github.com/chalk/strip-ansi/blob/2b8c961e75760059699373f9a69101065c3ded3a/test.js#L4-L6
Deno.test("stripAnsiCode()", function () {
  assertEquals(
    c.stripAnsiCode(
      "\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m",
    ),
    "foofoo",
  );
});
