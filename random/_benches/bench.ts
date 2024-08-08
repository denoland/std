#!/usr/bin/env -S deno bench
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { SeededRandom } from "../seeded_random.ts";
import { decodeHex } from "@std/encoding/hex";

const prng = new SeededRandom({
  seed: decodeHex("1b5c18d1d9e1d41a65c4d21668e4ce1d"),
});

Deno.bench("SeededRandom.random()", () => {
  prng.random();
});
