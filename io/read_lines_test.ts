// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { Buffer } from "./buffer.ts";
import { readStringDelim } from "./read_string_delim.ts";
import { assertEquals } from "../testing/asserts.ts";
import { readLines } from "./read_lines.ts";

Deno.test("readStringDelimAndLines", async function () {
  const enc = new TextEncoder();
  const data = new Buffer(
    enc.encode("Hello World\tHello World 2\tHello World 3"),
  );
  const chunks_ = [];

  for await (const c of readStringDelim(data, "\t")) {
    chunks_.push(c);
  }

  assertEquals(chunks_.length, 3);
  assertEquals(chunks_, ["Hello World", "Hello World 2", "Hello World 3"]);

  const linesData = new Buffer(enc.encode("0\n1\n2\n3\n4\n5\n6\n7\n8\n9"));
  const linesDataWithTrailingNewLine = new Buffer(enc.encode("1\n2\n3\n"));
  // consider data with windows newlines too
  const linesDataWindows = new Buffer(
    enc.encode("0\r\n1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7\r\n8\r\n9"),
  );
  const lines_ = [];

  for await (const l of readLines(linesData)) {
    lines_.push(l);
  }

  assertEquals(lines_.length, 10);
  assertEquals(lines_, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

  lines_.length = 0;
  for await (const l of readLines(linesDataWithTrailingNewLine)) {
    lines_.push(l);
  }

  assertEquals(lines_.length, 3);
  assertEquals(lines_, ["1", "2", "3"]); // No empty line at the end

  // Now test for "windows" lines
  lines_.length = 0;
  for await (const l of readLines(linesDataWindows)) {
    lines_.push(l);
  }
  assertEquals(lines_.length, 10);
  assertEquals(lines_, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
});

Deno.test("readLinesWithEncodingISO-8859-15", async function () {
  const lines_ = [];
  const file_ = await Deno.open("./io/testdata/iso-8859-15.txt");

  for await (const l of readLines(file_, { encoding: "iso-8859-15" })) {
    lines_.push(l);
  }

  file_.close();

  assertEquals(lines_.length, 12);
  assertEquals(lines_, [
    "\u0020!\"#$%&'()*+,-./",
    "0123456789:;<=>?",
    "@ABCDEFGHIJKLMNO",
    "PQRSTUVWXYZ[\\]^_",
    "`abcdefghijklmno",
    "pqrstuvwxyz{|}~",
    "\u00a0¡¢£€¥Š§š©ª«¬\u00ad®¯",
    "°±²³Žµ¶·ž¹º»ŒœŸ¿",
    "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ",
    "ÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞß",
    "àáâãäåæçèéêëìíîï",
    "ðñòóôõö÷øùúûüýþÿ",
  ]);
});
