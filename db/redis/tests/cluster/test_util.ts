import { nextPort, startRedis, stopRedis } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";
import { readAll } from "../../../../io/util.ts";
import { delay } from "../../../../async/delay.ts";

export interface TestCluster {
  servers: TestServer[];
}

export async function startRedisCluster(ports: number[]): Promise<TestCluster> {
  const servers = await Promise.all(ports.map((port) =>
    startRedis({
      port,
      clusterEnabled: true,
      makeClusterConfigFile: true,
    })
  ));
  const cluster = { servers };
  const redisCLI = Deno.run({
    cmd: [
      "redis-cli",
      "--cluster",
      "create",
      ...ports.map((port) => `127.0.0.1:${port}`),
      "--cluster-replicas",
      "1",
      "--cluster-yes",
    ],
    stderr: "piped",
  });
  try {
    // Wait for cluster setup to complete...
    const status = await redisCLI.status();
    if (!status.success) {
      stopRedisCluster(cluster);
      const errOutput = await readAll(redisCLI.stderr);
      const decoder = new TextDecoder();
      throw new Error(`Failed to setup cluster: ${decoder.decode(errOutput)}`);
    }

    // Ample time for cluster to finish startup
    await delay(5000);

    return cluster;
  } finally {
    tryClose(redisCLI.stderr);
    tryClose(redisCLI);
  }
}

function tryClose(closer: Deno.Closer): void {
  try {
    closer.close();
  } catch (error) {
    if (!(error instanceof Deno.errors.BadResource)) {
      throw error;
    }
  }
}

export function stopRedisCluster(cluster: TestCluster): void {
  for (const server of cluster.servers) {
    stopRedis(server);
  }
}

export function nextPorts(n: number): Array<number> {
  return Array(n).fill(0).map(() => nextPort());
}
