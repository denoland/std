// Copyright 2018-2025 the Deno authors. MIT license.
export class MyMath {
  multiply(a: number, b: number): number {
    return a * b;
  }
}

export interface Container {
  id: number;
  values: number[];
}
