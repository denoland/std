// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { fromFileUrl } from "../../path/mod.ts";
import { readableStreamFromReader } from "../../streams/readable_stream_from_reader.ts";

const clients = new Map<number, WebSocket>();
let clientId = 0;
function dispatch(msg: string) {
  for (const client of clients.values()) {
    client.send(msg);
  }
}

function wsHandler(ws: WebSocket) {
  const id = ++clientId;
  clients.set(id, ws);
  ws.onopen = () => {
    dispatch(`Connected: [${id}]`);
  };
  ws.onmessage = (e) => {
    console.log(`msg:${id}`, e.data);
    dispatch(`[${id}]: ${e.data}`);
  };
  ws.onclose = () => {
    clients.delete(id);
    dispatch(`Closed: [${id}]`);
  };
}

async function requestHandler(req: Deno.RequestEvent) {
  const pathname = new URL(req.request.url).pathname;
  if (req.request.method === "GET" && pathname === "/") {
    //Serve with hack
    const u = new URL("./index.html", import.meta.url);
    if (u.protocol.startsWith("http")) {
      // server launched by deno run http(s)://.../server.ts,
      fetch(u.href).then(async (resp) => {
        const body = new Uint8Array(await resp.arrayBuffer());
        req.respondWith(
          new Response(body, {
            status: resp.status,
            headers: {
              "content-type": "text/html",
            },
          }),
        );
      });
    } else {
      // server launched by deno run ./server.ts
      const file = await Deno.open(fromFileUrl(u));
      req.respondWith(
        new Response(readableStreamFromReader(file), {
          status: 200,
          headers: {
            "content-type": "text/html",
          },
        }),
      );
    }
  } else if (
    req.request.method === "GET" && pathname === "/favicon.ico"
  ) {
    req.respondWith(Response.redirect("https://deno.land/favicon.ico", 302));
  } else if (req.request.method === "GET" && pathname === "/ws") {
    const { socket, response } = Deno.upgradeWebSocket(req.request);
    wsHandler(socket);
    req.respondWith(response);
  }
}

const server = Deno.listen({ port: 8080 });
console.log("chat server starting on :8080....");

for await (const conn of server) {
  (async () => {
    const httpConn = Deno.serveHttp(conn);
    for await (const requestEvent of httpConn) {
      requestHandler(requestEvent);
    }
  })();
}
