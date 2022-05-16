import { nextPort, startRedis, stopRedis } from "./test_util.ts";
import type { TestServer } from "./test_util.ts";
import { aclTests } from "./commands/acl.ts";
import { connectionTests } from "./commands/connection.ts";
import { generalTests } from "./commands/general.ts";
import { geoTests } from "./commands/geo.ts";
import { hashTests } from "./commands/hash.ts";
import { hyperloglogTests } from "./commands/hyper_loglog.ts";
import { keyTests } from "./commands/key.ts";
import { listTests } from "./commands/list.ts";
import { pipelineTests } from "./commands/pipeline.ts";
import { pubsubTests } from "./commands/pubsub.ts";
import { setTests } from "./commands/set.ts";
import { zsetTests } from "./commands/sorted_set.ts";
import { scriptTests } from "./commands/script.ts";
import { streamTests } from "./commands/stream.ts";
import { stringTests } from "./commands/string.ts";

import { afterAll, beforeAll, describe } from "../../../testing/bdd.ts";

describe("commands", () => {
  let port!: number;
  let server!: TestServer;
  beforeAll(async () => {
    port = nextPort();
    server = await startRedis({ port });
  });
  afterAll(() => stopRedis(server));

  const getServer = () => server;

  describe("acl", () => aclTests(getServer));
  describe("connection", () => connectionTests(getServer));
  describe("general", () => generalTests(getServer));
  describe("geo", () => geoTests(getServer));
  describe("hash", () => hashTests(getServer));
  describe("hyperloglog", () => hyperloglogTests(getServer));
  describe("key", () => keyTests(getServer));
  describe("list", () => listTests(getServer));
  describe("pipeline", () => pipelineTests(getServer));
  describe("pubsub", () => pubsubTests(getServer));
  describe("set", () => setTests(getServer));
  describe("zset", () => zsetTests(getServer));
  describe("script", () => scriptTests(getServer));
  describe("stream", () => streamTests(getServer));
  describe("string", () => stringTests(getServer));
});
