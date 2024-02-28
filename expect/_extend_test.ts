// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { MatcherContext, Tester } from "./_types.ts";

type DbConnection = number;

declare module "./_types.ts" {
  interface Expected {
    toEqualBook: (expected: unknown) => ExtendMatchResult
  }
}

const CONNECTION_PROP = "__connection";
let DbConnectionId = 0;

class Author {
  public name: string;
  public [CONNECTION_PROP]: DbConnection;

  constructor(name: string) {
    this.name = name;
    this[CONNECTION_PROP] = DbConnectionId++;
  }
}

class Book {
  public name: string;
  public authors: Array<Author>;
  public [CONNECTION_PROP]: DbConnection;

  constructor(name: string, authors: Array<Author>) {
    this.name = name;
    this.authors = authors;
    this[CONNECTION_PROP] = DbConnectionId++;
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

const book1 = new Book("Book 1", [
  new Author("Author 1"),
  new Author("Author 2"),
]);
const book1b = new Book("Book 1", [
  new Author("Author 1"),
  new Author("Author 2"),
]);

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
  toBeWithinRange(context, floor: number, ceiling: number) {
    const actual = context.value as number;
    const pass = actual >= floor && actual <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${actual} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${actual} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

Deno.test("expect().extend() api test case", () => {
  expect(book1).toEqualBook(book1b);
});

Deno.test("expect().extend() api test case", () => {
  expect({apples: 6, bananas: 3}).toEqual({
    // @ts-ignore todo
    apples: expect.toBeWithinRange(1, 10),
    // @ts-ignore todo
    bananas: expect.not.toBeWithinRange(11, 20),
  });
});
