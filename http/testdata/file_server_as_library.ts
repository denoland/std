import { serveFile } from "../file_server.ts";

Deno.serve(
  // deno-lint-ignore no-console
  { port: 8000, onListen: () => console.log("Server running...") },
  (req) => {
    return serveFile(req, "./testdata/hello.html");
  },
);
