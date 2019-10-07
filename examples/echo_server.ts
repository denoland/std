// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { listen, copy } = Deno;

(async (): Promise<void> => {
  const hostname = "0.0.0.0";
  const port = 8080;
  const listener = listen({ hostname, port });
  console.log("listening on", addr);
  while (true) {
    const conn = await listener.accept();
    copy(conn, conn);
  }
})();
