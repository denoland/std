// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { foldLine } from "./_dumper.ts";

await Deno.test("foldLine()", async (t) => {
  await t.step({
    name: "returns the original line if it's empty",
    fn() {
      const input = "";
      const width = 10;
      const expected = "";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "doesn't fold if the line starts with a space",
    fn() {
      const input = " hello world";
      const width = 10;
      const expected = " hello world";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "folds a line within the width",
    fn() {
      const input = "This is a test.";
      const width = 10;
      const expected = "This is a\ntest.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles a string with multiple consecutive spaces",
    fn() {
      const input = "This  is  a  test.";
      const width = 5;
      const expected = "This \nis \na \ntest.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles a line with no spaces within the width",
    fn() {
      const input = "This_is_a_line_without_spaces.";
      const width = 10;
      const expected = "This_is_a_line_without_spaces.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles a line that exceeds the width without spaces",
    fn() {
      const input = "Thisisalongwordwithoutspaces";
      const width = 10;
      const expected = "Thisisalongwordwithoutspaces";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "folds a line with a single space within the width",
    fn() {
      const input = "This is a test.";
      const width = 4;
      const expected = "This\nis a\ntest.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles width of zero",
    fn() {
      const input = "This is a test.";
      const width = 0;
      const expected = "This\nis\na\ntest.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles width of one",
    fn() {
      const input = "This is a test.";
      const width = 1;
      const expected = "This\nis\na\ntest.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "doesn't fold a single character string",
    fn() {
      const input = "a";
      const width = 10;
      const expected = "a";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles a string with only spaces",
    fn() {
      const input = "     ";
      const width = 3;
      const expected = "     ";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles a string with a space at the end",
    fn() {
      const input = "This is a test. ";
      const width = 10;
      const expected = "This is a\ntest. ";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "doesn't fold if width is larger than the line length",
    fn() {
      const input = "This is a test.";
      const width = 50;
      const expected = "This is a test.";
      assertEquals(foldLine(input, width), expected);
    },
  });

  await t.step({
    name: "handles a string with special characters",
    fn() {
      const input = "This is a test! @ # $ % ^ & * ( )";
      const width = 10;
      const expected = "This is a\ntest! @ #\n$ % ^ & *\n( )";
      assertEquals(foldLine(input, width), expected);
    },
  });
});
