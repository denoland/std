import { test } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { wordCount } from "./word_count.ts";

test(function wordCountTest(): void {
  const input1 = "deno";
  const input2 = "   string with space in front";
  const input3 = "string with space in back     ";
  const input4 = "     string with space in both side     ";
  const input5 = "string       with   space     in     between";
  const input6 = "   string     with space   on    side and        between   ";
  const input7 = "";

  assertEquals(wordCount(input1), 1);
  assertEquals(wordCount(input2), 5);
  assertEquals(wordCount(input3), 5);
  assertEquals(wordCount(input4), 6);
  assertEquals(wordCount(input5), 5);
  assertEquals(wordCount(input6), 7);
  assertEquals(wordCount(input7), 0);
});
