// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

/** Create dummy `Deno.Conn` object with given base properties. */
export function mockConn(base: Partial<Deno.Conn> = {}): Deno.Conn {
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
    // TODO(ry) Remove the following ts-ignore.
    // @ts-ignore This was added to workaround incompatibilities between Deno versions.
    setNoDelay: (_nodelay?: boolean): void => {},
    // @ts-ignore This was added to workaround incompatibilities between Deno versions.
    setKeepAlive: (_keepalive?: boolean): void => {},
    ...base,
  };
}
