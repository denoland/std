// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as c from "./colors.ts";
import "../examples/colors.ts";

Deno.test("reset", function (): void {
  assertEquals(c.reset("foo bar"), "[0mfoo bar[0m");
});

Deno.test("single color", function (): void {
  assertEquals(c.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("double color", function (): void {
  assertEquals(c.bgBlue(c.red("foo bar")), "[44m[31mfoo bar[39m[49m");
});

Deno.test("replaces close characters", function (): void {
  assertEquals(c.red("Hel[39mlo"), "[31mHel[31mlo[39m");
});

Deno.test("enabling colors", function (): void {
  assertEquals(c.getColorEnabled(), true);
  c.setColorEnabled(false);
  assertEquals(c.bgBlue(c.red("foo bar")), "foo bar");
  c.setColorEnabled(true);
  assertEquals(c.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("test bold", function (): void {
  assertEquals(c.bold("foo bar"), "[1mfoo bar[22m");
});

Deno.test("test dim", function (): void {
  assertEquals(c.dim("foo bar"), "[2mfoo bar[22m");
});

Deno.test("test italic", function (): void {
  assertEquals(c.italic("foo bar"), "[3mfoo bar[23m");
});

Deno.test("test underline", function (): void {
  assertEquals(c.underline("foo bar"), "[4mfoo bar[24m");
});

Deno.test("test inverse", function (): void {
  assertEquals(c.inverse("foo bar"), "[7mfoo bar[27m");
});

Deno.test("test hidden", function (): void {
  assertEquals(c.hidden("foo bar"), "[8mfoo bar[28m");
});

Deno.test("test strikethrough", function (): void {
  assertEquals(c.strikethrough("foo bar"), "[9mfoo bar[29m");
});

Deno.test("test black", function (): void {
  assertEquals(c.black("foo bar"), "[30mfoo bar[39m");
});

Deno.test("test red", function (): void {
  assertEquals(c.red("foo bar"), "[31mfoo bar[39m");
});

Deno.test("test green", function (): void {
  assertEquals(c.green("foo bar"), "[32mfoo bar[39m");
});

Deno.test("test yellow", function (): void {
  assertEquals(c.yellow("foo bar"), "[33mfoo bar[39m");
});

Deno.test("test blue", function (): void {
  assertEquals(c.blue("foo bar"), "[34mfoo bar[39m");
});

Deno.test("test magenta", function (): void {
  assertEquals(c.magenta("foo bar"), "[35mfoo bar[39m");
});

Deno.test("test cyan", function (): void {
  assertEquals(c.cyan("foo bar"), "[36mfoo bar[39m");
});

Deno.test("test white", function (): void {
  assertEquals(c.white("foo bar"), "[37mfoo bar[39m");
});

Deno.test("test gray", function (): void {
  assertEquals(c.gray("foo bar"), "[90mfoo bar[39m");
});

Deno.test("test brightBlack", function (): void {
  assertEquals(c.brightBlack("foo bar"), "[90mfoo bar[39m");
});

Deno.test("test brightRed", function (): void {
  assertEquals(c.brightRed("foo bar"), "[91mfoo bar[39m");
});

Deno.test("test brightGreen", function (): void {
  assertEquals(c.brightGreen("foo bar"), "[92mfoo bar[39m");
});

Deno.test("test brightYellow", function (): void {
  assertEquals(c.brightYellow("foo bar"), "[93mfoo bar[39m");
});

Deno.test("test brightBlue", function (): void {
  assertEquals(c.brightBlue("foo bar"), "[94mfoo bar[39m");
});

Deno.test("test brightMagenta", function (): void {
  assertEquals(c.brightMagenta("foo bar"), "[95mfoo bar[39m");
});

Deno.test("test brightCyan", function (): void {
  assertEquals(c.brightCyan("foo bar"), "[96mfoo bar[39m");
});

Deno.test("test brightWhite", function (): void {
  assertEquals(c.brightWhite("foo bar"), "[97mfoo bar[39m");
});

Deno.test("test bgBlack", function (): void {
  assertEquals(c.bgBlack("foo bar"), "[40mfoo bar[49m");
});

Deno.test("test bgRed", function (): void {
  assertEquals(c.bgRed("foo bar"), "[41mfoo bar[49m");
});

Deno.test("test bgGreen", function (): void {
  assertEquals(c.bgGreen("foo bar"), "[42mfoo bar[49m");
});

Deno.test("test bgYellow", function (): void {
  assertEquals(c.bgYellow("foo bar"), "[43mfoo bar[49m");
});

Deno.test("test bgBlue", function (): void {
  assertEquals(c.bgBlue("foo bar"), "[44mfoo bar[49m");
});

Deno.test("test bgMagenta", function (): void {
  assertEquals(c.bgMagenta("foo bar"), "[45mfoo bar[49m");
});

Deno.test("test bgCyan", function (): void {
  assertEquals(c.bgCyan("foo bar"), "[46mfoo bar[49m");
});

Deno.test("test bgWhite", function (): void {
  assertEquals(c.bgWhite("foo bar"), "[47mfoo bar[49m");
});

Deno.test("test bgBrightBlack", function (): void {
  assertEquals(c.bgBrightBlack("foo bar"), "[100mfoo bar[49m");
});

Deno.test("test bgBrightRed", function (): void {
  assertEquals(c.bgBrightRed("foo bar"), "[101mfoo bar[49m");
});

Deno.test("test bgBrightGreen", function (): void {
  assertEquals(c.bgBrightGreen("foo bar"), "[102mfoo bar[49m");
});

Deno.test("test bgBrightYellow", function (): void {
  assertEquals(c.bgBrightYellow("foo bar"), "[103mfoo bar[49m");
});

Deno.test("test bgBrightBlue", function (): void {
  assertEquals(c.bgBrightBlue("foo bar"), "[104mfoo bar[49m");
});

Deno.test("test bgBrightMagenta", function (): void {
  assertEquals(c.bgBrightMagenta("foo bar"), "[105mfoo bar[49m");
});

Deno.test("test bgBrightCyan", function (): void {
  assertEquals(c.bgBrightCyan("foo bar"), "[106mfoo bar[49m");
});

Deno.test("test bgBrightWhite", function (): void {
  assertEquals(c.bgBrightWhite("foo bar"), "[107mfoo bar[49m");
});

Deno.test("test clamp using rgb8", function (): void {
  assertEquals(c.rgb8("foo bar", -10), "[38;5;0mfoo bar[39m");
});

Deno.test("test truncate using rgb8", function (): void {
  assertEquals(c.rgb8("foo bar", 42.5), "[38;5;42mfoo bar[39m");
});

Deno.test("test rgb8", function (): void {
  assertEquals(c.rgb8("foo bar", 42), "[38;5;42mfoo bar[39m");
});

Deno.test("test bgRgb8", function (): void {
  assertEquals(c.bgRgb8("foo bar", 42), "[48;5;42mfoo bar[49m");
});

Deno.test("test rgb24", function (): void {
  assertEquals(
    c.rgb24("foo bar", {
      r: 41,
      g: 42,
      b: 43,
    }),
    "[38;2;41;42;43mfoo bar[39m",
  );
});

Deno.test("test rgb24 number", function (): void {
  assertEquals(c.rgb24("foo bar", 0x070809), "[38;2;7;8;9mfoo bar[39m");
});

Deno.test("test bgRgb24", function (): void {
  assertEquals(
    c.bgRgb24("foo bar", {
      r: 41,
      g: 42,
      b: 43,
    }),
    "[48;2;41;42;43mfoo bar[49m",
  );
});

Deno.test("test bgRgb24 number", function (): void {
  assertEquals(c.bgRgb24("foo bar", 0x070809), "[48;2;7;8;9mfoo bar[49m");
});

// https://github.com/chalk/strip-ansi/blob/2b8c961e75760059699373f9a69101065c3ded3a/test.js#L4-L6
Deno.test("test stripColor", function (): void {
  assertEquals(
    c.stripColor(
      "\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m",
    ),
    "foofoo",
  );
});
