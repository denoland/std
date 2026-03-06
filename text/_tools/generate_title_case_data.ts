#!/usr/bin/env -S deno run -W --allow-net=www.unicode.org:443
// Copyright 2018-2026 the Deno authors. MIT license.
// Modified from https://gist.github.com/0f-0b/c87dcf2d87f3428cc2abce2e20b7eef9
import { assert, assertEquals } from "@std/assert";

// bump this to update the data
const VERSION = "16.0.0";

async function fetchUcd(filename: string): Promise<string[][]> {
  const res = await fetch(
    `https://www.unicode.org/Public/${VERSION}/ucd/${filename}`,
  );
  if (!res.ok) {
    throw new TypeError(`HTTP ${res.status}`);
  }
  const text = await res.text();
  return text
    .split("\n")
    .map((line) => line.split("#", 1)[0]!.trim())
    .filter(Boolean)
    .map((line) => line.split(";").map((field) => field.trim()));
}

const uppercaseMapping: Record<number, string> = Object.create(null);
const titlecaseMapping: Record<number, string> = Object.create(null);
for (const entry of await fetchUcd("UnicodeData.txt")) {
  assert(entry.length === 15);
  assert(/^[0-9A-F]+$/.test(entry[0]!));
  assert(/^[0-9A-F]*$/.test(entry[12]!));
  assert(/^[0-9A-F]*$/.test(entry[14]!));
  const char = parseInt(entry[0]!, 16);
  const uppercase = entry[12] ? parseInt(entry[12], 16) : char;
  const titlecase = entry[14] ? parseInt(entry[14], 16) : uppercase;
  const name = entry[1]!;
  if (char === uppercase && char === titlecase) {
    continue;
  }
  assert(!/<.*, (?:First|Last)>/s.test(name));
  if (char !== uppercase) {
    uppercaseMapping[char] = String.fromCodePoint(uppercase);
  }
  if (char !== titlecase) {
    titlecaseMapping[char] = String.fromCodePoint(titlecase);
  }
}
for (const entry of await fetchUcd("SpecialCasing.txt")) {
  assert(entry.at(-1) === "");
  assert(entry.length === 5 || entry.length === 6);
  assert(/^[0-9A-F]+$/.test(entry[0]!));
  assert(/^(?:[0-9A-F]+( [0-9A-F]+)*)?$/.test(entry[2]!));
  assert(/^(?:[0-9A-F]+( [0-9A-F]+)*)?$/.test(entry[3]!));
  assert(/^(?:\w+( \w+)*)?$/.test(entry[4]!));
  const char = parseInt(entry[0]!, 16);
  const titlecase = entry[2]
    ? entry[2].split(" ").map((s) => parseInt(s, 16))
    : [];
  const uppercase = entry[3]
    ? entry[3].split(" ").map((s) => parseInt(s, 16))
    : [];
  const condition = entry[4];
  const sameUppercase = uppercase.length === 1 && char === uppercase[0];
  const sameTitlecase = titlecase.length === 1 && char === titlecase[0];
  if (condition) {
    assertEquals(uppercase, titlecase);
  }
  if (sameUppercase) {
    delete uppercaseMapping[char];
  } else {
    uppercaseMapping[char] = String.fromCodePoint(...uppercase);
  }
  if (sameTitlecase) {
    delete titlecaseMapping[char];
  } else {
    titlecaseMapping[char] = String.fromCodePoint(...titlecase);
  }
}

const data: Partial<Record<string, string>> = {};

for (let i = 0; i < 0x110000; i++) {
  const char = String.fromCodePoint(i);
  const uppercase = uppercaseMapping[i] ?? char;
  const titlecase = titlecaseMapping[i] ?? char;
  if (titlecase !== uppercase) {
    data[char] = titlecase;
  }
}

await Deno.writeTextFile(
  new URL(import.meta.resolve("../title_case_mapping.json")),
  JSON.stringify(data, null, 2) + "\n",
);
