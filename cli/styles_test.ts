// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import * as styles from "./styles.ts";

Deno.test("reset()", function () {
  assertEquals(styles.reset("foo bar"), "[0mfoo bar[0m");
});

Deno.test("red() single color", function () {
  assertEquals(styles.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("bgBlue() double color", function () {
  assertEquals(styles.bgBlue(styles.red("foo bar")), "[44m[31mfoo bar[39m[49m");
});

Deno.test("red() replaces close characters", function () {
  assertEquals(styles.red("Hel[39mlo"), "[31mHel[31mlo[39m");
});

Deno.test("getColorEnabled() handles enabled colors", function () {
  assertEquals(styles.getColorEnabled(), true);
  styles.setColorEnabled(false);
  assertEquals(styles.bgBlue(styles.red("foo bar")), "foo bar");
  styles.setColorEnabled(true);
  assertEquals(styles.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("bold()", function () {
  assertEquals(styles.bold("foo bar"), "[1mfoo bar[22m");
});

Deno.test("dim()", function () {
  assertEquals(styles.dim("foo bar"), "[2mfoo bar[22m");
});

Deno.test("italic()", function () {
  assertEquals(styles.italic("foo bar"), "[3mfoo bar[23m");
});

Deno.test("underline()", function () {
  assertEquals(styles.underline("foo bar"), "[4mfoo bar[24m");
});

Deno.test("inverse()", function () {
  assertEquals(styles.inverse("foo bar"), "[7mfoo bar[27m");
});

Deno.test("hidden()", function () {
  assertEquals(styles.hidden("foo bar"), "[8mfoo bar[28m");
});

Deno.test("strikethrough()", function () {
  assertEquals(styles.strikethrough("foo bar"), "[9mfoo bar[29m");
});

Deno.test("black()", function () {
  assertEquals(styles.black("foo bar"), "[30mfoo bar[39m");
});

Deno.test("red()", function () {
  assertEquals(styles.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("green()", function () {
  assertEquals(styles.green("foo bar"), "[32mfoo bar[39m");
});

Deno.test("yellow()", function () {
  assertEquals(styles.yellow("foo bar"), "[33mfoo bar[39m");
});

Deno.test("blue()", function () {
  assertEquals(styles.blue("foo bar"), "[34mfoo bar[39m");
});

Deno.test("magenta()", function () {
  assertEquals(styles.magenta("foo bar"), "[35mfoo bar[39m");
});

Deno.test("cyan()", function () {
  assertEquals(styles.cyan("foo bar"), "[36mfoo bar[39m");
});

Deno.test("white()", function () {
  assertEquals(styles.white("foo bar"), "[37mfoo bar[39m");
});

Deno.test("gray()", function () {
  assertEquals(styles.gray("foo bar"), "[90mfoo bar[39m");
});

Deno.test("brightBlack()", function () {
  assertEquals(styles.brightBlack("foo bar"), "[90mfoo bar[39m");
});

Deno.test("brightRed()", function () {
  assertEquals(styles.brightRed("foo bar"), "[91mfoo bar[39m");
});

Deno.test("brightGreen()", function () {
  assertEquals(styles.brightGreen("foo bar"), "[92mfoo bar[39m");
});

Deno.test("brightYellow()", function () {
  assertEquals(styles.brightYellow("foo bar"), "[93mfoo bar[39m");
});

Deno.test("brightBlue()", function () {
  assertEquals(styles.brightBlue("foo bar"), "[94mfoo bar[39m");
});

Deno.test("brightMagenta()", function () {
  assertEquals(styles.brightMagenta("foo bar"), "[95mfoo bar[39m");
});

Deno.test("brightCyan()", function () {
  assertEquals(styles.brightCyan("foo bar"), "[96mfoo bar[39m");
});

Deno.test("brightWhite()", function () {
  assertEquals(styles.brightWhite("foo bar"), "[97mfoo bar[39m");
});

Deno.test("bgBlack()", function () {
  assertEquals(styles.bgBlack("foo bar"), "[40mfoo bar[49m");
});

Deno.test("bgRed()", function () {
  assertEquals(styles.bgRed("foo bar"), "[41mfoo bar[49m");
});

Deno.test("bgGreen()", function () {
  assertEquals(styles.bgGreen("foo bar"), "[42mfoo bar[49m");
});

Deno.test("bgYellow()", function () {
  assertEquals(styles.bgYellow("foo bar"), "[43mfoo bar[49m");
});

Deno.test("bgBlue()", function () {
  assertEquals(styles.bgBlue("foo bar"), "[44mfoo bar[49m");
});

Deno.test("bgMagenta()", function () {
  assertEquals(styles.bgMagenta("foo bar"), "[45mfoo bar[49m");
});

Deno.test("bgCyan()", function () {
  assertEquals(styles.bgCyan("foo bar"), "[46mfoo bar[49m");
});

Deno.test("bgWhite()", function () {
  assertEquals(styles.bgWhite("foo bar"), "[47mfoo bar[49m");
});

Deno.test("bgBrightBlack()", function () {
  assertEquals(styles.bgBrightBlack("foo bar"), "[100mfoo bar[49m");
});

Deno.test("bgBrightRed()", function () {
  assertEquals(styles.bgBrightRed("foo bar"), "[101mfoo bar[49m");
});

Deno.test("bgBrightGreen()", function () {
  assertEquals(styles.bgBrightGreen("foo bar"), "[102mfoo bar[49m");
});

Deno.test("bgBrightYellow()", function () {
  assertEquals(styles.bgBrightYellow("foo bar"), "[103mfoo bar[49m");
});

Deno.test("bgBrightBlue()", function () {
  assertEquals(styles.bgBrightBlue("foo bar"), "[104mfoo bar[49m");
});

Deno.test("bgBrightMagenta()", function () {
  assertEquals(styles.bgBrightMagenta("foo bar"), "[105mfoo bar[49m");
});

Deno.test("bgBrightCyan()", function () {
  assertEquals(styles.bgBrightCyan("foo bar"), "[106mfoo bar[49m");
});

Deno.test("bgBrightWhite()", function () {
  assertEquals(styles.bgBrightWhite("foo bar"), "[107mfoo bar[49m");
});

Deno.test("rgb8() handles clamp", function () {
  assertEquals(styles.rgb8("foo bar", -10), "[38;5;0mfoo bar[39m");
});

Deno.test("rgb8() handles truncate", function () {
  assertEquals(styles.rgb8("foo bar", 42.5), "[38;5;42mfoo bar[39m");
});

Deno.test("test rgb8", function () {
  assertEquals(styles.rgb8("foo bar", 42), "[38;5;42mfoo bar[39m");
});

Deno.test("bgRgb8()", function () {
  assertEquals(styles.bgRgb8("foo bar", 42), "[48;5;42mfoo bar[49m");
});

Deno.test("rgb24()", function () {
  assertEquals(
    styles.rgb24("foo bar", {
      r: 41,
      g: 42,
      b: 43,
    }),
    "[38;2;41;42;43mfoo bar[39m",
  );
});

Deno.test("rgb24() handles number", function () {
  assertEquals(styles.rgb24("foo bar", 0x070809), "[38;2;7;8;9mfoo bar[39m");
});

Deno.test("bgRgb24()", function () {
  assertEquals(
    styles.bgRgb24("foo bar", {
      r: 41,
      g: 42,
      b: 43,
    }),
    "[48;2;41;42;43mfoo bar[49m",
  );
});

Deno.test("bgRgb24() handles number", function () {
  assertEquals(styles.bgRgb24("foo bar", 0x070809), "[48;2;7;8;9mfoo bar[49m");
});

// https://github.com/chalk/strip-ansi/blob/2b8c961e75760059699373f9a69101065c3ded3a/test.js#L4-L6
Deno.test("stripAnsiCode()", function () {
  assertEquals(
    styles.stripAnsiCode(
      "\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m",
    ),
    "foofoo",
  );
});
