function main(args: string[]) {
  const msg = args.join(", ");
  Deno.stdout.write(new TextEncoder().encode(msg));
}

main(Deno.args.slice(1));
