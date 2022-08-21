// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from '../testing/asserts.ts';
import { decode, encode } from './base58.ts';

const testSetString = [
	['', ''],
	['f', '2m'],
	['ß', 'FtS'],
	['fo', '8o8'],
	['foo', 'bQbp'],
	['foob', '3csAg9'],
	['fooba', 'CZJRhmz'],
	['foobar', 't1Zv2yaZ'],
	['Hello World!', '2NEpo7TZRRrLZSi2U']
];

const testSetBinary = testSetString.map(([data, b58]) => [
	new TextEncoder().encode(data),
	b58
]) as Array<[Uint8Array, string]>;

Deno.test('[encoding/base58] testBase58EncodeString', () => {
	for (const [input, output] of testSetString) {
		assertEquals(encode(input), output);
	}
});

Deno.test('[encoding/base58] testBase58EncodeBinary', () => {
	for (const [input, output] of testSetBinary) {
		assertEquals(encode(input), output);
	}
});

Deno.test('[encoding/base64] testBase64EncodeBinaryBuffer', () => {
	for (const [input, output] of testSetBinary) {
		assertEquals(encode(input.buffer), output);
	}
});

Deno.test('[encoding/base64] testBase64DecodeBinary', () => {
	for (const [input, output] of testSetBinary) {
		const outputBinary = decode(output);
		assertEquals(outputBinary, input);
	}
});
