// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertThrows } from "../testing/asserts.ts";
import {
  validateCookieName,
  validateCookiePath,
  validateCookieValue,
} from "./rfc_6265.ts";

Deno.test({
  name: "Cookie Name Validation",
  fn(): void {
    const tokens = [
      '"id"',
      "id\t",
      "i\td",
      "i d",
      "i;d",
      "{id}",
      "[id]",
      '"',
      "id\u0091",
    ];
    tokens.forEach((name) => {
      assertThrows(
        (): void => {
          validateCookieName(name);
        },
        Error,
        'Invalid cookie name: "' + name + '".',
      );
    });
  },
});

Deno.test({
  name: "Cookie Value Validation",
  fn(): void {
    const tokens = [
      "1f\tWa",
      "\t",
      "1f Wa",
      "1f;Wa",
      '"1fWa',
      "1f\\Wa",
      '1f"Wa',
      '"',
      "1fWa\u0005",
      "1f\u0091Wa",
    ];
    tokens.forEach((value) => {
      assertThrows(
        (): void => {
          validateCookieValue("Space", value);
        },
        Error,
        "RFC2616 cookie 'Space'",
      );
    });
  },
});

Deno.test({
  name: "Cookie Path Validation",
  fn(): void {
    const path = "/;domain=sub.domain.com";
    assertThrows(
      (): void => {
        validateCookiePath(path);
      },
      Error,
      path + ": Invalid cookie path char ';'",
    );
  },
});
