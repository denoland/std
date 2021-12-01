import { listenAndServe } from "../server.ts";
import { serveFile } from "../file_server.ts";

listenAndServe({ port: 8000 }, (req) => {
  return serveFile(req, "./testdata/hello.html");
});

console.log("Server running...");
