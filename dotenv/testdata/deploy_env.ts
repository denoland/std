// @ts-ignore deploy doesn't have Deno.readFileSync
delete Deno.readTextFileSync;

await import("../load.ts");
