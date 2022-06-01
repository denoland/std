// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
export class MyMath {
  multiply(a: number, b: number): number {
    return a * b;
  }
}

export interface Container {
  id: number;
  values: number[];
}
