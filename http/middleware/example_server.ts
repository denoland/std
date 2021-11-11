import { chain, serve } from "../mod.ts";
import { handleGreetings, log, validate, yaml } from "./example_middleware.ts";

const handler = chain(log)
  .add(yaml)
  .add(validate)
  .add(handleGreetings);

await serve(handler);
