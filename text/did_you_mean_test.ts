// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertThrows } from "../assert/mod.ts";
import { didYouMean, DidYouMeanError } from "./mod.ts";

const possibleWords: string[] = ["length", "help", "Help", "size", "blah"];

Deno.test("didYouMean - no error", function () {
  // e.g. asserTheFollowingDoensError()
  didYouMean("help", possibleWords);
});

Deno.test("didYouMean - empty string is in possible words", function () {
  didYouMean("", [""]);
});

Deno.test("didYouMean - empty string with non empty possbile words", function () {
  assertThrows(
    () => didYouMean("", possibleWords),
    DidYouMeanError,
    'An empty string was provided where one of the following strings was expected: ["length","help","Help","size","blah"]',
  );
});

Deno.test("didYouMean - empty possible words", function () {
  assertThrows(
    () => didYouMean("hi", []),
    AssertionError,
    "Call to didYouMean() had empty array for possibleWords (there needs to be at least one possible word to perform a didYouMean)",
  );
});

Deno.test("didYouMean - case sensitive comparison by default", function () {
  assertThrows(
    () => didYouMean("HELP", possibleWords),
    DidYouMeanError,
    'For "HELP", did you mean one of ["help","Help","size","blah","length"]?',
  );
});

Deno.test("didYouMean - suggestionLimit 1", function () {
  assertThrows(
    () => didYouMean("hep", possibleWords, { suggestionLimit: 1 }),
    DidYouMeanError,
    'For "hep", did you mean "help"?',
  );
});

Deno.test("didYouMean - case ", function () {
  assertThrows(
    () =>
      didYouMean("HELP", possibleWords, {
        caseSensitiveDistance: true,
        suggestionLimit: 1,
      }),
    DidYouMeanError,
    'For "HELP", did you mean "Help"?',
  );
});
