// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert/equals";
import { slugify } from "./slugify.ts";

Deno.test("slugify() returns kebabcase", () => {
  assertEquals(slugify("hello world"), "hello-world");
});
Deno.test("slugify() returns lowercase", () => {
  assertEquals(slugify("Hello World"), "hello-world");
});

Deno.test("slugify() handles whitespaces", () => {
  assertEquals(slugify("  Hello   World  "), "hello-world");
  assertEquals(slugify("Hello\tWorld"), "hello-world");
  assertEquals(slugify("Hello\nWorld"), "hello-world");
  assertEquals(slugify("Hello\r\nWorld"), "hello-world");
});

Deno.test("slugify() normalizes diacritic characters to NFC form", () => {
  assertEquals(slugify("déjà vu".normalize("NFD")), "déjà-vu".normalize("NFC"));
  assertEquals(slugify("Cliché".normalize("NFD")), "cliché".normalize("NFC"));
  assertEquals(slugify("façade".normalize("NFD")), "façade".normalize("NFC"));
  assertEquals(slugify("résumé".normalize("NFD")), "résumé".normalize("NFC"));
});

Deno.test("slugify() handles dashes", () => {
  assertEquals(slugify("-Hello-World-"), "hello-world");
  assertEquals(slugify("--Hello--World--"), "hello-world");
});

Deno.test("slugify() handles empty string", () => {
  assertEquals(slugify(""), "");
});

Deno.test("slugify() replaces non-word characters with dashes", () => {
  assertEquals(slugify("Hello, world!"), "hello-world");
  assertEquals(slugify("hello ~ world"), "hello-world");

  assertEquals(
    slugify("Elon Musk considers move to Mars"),
    "elon-musk-considers-move-to-mars",
  );
  assertEquals(
    slugify("Fintech startups raised $34B in 2019"),
    "fintech-startups-raised-34b-in-2019",
  );
  assertEquals(
    slugify("Shopify joins Facebook’s cryptocurrency Libra Association"),
    "shopify-joins-facebooks-cryptocurrency-libra-association",
  );
  assertEquals(
    slugify("What is a slug and how to optimize it?"),
    "what-is-a-slug-and-how-to-optimize-it",
  );
  assertEquals(
    slugify("Bitcoin soars past $33,000, its highest ever"),
    "bitcoin-soars-past-33-000-its-highest-ever",
  );

  assertEquals(slugify("The value of Pi is 3.14"), "the-value-of-pi-is-3-14");
  assertEquals(slugify("La valeur de Pi est 3,14"), "la-valeur-de-pi-est-3-14");
  assertEquals(slugify("O(n)"), "o-n");
  assertEquals(slugify("甲（乙）"), "甲-乙");
});

Deno.test("slugify() works for non-Latin alphabets", () => {
  assertEquals(slugify("Συστημάτων Γραφής"), "συστημάτων-γραφής");
  assertEquals(slugify("三人行，必有我师焉"), "三人行-必有我师焉");
});

Deno.test("slugify() strips curly/straight quotes/apostrophes", () => {
  assertEquals(slugify("What’s up?"), "whats-up");
  assertEquals(slugify("What's up?"), "whats-up");
  assertEquals(slugify("甲“‘乙’”"), "甲乙");
  assertEquals(slugify(`甲"'乙'"`), "甲乙");
});
