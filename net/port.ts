// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** Returns an available port */
export function getAvailablePort(): number {
  const tmp = Deno.listen({ port: 0 });
  const { port } = tmp.addr as Deno.NetAddr;
  tmp.close();
  return port;
}
