function main(args: string[]) {
  const msg = args.join(",");
  console.log(msg);
}

main(Deno.args.slice(1));
