import { run } from "./benchmark.js";
import { connect } from "../mod.ts";

const redis = await connect({ hostname: "127.0.0.1" });
try {
  await run({
    client: redis,
    driver: "deno-redis",
  });
} finally {
  await redis.quit();
}
