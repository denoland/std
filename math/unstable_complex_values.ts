// Copyright 2018-2026 the Deno authors. MIT license.

type SimpleSpecialValues = [[number, number], [number, number]][];

export const simpleSpecialValues = {
  exp: [
    [[0, 0], [1, 0]],
    [[-0, 0], [1, 0]],
    [[Infinity, 0], [Infinity, 0]],
    [[-Infinity, Infinity], [0, 0]], // Unspecified real & imag output sign
    [[Infinity, Infinity], [Infinity, NaN]], // Unspecified real output sign
    [[-Infinity, NaN], [0, 0]], // Unspecified real & imag output sign
    [[Infinity, NaN], [-Infinity, NaN]], // Unspecified real & imag output sign
    [[NaN, 0], [NaN, 0]],
    [[NaN, NaN], [NaN, NaN]],
  ],
  sinh: [
    [[0, 0], [0, 0]],
    [[0, Infinity], [0, NaN]], // Unspecified real output sign
    [[0, NaN], [0, NaN]], // Unspecified real output sign
    [[Infinity, 0], [Infinity, 0]],
    [[Infinity, Infinity], [Infinity, NaN]], // Unspecified real output sign
    [[Infinity, NaN], [Infinity, NaN]], // Unspecified real output sign
    [[NaN, 0], [NaN, 0]],
    [[NaN, NaN], [NaN, NaN]],
  ],
  cosh: [
    [[0, 0], [1, 0]],
    [[0, Infinity], [NaN, 0]], // Unspecified imag output sign
    [[0, NaN], [NaN, 0]], // Unspecified imag output sign
    [[Infinity, 0], [Infinity, 0]],
    [[Infinity, Infinity], [Infinity, NaN]], // Unspecified real output sign
    [[Infinity, NaN], [Infinity, NaN]],
    [[NaN, 0], [NaN, 0]], // Unspecified imag output sign
    [[NaN, NaN], [NaN, NaN]],
  ],
  tanh: [
    [[0, 0], [0, 0]],
    [[0, Infinity], [0, NaN]],
    [[0, NaN], [Infinity, Infinity]],
    [[Infinity, Infinity], [1, 0]], // Unspecified imag output sign
    [[Infinity, NaN], [1, 0]], // Unspecified imag output sign
    [[NaN, 0], [NaN, 0]],
    [[NaN, NaN], [NaN, NaN]],
  ],
  asinh: [
    [[0, 0], [0, 0]],
    [[Infinity, Infinity], [NaN, Math.PI / 4]],
    [[Infinity, NaN], [Infinity, NaN]],
    [[NaN, 0], [NaN, 0]],
    [[NaN, Infinity], [Infinity, NaN]], // Unspecified real output sign
    [[NaN, NaN], [NaN, NaN]],
  ],
  acosh: [
    [[0, 0], [0, Math.PI / 2]],
    [[-0, 0], [0, Math.PI / 2]],
    [[0, NaN], [NaN, Math.PI / 2]], // Unspecified imag output sign
    [[-Infinity, Infinity], [Infinity, 3 * Math.PI / 4]],
    [[Infinity, Infinity], [Infinity, Math.PI / 4]],
    [[Infinity, NaN], [Infinity, NaN]],
    [[-Infinity, NaN], [Infinity, NaN]],
    [[NaN, Infinity], [Infinity, NaN]],
    [[NaN, NaN], [NaN, NaN]],
  ],
  atanh: [
    [[0, 0], [0, 0]],
    [[0, NaN], [0, NaN]],
    [[1, 0], [Infinity, 0]],
    [[Infinity, Infinity], [0, Math.PI / 2]],
    [[NaN, Infinity], [0, Math.PI / 2]], // Unspecified real output sign
    [[NaN, NaN], [NaN, NaN]],
  ],
  acos: [
    [[0, 0], [Math.PI / 2, -0]],
    [[-0, 0], [Math.PI / 2, -0]],
    [[0, NaN], [Math.PI / 2, NaN]],
    [[-0, NaN], [Math.PI / 2, NaN]],
    [[-Infinity, Infinity], [Math.PI * 3 / 4, -Infinity]],
    [[Infinity, Infinity], [Math.PI / 4, -Infinity]],
    [[Infinity, NaN], [NaN, Infinity]], // Unspecified imag output sign
    [[-Infinity, NaN], [NaN, Infinity]], // Unspecified imag output sign
    [[NaN, Infinity], [NaN, -Infinity]],
    [[NaN, NaN], [NaN, NaN]],
  ],
} as const satisfies Record<string, SimpleSpecialValues>;
