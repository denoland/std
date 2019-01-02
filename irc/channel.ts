// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

export type ChannelType =
  | "+b"
  // | "+e"
  | "+l"
  | "+i"
  // | "+I"
  | "+k"
  | "+m"
  | "+s"
  | "+t"
  | "+n";

export class Channel {
  public name: string;

  public types: Set<ChannelType> = new Set();

  constructor(name: string) {
    this.name = name;
  }
}
