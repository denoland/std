// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert/equals";
import { reverse } from "./unstable_reverse.ts";

function testBothAsciiAndUnicode(expected: string, input: string) {
  testAscii(expected, input);
  testUnicode(expected, input);
}
function testUnicode(expected: string, input: string) {
  assertEquals(expected, reverse(input));
  // check idempotency
  assertEquals(input, reverse(reverse(input)));
  // check empty object handling
  assertEquals(expected, reverse(input, {}));
}
function testAscii(expected: string, input: string) {
  assertEquals(expected, reverse(input, { handleUnicode: false }));
  // check idempotency
  assertEquals(
    input,
    reverse(reverse(input, { handleUnicode: false }), { handleUnicode: false }),
  );
  // check empty object handling
  assertEquals(expected, reverse(input, {}));
}

Deno.test("reverse() handles empty string", () => {
  testBothAsciiAndUnicode("", "");
});

Deno.test("reverse() reverses a string", () => {
  testBothAsciiAndUnicode("olleh", "hello");
  testBothAsciiAndUnicode("dlrow olleh", "hello world");
});

// CREDIT: https://github.com/mathiasbynens/esrever/blob/14b34013dad49106ca08c0e65919f1fc8fea5331/README.md
Deno.test("reverse() handles unicode strings", () => {
  testUnicode(
    "Lorem ipsum 𝌆 dolor sit ameͨ͆t.",
    ".teͨ͆ma tis rolod 𝌆 muspi meroL",
  );
  testUnicode("mañana mañana", "anañam anañam");

  testUnicode("H̹̙̦̮͉̩̗̗ͧ̇̏̊̾Eͨ͆͒̆ͮ̃͏̷̮̣̫̤̣ ̵̞̹̻̀̉̓ͬ͑͡ͅCͯ̂͐͏̨̛͔̦̟͈̻O̜͎͍͙͚̬̝̣̽ͮ͐͗̀ͤ̍̀͢M̴̡̲̭͍͇̼̟̯̦̉̒͠Ḛ̛̙̞̪̗ͥͤͩ̾͑̔͐ͅṮ̴̷̷̗̼͍̿̿̓̽͐H̙̙̔̄͜", "H̙̙̔̄͜Ṯ̴̷̷̗̼͍̿̿̓̽͐Ḛ̛̙̞̪̗ͥͤͩ̾͑̔͐ͅM̴̡̲̭͍͇̼̟̯̦̉̒͠O̜͎͍͙͚̬̝̣̽ͮ͐͗̀ͤ̍̀͢Cͯ̂͐͏̨̛͔̦̟͈̻ ̵̞̹̻̀̉̓ͬ͑͡ͅEͨ͆͒̆ͮ̃͏̷̮̣̫̤̣H̹̙̦̮͉̩̗̗ͧ̇̏̊̾");

  testUnicode("🦕Deno♥", "♥oneD🦕");
  testUnicode("안녕하세요", "요세하녕안");
});
