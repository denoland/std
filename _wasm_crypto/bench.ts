// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { crypto, digestAlgorithms } from "./mod.ts";

const oneKb = await globalThis.crypto.getRandomValues(new Uint8Array(1024));
const oneMb = new Uint8Array(1024 * 1024);
for (let i = 0; i < 1024; i++) {
  oneMb.set(oneKb, i * 1024);
}

for (const digestAlgorithm of digestAlgorithms) {
  Deno.bench(`digest ${digestAlgorithm} 1kb`, () => {
    const digest = crypto.digest(digestAlgorithm, oneKb, undefined);
  });

  Deno.bench(`digest ${digestAlgorithm} 1mb`, () => {
    const digest = crypto.digest(digestAlgorithm, oneMb, undefined);
  });
}
