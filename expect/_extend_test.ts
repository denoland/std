// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import type { MatcherContext, Tester } from "./_types.ts";
import { AssertionError, assertThrows } from "@std/assert";

declare module "./_types.ts" {
  interface Expected {
    toEqualBook: (expected: unknown) => ExtendMatchResult;
  }
}

class Author {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class Book {
  name: string;
  authors: Array<Author>;

  constructor(name: string, authors: Array<Author>) {
    this.name = name;
    this.authors = authors;
  }
}

const areAuthorsEqual: Tester = (a: unknown, b: unknown) => {
  const isAAuthor = a instanceof Author;
  const isBAuthor = b instanceof Author;

  if (isAAuthor && isBAuthor) {
    return a.name === b.name;
  } else if (isAAuthor === isBAuthor) {
    return undefined;
  } else {
    return false;
  }
};

const areBooksEqual: Tester = function (
  this: MatcherContext,
  a: unknown,
  b: unknown,
  customTesters: Tester[],
) {
  const isABook = a instanceof Book;
  const isBBook = b instanceof Book;

  if (isABook && isBBook) {
    return (a.name === b.name &&
      this.equal(a.authors, b.authors, { customTesters: customTesters }));
  } else if (isABook === isBBook) {
    return undefined;
  } else {
    return false;
  }
};

expect.addEqualityTesters([
  areAuthorsEqual,
  areBooksEqual,
]);

expect.extend({
  toEqualBook(context, expected) {
    const actual = context.value as Book;
    const result = context.equal(expected, actual, {
      customTesters: context.customTesters,
    });

    return {
      message: () =>
        `Expected Book object: ${expected.name}. Actual Book object: ${actual.name}`,
      pass: result,
    };
  },
});

Deno.test("expect.extend() api test case", () => {
  const book1a = new Book("Book 1", [
    new Author("Author 1"),
    new Author("Author 2"),
  ]);
  const book1b = new Book("Book 1", [
    new Author("Author 1"),
    new Author("Author 2"),
  ]);
  const book2 = new Book("Book 2", [
    new Author("Author 1"),
    new Author("Author 2"),
  ]);

  expect(book1a).toEqualBook(book1b);
  expect(book1a).not.toEqualBook(book2);
  expect(book1a).not.toEqualBook(1);
  expect(book1a).not.toEqualBook(null);

  assertThrows(
    () => expect(book1a).toEqualBook(book2),
    AssertionError,
    "Expected Book object: Book 2. Actual Book object: Book 1",
  );
  assertThrows(
    () => expect(book1a).not.toEqualBook(book1b),
    AssertionError,
    "Expected Book object: Book 1. Actual Book object: Book 1",
  );
});
