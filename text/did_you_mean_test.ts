// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertThrows } from "../testing/asserts.ts";
import { assertDidYouMean, DidYouMeanError } from "./did_you_mean.ts";

const possibleWords: string[] = ["length", "help", "Help", "size", "blah"];

Deno.test("didYouMean1", function () {
  // e.g. asserTheFollowingDoensError()
  assertDidYouMean("help", possibleWords);
});

Deno.test("didYouMean2", function () {
  assertDidYouMean("", [""]);
});

Deno.test("didYouMean3", function () {
  assertThrows(
    () => assertDidYouMean("", possibleWords),
    DidYouMeanError,
    'An empty string was provided where one of the following strings was expected: ["length","help","Help","size","blah"]',
  );
});

Deno.test("didYouMean4", function () {
  assertThrows(
    () => assertDidYouMean("hi", []),
    AssertionError,
    "Call to assertDidYouMean() had empty array for possibleWords (there needs to be at least one possible word to perform a didYouMean)",
  );
});

Deno.test("didYouMean5", function () {
  assertThrows(
    () => assertDidYouMean("HELP", possibleWords),
    DidYouMeanError,
    'For "HELP", did you mean one of ["help","Help","size","blah","length"]?',
  );
});

Deno.test("didYouMean6", function () {
  assertThrows(
    () => assertDidYouMean("hep", possibleWords, { suggestionLimit: 1 }),
    DidYouMeanError,
    'For "hep", did you mean one of ["help","Help","size","blah","length"]?',
  );
});

Deno.test("didYouMean7", function () {
  assertThrows(
    () => assertDidYouMean("hep", possibleWords, { suggestionLimit: 1 }),
    DidYouMeanError,
    'For "hep", did you mean one of ["help","Help","size","blah","length"]?',
  );
});

Deno.test("didYouMean8", function () {
  assertThrows(
    () =>
      assertDidYouMean("HELP", possibleWords, {
        caseSensitiveDistance: true,
        suggestionLimit: 1,
      }),
    DidYouMeanError,
    'For "HELP", did you mean one of ["help","Help","size","blah","length"]?',
  );
});
