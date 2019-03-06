// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { test } from "../testing/mod.ts";
import { assertEqual } from "../testing/asserts.ts";
import { red, bgBlue, setEnabled, getEnabled } from "./mod.ts";
import "./example.ts";

test(function singleColor() {
  assertEqual(red("Hello world"), "[31mHello world[39m");
});

test(function doubleColor() {
  assertEqual(bgBlue(red("Hello world")), "[44m[31mHello world[39m[49m");
});

test(function replacesCloseCharacters() {
  assertEqual(red("Hel[39mlo"), "[31mHel[31mlo[39m");
});

test(function enablingColors() {
  assertEqual(getEnabled(), true);
  setEnabled(false);
  assertEqual(bgBlue(red("Hello world")), "Hello world");
  setEnabled(true);
  assertEqual(red("Hello world"), "[31mHello world[39m");
});
