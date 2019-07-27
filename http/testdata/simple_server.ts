import { serve } from "../server.ts";

window.onload = async function main() {
  const addr = "0.0.0.0:4502";
  console.log(`Simple server listening on ${addr}`);
  for await (let req of serve(addr)) {
    req.respond({});
  }
}
