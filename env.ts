// Works under both Node.js and Deno. Env vars are expected to already be
// loaded - via `node --env-file=.env` or `deno run --env-file=.env`
// (both runtimes support this flag natively, no extra dependency needed).
declare const Deno: { env: { get(key: string): string | undefined } } | undefined;

export function getEnv(name: string): string | undefined {
  if (typeof Deno !== "undefined") {
    return Deno.env.get(name);
  }
  return process.env[name];
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error("Copy .env.example to .env and fill it in.");
    const exit = typeof Deno !== "undefined" ? (Deno as any).exit : process.exit;
    exit(1);
  }
  return value as string;
}
