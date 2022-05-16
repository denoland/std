import { run } from "./benchmark.js";
import Redis from "ioredis";

const redis = new Redis();
redis.on("connect", async () => {
  await run({
    client: redis,
    driver: "ioredis",
  });

  redis.disconnect();
});
