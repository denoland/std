// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/** Create dummy Deno.Conn object with given base properties */
export function mockConn(
  base: Partial<Deno.Conn> = {},
): Deno.Conn<Deno.NetAddr> {
  return {
    localAddr: {
      transport: "tcp",
      hostname: "",
      port: 0,
    },
    remoteAddr: {
      transport: "tcp",
      hostname: "",
      port: 0,
    },
    rid: -1,
    closeWrite: () => {
      return Promise.resolve();
    },
    read: (): Promise<number | null> => {
      return Promise.resolve(0);
    },
    write: (): Promise<number> => {
      return Promise.resolve(-1);
    },
    close: (): void => {},
    ...base,
  } as Deno.Conn<Deno.NetAddr>;
}
